import { useEffect, useRef, useState, useCallback } from 'react';
import { rewardedAds } from '../services/rewardedAds.js';

export function useRewardedAd(service = rewardedAds) {
    const [busy, setBusy] = useState(false);
    const locked = useRef(false);
    const generation = useRef(0);
    useEffect(() => () => { generation.current++; }, []);
    const watch = useCallback(async grant => {
        if (locked.current) return false;
        locked.current = true;
        const current = generation.current;
        setBusy(true);
        try {
            const earned = await service.show();
            if (current !== generation.current) return false;
            if (earned) return grant() !== false;
            return false;
        } finally {
            locked.current = false;
            if (current === generation.current) setBusy(false);
        }
    }, [service]);
    return { busy, watch };
}
