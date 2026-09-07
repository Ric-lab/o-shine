import { useEffect, useState } from 'react';
import { createAutomaticProgress } from '../services/automaticProgress.js';
import { googleDrive, googleLoginAvailable } from '../services/googleDrive.js';
import { loadJSON, saveJSON, flushStorage } from '../utils/storage.js';

const KEY = 'bplm.cloud.v2';
export function useAutomaticProgress({ progress, ready, canRestore, apply }) {
    const [state, setState] = useState({ status: 'local', account: null, conflicts: [] });
    const [booting, setBooting] = useState(true);
    const [controller] = useState(() => createAutomaticProgress({
        drive: googleDrive, load: () => loadJSON(KEY), save: value => saveJSON(KEY, value),
        notify: setState,
    }));
    useEffect(() => {
        controller.setApply(async value => {
            apply(value);
            await saveJSON('bplm.gameLogic.v1', value);
        });
    }, [controller, apply]);
    useEffect(() => {
        if (!ready) return;
        controller.update(progress, canRestore);
        if (!googleLoginAvailable) return;
        const timer = setTimeout(() => controller.sync(), 2000);
        return () => clearTimeout(timer);
    }, [controller, progress, ready, canRestore]);
    useEffect(() => {
        if (!ready) return;
        let active = true;
        const start = async () => {
            if (googleLoginAvailable) await controller.start();
            if (active) setBooting(false);
        };
        start();
        const retry = () => {
            flushStorage().catch(() => {});
            if (googleLoginAvailable) controller.sync();
        };
        const interval = setInterval(retry, 15000);
        window.addEventListener('online', retry);
        window.addEventListener('pageshow', retry);
        document.addEventListener('visibilitychange', retry);
        return () => {
            active = false;
            clearInterval(interval);
            window.removeEventListener('online', retry);
            window.removeEventListener('pageshow', retry);
            document.removeEventListener('visibilitychange', retry);
        };
    }, [controller, ready]);
    return { ...state, booting, controller, available: googleLoginAvailable };
}
