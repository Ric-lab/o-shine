import { validateProgress } from '../utils/progress.js';

const signature = value => JSON.stringify(validateProgress(value));
const initialProgress = { coins: 1000, levels: { FINGO: 1, BINGO: 1, SPINGO: 1 } };

// No network or React dependencies: the same state machine runs in the app and tests.
export function createAutomaticProgress({ drive, load, save, apply, notify = () => {},
    id = () => crypto.randomUUID() }) {
    let meta = { account: null, owner: null, base: null, heads: [] };
    let progress = null;
    let canRestore = true;
    let operation = null;
    let conflicts = [];
    let loaded = false;
    const emit = (status, extra = {}) => notify({ status, account: meta.account, conflicts, ...extra });
    const persist = () => save(JSON.parse(JSON.stringify(meta)));
    const adopt = async remote => {
        if (!canRestore) throw new Error('Volte ao início para recuperar o progresso.');
        emit('restoring');
        // Persist progress before acknowledging a cloud revision. If interrupted,
        // the next launch can safely adopt it again.
        await apply(remote.progress);
        progress = validateProgress(remote.progress);
        meta.base = signature(progress);
        meta.heads = [remote.revision];
        delete meta.pending;
        await persist();
    };
    async function reconcile() {
        if (!meta.account || !progress) { emit('local'); return; }
        emit('syncing');
        await drive.resume(meta.account);
        const remote = await drive.heads();
        const remoteIds = remote.map(item => item.revision).sort();
        // An uncertain previous upload may already exist. Recognize its revision
        // without crediting/merging coins or uploading a duplicate reward.
        if (meta.pending && remote.length === 1 && remote[0].revision === meta.pending.revision) {
            meta.base = signature(meta.pending.progress);
            meta.heads = remoteIds;
            delete meta.pending;
            await persist();
        }
        const unchanged = JSON.stringify(remoteIds) === JSON.stringify([...meta.heads].sort());
        const dirty = meta.base !== signature(progress);
        const resolving = JSON.stringify(meta.resolutionHeads) === JSON.stringify(remoteIds);
        const fresh = !meta.base && !meta.owner && signature(progress) === signature(initialProgress);
        if (!resolving && (remote.length > 1 || (meta.owner && meta.owner !== meta.account.userId) ||
            (remote.length === 1 && !unchanged && dirty && !fresh &&
             signature(remote[0].progress) !== signature(progress)))) {
            conflicts = remote;
            emit('conflict');
            return;
        }
        if (remote.length === 1 && !unchanged) {
            if (!canRestore) { emit('waiting-home'); return; }
            await adopt(remote[0]);
        }
        meta.owner = meta.account.userId;
        if (meta.base === signature(progress) && remote.length) {
            await persist();
            conflicts = [];
            emit('saved');
            return;
        }
        const snapshot = validateProgress(progress);
        // Save a durable outbox before network I/O. Preserve its id across retry.
        if (!meta.pending || signature(meta.pending.progress) !== signature(snapshot) ||
            JSON.stringify(meta.pending.parents) !== JSON.stringify(remoteIds)) {
            meta.pending = { revision: id(), parents: remoteIds, progress: snapshot };
        }
        await persist();
        const outgoing = meta.pending;
        await drive.save(outgoing.progress, { revision: outgoing.revision, parents: outgoing.parents });
        meta.base = signature(outgoing.progress);
        meta.heads = [outgoing.revision];
        delete meta.pending;
        delete meta.resolutionHeads;
        await persist();
        conflicts = [];
        emit(signature(progress) === meta.base ? 'saved' : 'pending');
    }
    function run(task) {
        if (operation) return operation;
        operation = (async () => {
            try { await task(); }
            catch (error) { emit(error.code === 'AUTH_REQUIRED' ? 'auth-required' : 'pending'); }
            finally { operation = null; }
        })();
        return operation;
    }
    async function initialize() {
        if (!loaded) {
            const stored = await load();
            if (stored) {
                if (!Array.isArray(stored.heads) || (stored.account && !stored.account.userId)) throw new Error('Estado de sincronização inválido.');
                meta = stored;
            }
            loaded = true;
        }
        await reconcile();
    }
    return {
        setApply(callback) { apply = callback; },
        update(value, allowRestore) { progress = validateProgress(value); canRestore = allowRestore; },
        start: () => run(initialize),
        sync: () => run(initialize),
        connect: () => run(async () => {
            if (!loaded || !canRestore) return;
            emit('connecting');
            meta.account = await drive.connect();
            await persist();
            await reconcile();
        }),
        disconnect: () => run(async () => {
            meta.account = null;
            delete meta.pending;
            conflicts = [];
            await persist();
            await drive.disconnect();
            emit('local');
        }),
        choose: revision => run(async () => {
            if (!canRestore || !meta.account) return;
            emit('syncing');
            // Fetch again: never resolve a conflict based on stale UI data.
            await drive.resume(meta.account);
            const remote = await drive.heads();
            let selected = progress;
            if (revision !== 'local') {
                const choice = remote.find(item => item.revision === revision);
                if (!choice) { conflicts = remote; emit('conflict'); return; }
                selected = choice.progress;
            }
            if (!canRestore) { emit('waiting-home'); return; }
            emit('restoring');
            await apply(validateProgress(selected));
            progress = validateProgress(selected);
            meta.owner = meta.account.userId;
            meta.heads = remote.map(item => item.revision).sort();
            meta.resolutionHeads = meta.heads;
            // Force a merge snapshot with all current heads as parents.
            meta.base = null;
            delete meta.pending;
            await persist();
            conflicts = [];
            await reconcile();
        }),
    };
}
