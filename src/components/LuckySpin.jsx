import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { vfxBus } from '../services/vfxBus.js';

// CONFIG: ORDER OF PRIZES ON THE WHEEL IMAGE (CLOCKWISE)
// IMPORTANT: Adjust this array to match your 'roleta.png' exactly!
const PRIZE_SLICES = [
    5, 50, 100, 250, 500, 1000, 2500, 5000, 7500, 10000
];

export default function LuckySpin({ spinLuckySpin, claimLuckySpinReward, completeLuckySpin, reward, playTicker }) {
    const [uiState, setUiState] = useState('IDLE'); // IDLE, SPINNING, SHOW_RESULT
    const [rotation, setRotation] = useState(0);
    const [displayReward, setDisplayReward] = useState(null);

    const wheelRef = useRef(null);
    const lastSlotRef = useRef(0);
    const playTickerRef = useRef(playTicker);
    const spinTimerRef = useRef(null);
    const spinStartedRef = useRef(false);
    useEffect(() => {
        playTickerRef.current = playTicker;
    }, [playTicker]);

    useEffect(() => () => clearTimeout(spinTimerRef.current), []);

    // Sound effect logic
    useEffect(() => {
        if (uiState !== 'SPINNING') return;

        let animationFrameId;

        const checkRotation = () => {
            if (wheelRef.current) {
                const style = window.getComputedStyle(wheelRef.current);
                const matrix = style.transform;

                if (matrix !== 'none') {
                    // matrix(a, b, c, d, tx, ty)
                    const values = matrix.split('(')[1].split(')')[0].split(',');
                    const a = parseFloat(values[0]);
                    const b = parseFloat(values[1]);

                    // Calculate angle in degrees
                    let angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));

                    // Normalize to 0-360 positive
                    if (angle < 0) angle += 360;

                    // Each slice is 36 degrees (360 / 10).
                    // We check which "slot" index the wheel is currently in.
                    // SHIFT: Add 18 degrees so the transition happens at the dividers, not the center.
                    const currentSlot = Math.floor((angle + 18) / 36);

                    if (currentSlot !== lastSlotRef.current) {
                        // Play sound via prop with Pentatonic Pitch Variation
                        if (playTickerRef.current) {
                            // Pentatonic C Major Intervals: 0, 2, 4, 7, 9, 12
                            const pentatonicSemitones = [0, 2, 4, 7, 9, 12];
                            const randomSemitone = pentatonicSemitones[Math.floor(Math.random() * pentatonicSemitones.length)];
                            const playbackRate = Math.pow(2, randomSemitone / 12);

                            playTickerRef.current({ playbackRate });
                        }
                        lastSlotRef.current = currentSlot;
                    }
                }
            }
            animationFrameId = requestAnimationFrame(checkRotation);
        };

        animationFrameId = requestAnimationFrame(checkRotation);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [uiState]);

    const handleSpin = () => {
        if (uiState !== 'IDLE' || spinStartedRef.current) return;
        spinStartedRef.current = true;
        setUiState('SPINNING');

        // 1. Get the result immediately so we know where to stop
        const wonPrize = spinLuckySpin(); // This returns the number (e.g., 500)

        // 2. Calculate stopping angle
        // Assume 10 slices = 36 degrees each
        const sliceAngle = 360 / PRIZE_SLICES.length;
        const prizeIndex = PRIZE_SLICES.indexOf(wonPrize);

        // If prize not found in config, default to 0 (safety)
        const targetIndex = prizeIndex === -1 ? 0 : prizeIndex;

        // Calculate rotation needed to put that slice at the TOP (pointer)
        // Note: CSS Rotate moves clockwise. If index 1 is at 36deg, and we want it at 0 (top),
        // we need to rotate somewhat differently depending on image orientation.
        // Assuming 0deg is Top for the image.
        // To point to slice N, we usually rotate NEGATIVE N * Angle? 
        // Or simplified: Target Rotation = (Full Spins) - (Index * Angle)

        // Let's do 5 full spins (1800 deg) + alignment
        // We add random variance inside the slice (+- 10 deg) to look realistic? 
        // For 'fairness' visual, center it perfectly or slight noise. 
        // Let's center it for now.
        const spinCount = 5;
        const baseRotation = 360 * spinCount;

        // Index 0 is at 0 degrees. Index 1 is at 36 degrees.
        // To bring Index 1 to the top (pointer at -top-6), we rotate the wheel such that Index 1 is at Top.
        // The pointer is static at top. 
        // So we need: Rotation = - (Index * SliceAngle)
        // With 360 spins: Rotation = 1800 - (Index * SliceAngle)

        const targetRotation = baseRotation - (targetIndex * sliceAngle);

        setRotation(targetRotation);
        setDisplayReward(wonPrize);

        // 3. Wait for animation to finish (8s)
        spinTimerRef.current = setTimeout(() => {
            spinTimerRef.current = null;
            claimLuckySpinReward?.();
            setUiState('SHOW_RESULT');
            vfxBus.triggerScreenShake({ intensity: 6, duration: 80 });
            vfxBus.triggerFloatingText({ text: `+${wonPrize} MOEDAS!`, type: 'win', duration: 1800 });
            vfxBus.triggerCoinFountain({
                count: Math.min(26, Math.max(12, Math.floor(wonPrize / 50))),
                value: wonPrize
            });
        }, 8000);
    };

    return (
        <div className="absolute inset-0 z-[100] bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex flex-col items-center justify-center p-0 text-white overflow-hidden">

            {/* Background Effects */}
            <div
                className="absolute inset-0 opacity-20 animate-pulse"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1.5px)', backgroundSize: '18px 18px' }}
            />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-md w-full gap-8">

                {/* Header */}
                <div className="text-center space-y-2 translate-y-[-3rem]">
                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 animate-text-shimmer drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] uppercase tracking-widest">
                        Lucky Spin
                    </h2>
                </div>

                {/* Wheel / Result Area */}
                {/* Size: Maximize width (100%) with aspect-square. Max width increased to 30rem to allow full bleed on larger mobile widths. */}
                <div className="relative flex items-center justify-center w-full aspect-square max-w-[30rem] translate-x-[-2px] translate-y-[3px]">

                    {/* 2. The Static Rim (Aro) */}
                    {/* Scaled up (110%) and moved UP (-5%) + DOWN 3px (per user request) to fine-tune visual center. */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center scale-110 translate-y-[calc(-5%+3px)]">
                        <img
                            src="/Images/Immutable/aro.png"
                            alt="Aro"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {/* 3. The Static Center Cap (Centro) */}
                    {/* Placed on top of the spinner (z-30) so it doesn't rotate */}
                    {/* Moved UP 3px from 0.5% per user request. */}
                    {/* Resized to 34% (from 33%) to fill the void again. */}
                    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center translate-y-[calc(0.5%-2px)]">
                        <img
                            src="/Images/Immutable/centro.png"
                            alt="Centro"
                            className="w-[32%] h-[32%] object-contain drop-shadow-lg"
                        />
                    </div>

                    {/* 1. The Spinning Wheel (Roleta) */}
                    {/* Scale 96% (from 96%) - Aligned to center (no offset) */}
                    {/* Animation: 8s (8000ms) for maximum suspense */}
                    {/* Cubic Bezier (0.05, 0.7, 0.0, 1) -> Very fast start, extremely long slow-down */}
                    <div
                        ref={wheelRef}
                        className="relative z-10 w-[98%] h-[98%] transition-transform duration-[8000ms]"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transitionTimingFunction: 'cubic-bezier(0.05, 0.7, 0.0, 1)'
                        }}
                    >
                        <img
                            src="/Images/Immutable/roleta.png"
                            alt="Roleta"
                            className="w-full h-full object-contain drop-shadow-2xl"
                        />
                    </div>

                </div>

                {/* Action Area */}
                <div className="w-full max-w-xs mt-8">
                    {uiState !== 'SHOW_RESULT' ? (
                        <button
                            onClick={handleSpin}
                            disabled={uiState === 'SPINNING'}
                            className="group relative w-full py-6 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 disabled:opacity-50 disabled:grayscale transition-all shadow-[0_10px_0_#b45309] hover:shadow-[0_6px_0_#b45309] active:shadow-none active:translate-y-[10px]"
                        >
                            <div className="absolute inset-0 rounded-2xl border-t-2 border-white/30" />
                            <span className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-md group-hover:scale-105 inline-block transition-transform">
                                {uiState === 'SPINNING' ? 'GIRANDO...' : 'GIRAR!'}
                            </span>
                        </button>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
                            <div className="bg-green-500/20 text-green-300 px-6 py-3 rounded-full text-center font-bold border border-green-500/30 flex items-center justify-center gap-2 backdrop-blur-sm">
                                <CheckCircle className="w-6 h-6" />
                                <span className="uppercase tracking-wider text-xl">{displayReward || reward} Coins</span>
                            </div>
                            <button
                                onClick={completeLuckySpin}
                                className="group w-full py-5 rounded-2xl bg-white text-indigo-900 shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:bg-gray-50 transform transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl font-black uppercase tracking-wider">
                                    Continuar
                                </span>
                                <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
