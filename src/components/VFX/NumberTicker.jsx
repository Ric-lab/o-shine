import { useState, useEffect, useRef } from 'react';
import { playOdometerTick } from '../../utils/audioJuice.js';
import { vfxBus } from '../../services/vfxBus.js';

/**
 * Mechanical, smooth rolling number odometer for coins and scores.
 * Features ease-out number rolling, squash & stretch scale bounce, and haptic clicks.
 */
export default function NumberTicker({
    value = 0,
    className = '',
    duration = 500,
    showPunch = true
}) {
    const [displayValue, setDisplayValue] = useState(value);
    const [isBumping, setIsBumping] = useState(false);
    const animRef = useRef(null);
    const prevValueRef = useRef(value);
    const lastTickTimeRef = useRef(0);
    const bumpTimeoutRef = useRef(null);

    // Listen to coin landed notifications to bump the counter immediately
    useEffect(() => {
        const unsubscribe = vfxBus.on('coin-landed', () => {
            if (!showPunch) return;
            setIsBumping(true);
            clearTimeout(bumpTimeoutRef.current);
            bumpTimeoutRef.current = setTimeout(() => {
                setIsBumping(false);
            }, 120);
        });
        return () => {
            unsubscribe();
            clearTimeout(bumpTimeoutRef.current);
        };
    }, [showPunch]);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const targetValue = value;
        prevValueRef.current = value;

        if (startValue === targetValue) {
            return;
        }

        const delta = targetValue - startValue;
        if (delta > 0 && showPunch) {
            queueMicrotask(() => {
                setIsBumping(true);
                clearTimeout(bumpTimeoutRef.current);
                bumpTimeoutRef.current = setTimeout(() => setIsBumping(false), 150);
            });
        }

        const startTime = performance.now();

        const updateTicker = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Smooth ease-out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + delta * easeProgress);

            setDisplayValue(current);

            // Play mechanical tick sound (throttled to at most every 45ms)
            if (now - lastTickTimeRef.current > 45 && progress < 1) {
                playOdometerTick(0.25);
                lastTickTimeRef.current = now;
            }

            if (progress < 1) {
                animRef.current = requestAnimationFrame(updateTicker);
            } else {
                setDisplayValue(targetValue);
            }
        };

        animRef.current = requestAnimationFrame(updateTicker);

        return () => {
            if (animRef.current) {
                cancelAnimationFrame(animRef.current);
            }
        };
    }, [value, duration, showPunch]);

    return (
        <span
            className={`inline-block transition-transform duration-100 ease-out font-black select-none ${
                isBumping ? 'scale-125 text-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]' : 'scale-100'
            } ${className}`}
            style={{ willChange: 'transform' }}
        >
            {displayValue.toLocaleString()}
        </span>
    );
}
