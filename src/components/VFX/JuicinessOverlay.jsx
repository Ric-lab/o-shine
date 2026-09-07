import { useState, useEffect, useRef } from 'react';
import { vfxBus } from '../../services/vfxBus.js';

/**
 * Screen Shake and Bouncy 3D Floating Text Overlay for O-Shine.
 * Renders juicy arcade floating rewards and handles full-screen micro-tremors.
 */
export default function JuicinessOverlay() {
    const [floatingTexts, setFloatingTexts] = useState([]);
    const [isShaking, setIsShaking] = useState(false);
    const shakeTimeoutRef = useRef(null);

    // Listen for screen shake events
    useEffect(() => {
        const unsubscribe = vfxBus.on('screen-shake', ({ duration = 60 }) => {
            setIsShaking(true);
            clearTimeout(shakeTimeoutRef.current);
            shakeTimeoutRef.current = setTimeout(() => {
                setIsShaking(false);
            }, duration);
        });

        return () => {
            unsubscribe();
            clearTimeout(shakeTimeoutRef.current);
        };
    }, []);

    // Listen for floating text events
    useEffect(() => {
        const unsubscribe = vfxBus.on('floating-text', (payload) => {
            const id = Math.random().toString(36).substring(2, 9);
            const newText = {
                id,
                text: payload.text || '',
                x: payload.origin?.x ?? window.innerWidth / 2,
                y: payload.origin?.y ?? window.innerHeight / 2,
                type: payload.type || 'gold',
                duration: payload.duration || 1200
            };

            setFloatingTexts((prev) => [...prev, newText]);

            setTimeout(() => {
                setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
            }, newText.duration);
        });

        return () => unsubscribe();
    }, []);

    return (
        <>
            {/* Screen Shake Fullscreen Class Helper */}
            {isShaking && (
                <div
                    className="fixed inset-0 pointer-events-none z-40 animate-shake"
                    style={{
                        animation: 'screenShake 0.07s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite'
                    }}
                />
            )}

            {/* Floating 3D Text Container */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                {floatingTexts.map((item) => {
                    let colorClasses = 'text-yellow-300 drop-shadow-[0_4px_12px_rgba(234,179,8,0.9)]';
                    if (item.type === 'combo') {
                        colorClasses = 'text-pink-400 drop-shadow-[0_4px_12px_rgba(236,72,153,0.9)]';
                    } else if (item.type === 'win') {
                        colorClasses = 'text-amber-400 text-3xl font-black drop-shadow-[0_4px_16px_rgba(245,158,11,1)]';
                    }

                    return (
                        <div
                            key={item.id}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 font-black italic tracking-wider select-none animate-floatUp ${colorClasses}`}
                            style={{
                                left: item.x,
                                top: item.y,
                                animationDuration: `${item.duration}ms`,
                                textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 0 10px currentColor'
                            }}
                        >
                            {item.text}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
