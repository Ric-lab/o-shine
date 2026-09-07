import { useRef, useEffect, useCallback } from 'react';

export function useSound(src, options = { volume: 1.0, loop: false, multi: false }) {
    const audioRef = useRef(null);
    const poolRef = useRef([]); // For multi-shot sounds

    // Track options with a ref to keep callbacks stable
    const optionsRef = useRef(options);

    // Update ref when options change
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    useEffect(() => {
        // Initialize main audio (Only when SRC changes)
        const audio = new Audio(src);
        audioRef.current = audio;

        // Apply initial settings
        audio.volume = optionsRef.current?.volume ?? 1.0;
        audio.loop = optionsRef.current?.loop ?? false;

        return () => {
            audio.pause();
            if (audioRef.current === audio) {
                audioRef.current = null;
            }
            // Cleanup pool
            poolRef.current.forEach(a => a.pause());
            poolRef.current = [];
        };
    }, [src]);

    // React to Volume/Loop changes properly (Dynamic update)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = options.volume;
            audioRef.current.loop = options.loop;
        }
    }, [options.volume, options.loop]);

    const play = useCallback((overrideOptions = {}) => {
        if (!audioRef.current) return;

        const opts = optionsRef.current;
        const rate = overrideOptions.playbackRate || 1.0;

        if (opts.multi) {
            // Clone for overlapping sounds
            if (poolRef.current.length > 10) {
                const available = poolRef.current.find(a => a.ended || a.paused);
                if (available) {
                    available.currentTime = 0;
                    available.volume = opts.volume; // Reset volume in case it changed
                    available.playbackRate = rate;
                    available.play().catch(e => console.warn("Audio play error", e));
                    return;
                }
            }

            const clone = audioRef.current.cloneNode();
            clone.volume = opts.volume;
            clone.playbackRate = rate;
            clone.play().catch(e => console.warn("Audio play error", e));
            poolRef.current.push(clone);

            if (poolRef.current.length > 20) {
                poolRef.current = poolRef.current.filter(a => !a.ended);
            }
        } else {
            // Single track
            // If already playing in loop, don't interrupt it
            if (opts.loop && !audioRef.current.paused) {
                return Promise.resolve();
            }

            if (audioRef.current.currentTime > 0 && !audioRef.current.paused) {
                audioRef.current.currentTime = 0;
            }
            // CRITICAL: Force loop property before playing (Native Audio sometimes resets or ignores dynamic prop)
            audioRef.current.loop = opts.loop;
            audioRef.current.playbackRate = rate;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                    // Suppress unhandled rejection when browser autoplay policy blocks audio
                });
            }
            return playPromise;
        }
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, []);

    const setVolume = useCallback((vol) => {
        if (audioRef.current) audioRef.current.volume = vol;
    }, []);

    return { play, stop, setVolume };
}
