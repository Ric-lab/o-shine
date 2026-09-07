import React from 'react';

export default function GameOverModal({
    coins,
    onRestart,
    buyItem,
    watchReward,
    adsAvailable,
    showMessage,
    playClick
}) {
    return (
        <div className="absolute inset-0 z-50 bg-red-900/90 backdrop-blur-md flex items-center justify-center flex-col text-white animate-fade-in p-4 text-center overflow-hidden w-full h-full">

            <h1 className="text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-scale-pulse">
                GAME OVER
            </h1>

            <div className="flex flex-col gap-3 w-full max-w-xs px-4">
                {/* CONTINUE WITH COINS */}
                <button
                    onClick={() => {
                        playClick?.();
                        if (coins >= 1000) {
                            buyItem('continue', 1000);
                        } else {
                            showMessage('error', 'Oops!', 'Not enough coins to Continue!');
                        }
                    }}
                    disabled={coins < 1000}
                    className={`group relative px-6 py-2.5 rounded-full font-black text-lg shadow-xl transition-all border-4 border-white/30 ${coins >= 1000 ? 'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 cursor-pointer shadow-[0_4px_0_rgb(29,78,216)] active:translate-y-[4px] active:shadow-none' : 'bg-gray-500 opacity-50 cursor-not-allowed'}`}
                >
                    <span className="drop-shadow-md flex items-center justify-center gap-2">
                        <span>+10 BALLS</span>
                        <span className="text-yellow-300 font-extrabold flex items-center gap-1">
                            (1,000 <img src="/Images/Immutable/Coin.png" alt="Coin" className="w-5 h-5 inline object-contain" />)
                        </span>
                    </span>
                    {coins >= 1000 && (
                        <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    )}
                </button>

                {/* CONTINUE WITH WATCH VIDEO (FREE) */}
                <button
                    onClick={() => {
                        playClick?.();
                        watchReward('continue');
                    }}
                    disabled={!adsAvailable}
                    className="group relative px-6 py-2.5 rounded-full font-black text-lg shadow-xl transition-all border-4 border-white/30 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 cursor-pointer shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-[4px] active:shadow-none"
                >
                    <span className="drop-shadow-md flex items-center justify-center gap-2 text-white">
                        <span>+10 BALLS</span>
                        <span className="text-yellow-200">WATCH VIDEO 📺</span>
                    </span>
                    <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

                <button
                    onClick={() => { playClick?.(); onRestart(); }}
                    className="group relative bg-gradient-to-b px-6 py-3.5 rounded-full font-black text-2xl shadow-xl transition-all border-4 border-white/30 from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-[0_5px_0_rgb(185,28,28)] active:shadow-none active:translate-y-[5px]"
                >
                    <span className="drop-shadow-md">
                        RESTART ↺
                    </span>

                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
            </div>
        </div>
    );
}
