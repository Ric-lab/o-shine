import { Capacitor, registerPlugin } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { createBackup, readBackup } from '../utils/progress.js';

const CLIENT_ID = import.meta.env?.VITE_GOOGLE_WEB_CLIENT_ID?.trim();
export const googleLoginAvailable = Capacitor.getPlatform() === 'android' && !!CLIENT_ID;
const FILE_NAME = 'bplm-progress-v1.json';
const DriveSession = registerPlugin('DriveSession');

// Tokens live only in memory; previously granted authorization resumes without UI.
export function createDriveClient({ auth = GoogleSignIn, fetcher = fetch, clientId = CLIENT_ID, silentAuth = DriveSession } = {}) {
    let session = null;
    let initialized = false;
    async function silentResume(email) {
        let timeout;
        try {
            return await Promise.race([
                silentAuth.resume({ email }),
                new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Google indisponível.')), 12000); }),
            ]);
        } finally { clearTimeout(timeout); }
    }
    async function request(url, options = {}, retry = true) {
        if (!session) throw new Error('Entre com Google novamente.');
        const response = await fetcher(url, {
            ...options,
            signal: AbortSignal.timeout(10000),
            headers: { ...options.headers, Authorization: `Bearer ${session.accessToken}` },
        });
        if (response.status === 401) {
            const old = session;
            session = null;
            if (retry && old.email) {
                await silentAuth.invalidate({ accessToken: old.accessToken });
                const refreshed = await silentResume(old.email);
                session = { ...old, accessToken: refreshed.accessToken };
                return request(url, options, false);
            }
            throw new Error('Sua sessão expirou. Entre com Google novamente.');
        }
        if (!response.ok) throw new Error('Não foi possível acessar o Drive. Confira a conexão e a permissão da conta.');
        return response;
    }
    return {
        async connect() {
            session = null;
            if (!clientId) throw new Error('Login Google ainda não configurado nesta versão.');
            if (!initialized) {
                await auth.initialize({ clientId, scopes: ['https://www.googleapis.com/auth/drive.appdata'] });
                initialized = true;
            }
            const result = await auth.signIn();
            if (!result.accessToken || !result.userId) throw new Error('Autorize o acesso ao backup no Drive.');
            session = { accessToken: result.accessToken, userId: result.userId, email: result.email };
            return { userId: result.userId, email: result.email, displayName: result.displayName };
        },
        async resume(account) {
            session = null;
            const result = await silentResume(account.email);
            if (!result.accessToken) throw new Error('Confirme sua conta Google.');
            session = { ...account, accessToken: result.accessToken };
        },
        async disconnect() {
            session = null;
            await auth.signOut();
        },
        async latest() {
            const userId = session?.userId;
            const query = new URLSearchParams({
                spaces: 'appDataFolder', q: `name = '${FILE_NAME}' and trashed = false`,
                fields: 'files(id,createdTime)', orderBy: 'createdTime desc', pageSize: '1',
            });
            const list = await (await request(`https://www.googleapis.com/drive/v3/files?${query}`)).json();
            if (!list.files?.length) return null;
            const id = encodeURIComponent(list.files[0].id);
            const data = await (await request(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`)).json();
            return readBackup(data, userId);
        },
        async heads() {
            const files = [];
            let pageToken = '';
            do {
                const query = new URLSearchParams({
                    spaces: 'appDataFolder', q: `name = '${FILE_NAME}' and trashed = false`,
                    fields: 'nextPageToken,files(id,createdTime,description)', pageSize: '1000',
                    orderBy: 'createdTime', ...(pageToken ? { pageToken } : {}),
                });
                const page = await (await request(`https://www.googleapis.com/drive/v3/files?${query}`)).json();
                files.push(...(page.files || []));
                pageToken = page.nextPageToken || '';
            } while (pageToken);
            let previousLegacy = null;
            const nodes = files.map(file => {
                if (file.description?.startsWith('bplm:')) {
                    const meta = JSON.parse(file.description.slice(5));
                    if (typeof meta.revision !== 'string' || !meta.revision || !Array.isArray(meta.parents) ||
                        meta.parents.some(parent => typeof parent !== 'string' || !parent || parent === meta.revision)) throw new Error('Histórico inválido.');
                    return { ...file, revision: meta.revision, parents: meta.parents };
                }
                const revision = `legacy:${file.id}`;
                const node = { ...file, revision, parents: previousLegacy ? [previousLegacy] : [] };
                previousLegacy = revision;
                return node;
            });
            const parents = new Set(nodes.flatMap(node => node.parents));
            const unique = new Map(nodes.filter(node => !parents.has(node.revision)).map(node => [node.revision, node]));
            if (nodes.length && !unique.size) throw new Error('Histórico sem uma revisão recuperável.');
            return Promise.all([...unique.values()].map(async node => {
                const data = await (await request(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(node.id)}?alt=media`)).json();
                const backup = readBackup(data, session.userId);
                return { ...backup, revision: node.revision, parents: node.parents };
            }));
        },
        async save(progress, revisionInfo = {}) {
            const backup = { ...createBackup(progress, session?.userId), ...revisionInfo };
            // Append a snapshot: never overwrite a backup made on another device.
            const boundary = 'bplm_backup_boundary';
            const metadata = { name: FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json',
                ...(backup.revision ? { description: 'bplm:' + JSON.stringify({ revision: backup.revision, parents: backup.parents }) } : {}) };
            const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(backup)}\r\n--${boundary}--`;
            await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
            });
            return backup;
        },
    };
}

export const googleDrive = createDriveClient();
