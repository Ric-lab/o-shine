import React, { useEffect } from 'react';
import { vfxBus } from '../../services/vfxBus.js';

export default function NextLevelModal({
    level,
    reward,
    onNextLevel,
    playClick,
    playBingo
}) {
    useEffect(() => {
        playBingo?.();
        vfxBus.triggerScreenShake({ intensity: 5, duration: 70 });
        vfxBus.triggerFloatingText({ text: 'BINGO!', type: 'win', duration: 1500 });
        vfxBus.triggerCoinFountain({
            count: 22,
            value: reward ?? (100 + level)
        });
    }, [playBingo, reward, level]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-end pb-16 w-full h-full bg-black/90 overflow-hidden">

            {/* Full Screen Background Image */}
            <div className="absolute inset-0 w-full h-full">
                <img
                    src="/Images/Immutable/bingo!.png"
                    alt="Level Complete Background"
                    className="w-full h-full object-cover animate-fade-in"
                />
                {/* Overlay gradient to ensure text readability at the bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center gap-24 animate-slide-up">

                {/* Reward Badge */}
                <div className="bg-gradient-to-r from-yellow-600/90 to-yellow-800/90 text-white px-6 py-2 rounded-xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-black tracking-wider drop-shadow-md">
                            +{reward ?? (100 + level)}
                        </span>
                        <img
                            src="/Images/Immutable/Coin.png"
                            alt="Coins"
                            className="w-8 h-8 object-contain drop-shadow-md"
                        />
                    </div>
                </div>

                {/* Next Level Button */}
                <button
                    onClick={() => { playClick?.(); onNextLevel(); }}
                    className="group relative bg-gradient-to-b px-12 py-6 rounded-full font-black text-white text-4xl shadow-[0_10px_20px_rgba(0,0,0,0.5),0_0_50px_rgba(34,197,94,0.8)] transition-all border-4 border-white/70 from-green-500 via-green-400 to-green-600 hover:from-green-400 hover:to-green-500 active:scale-95 hover:scale-110 animate-scale-pulse hover:animate-none"
                >
                    <span className="flex items-center gap-3 relative z-10">
                        NEXT
                    </span>

                    {/* Enhanced Shine Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                    {/* Glow Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping opacity-20" />
                </button>
            </div>
        </div>
    );
}
