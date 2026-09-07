import { useState } from 'react';
import { rewardedAds, adPrivacyAvailable } from '../services/rewardedAds.js';

const publicSite = (import.meta.env?.VITE_PUBLIC_SITE_URL?.trim() ||
    'https://ric-lab.github.io/Bingo-Plinko-Lucky-Machine').replace(/\/$/, '');

const messages = {
    local: 'Seu progresso é salvo automaticamente neste aparelho.',
    saved: 'Seu progresso está salvo no Google.',
    syncing: 'Sincronizando seu progresso…',
    connecting: 'Conectando sua conta…',
    restoring: 'Recuperando seu progresso…',
    pending: 'Backup pendente. Tentaremos novamente automaticamente.',
    'auth-required': 'Entre com Google novamente para retomar o backup automático.',
    'waiting-home': 'Seu backup será recuperado ao voltar ao início.',
    conflict: 'Encontramos progressos diferentes. Escolha qual deseja continuar.',
};

function ProgressSummary({ progress }) {
    return <p className="text-sm">Moedas: {progress.coins}<br />FINGO {progress.levels.FINGO} · BINGO {progress.levels.BINGO} · SPINGO {progress.levels.SPINGO}</p>;
}

export default function CloudBackup({ cloud, progress, canRestore }) {
    const [privacyBusy, setPrivacyBusy] = useState(false);
    const [message, setMessage] = useState('');
    const busy = privacyBusy || ['syncing', 'connecting', 'restoring'].includes(cloud.status);
    const button = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold disabled:opacity-40';
    return (
        <section className="px-4 py-3 space-y-2 border-t border-gray-200" aria-label="Backup e privacidade">
            <h3 className="font-bold text-gray-800">Seu progresso</h3>
            <p className="text-xs text-gray-600">Moedas e níveis são salvos automaticamente. A cartela em andamento não é salva.</p>
            <p role="status" className="text-sm">{messages[cloud.status]}</p>
            {!cloud.available ? <p className="text-sm text-gray-600">Backup Google indisponível nesta versão.</p> : <>
                {cloud.account && <p className="text-xs break-all">{cloud.account.email || cloud.account.displayName}</p>}
                {(!cloud.account || cloud.status === 'auth-required') && <>
                    <p className="text-xs">Conecte sua conta para recuperar seu progresso também ao trocar de aparelho.</p>
                    <button className={button} disabled={busy || !canRestore} onClick={() => cloud.controller.connect()}>Entrar com Google</button>
                </>}
                {!canRestore && <p className="text-xs">Volte ao início para conectar uma conta ou recuperar outro progresso.</p>}
                {cloud.status === 'conflict' && <div className="p-3 rounded-lg bg-amber-50 space-y-2">
                    <p className="text-xs">A escolha substitui moedas e níveis. Os saldos não são somados.</p>
                    <p className="font-semibold text-sm">Neste aparelho</p>
                    <ProgressSummary progress={progress} />
                    <button className={button} disabled={busy || !canRestore} onClick={() => cloud.controller.choose('local')}>Continuar com este aparelho</button>
                    {cloud.conflicts.map(backup => <div key={backup.revision} className="border-t border-amber-200 pt-2 space-y-2">
                        <p className="text-xs">Google: {new Date(backup.savedAt).toLocaleString()}</p>
                        <ProgressSummary progress={backup.progress} />
                        <button className={button} disabled={busy || !canRestore} onClick={() => cloud.controller.choose(backup.revision)}>Continuar com este backup</button>
                    </div>)}
                </div>}
                {cloud.account && <button className={button} disabled={busy} onClick={() => cloud.controller.disconnect()}>Desconectar Google</button>}
            </>}
            {adPrivacyAvailable && <button className={button} disabled={busy} onClick={async () => {
                setPrivacyBusy(true);
                try { setMessage(await rewardedAds.privacyOptions() || 'Preferências de anúncios atualizadas.'); }
                catch { setMessage('Não foi possível abrir as preferências. Tente novamente.'); }
                finally { setPrivacyBusy(false); }
            }}>Privacidade dos anúncios</button>}
            {message && <p role="status" className="text-sm">{message}</p>}
            <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label="Informações legais e suporte">
                <a className="underline" href={`${publicSite}/privacy.html`} target="_blank" rel="noreferrer">Privacidade</a>
                <a className="underline" href={`${publicSite}/terms.html`} target="_blank" rel="noreferrer">Termos</a>
                <a className="underline" href={`${publicSite}/support.html`} target="_blank" rel="noreferrer">Suporte</a>
            </nav>
        </section>
    );
}
