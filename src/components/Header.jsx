import React from 'react';
import { Menu, Home } from 'lucide-react';
import NumberTicker from './VFX/NumberTicker.jsx';

export default function Header({ level, coins, onOpenMenu, onGoHome, getImage, getImmutableImage }) {
    const currentLevel = level || 1;
    let balloonImage = 'balloongreen.png';
    if (currentLevel % 5 === 0) {
        balloonImage = 'balloonred.png';
    } else if (currentLevel % 2 === 0) {
        balloonImage = 'balloonyellow.png';
    }

    return (
        <div className="w-full h-[50px] backdrop-blur-md bg-white/10 flex items-center justify-between px-4 z-30 flex-shrink-0 relative">

            {/* Left: Coins Display with Juiciness Target Anchor */}
            <div
                id="header-coin-badge"
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-100/90 to-yellow-100/90 pl-2 pr-3 py-0.5 rounded-full border border-amber-300 shadow-[0_2px_8px_rgba(245,158,11,0.2)] backdrop-blur-sm"
            >
                <img
                    src={getImmutableImage('Coin.png')}
                    alt="Coins"
                    className="w-[20px] h-[20px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                />
                <NumberTicker value={coins} className="text-amber-900 text-sm tracking-wide" />
            </div>

            {/* Center: Card Level Balloon */}
            {level && getImage && (
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <div
                        className="flex items-center justify-center"
                        style={{
                            backgroundImage: `url(${getImage(balloonImage)})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            width: '90px',
                            height: '24px'
                        }}
                    >
                        <span className="text-[12px] sm:text-xs font-bold text-white uppercase tracking-[0.2em] leading-none drop-shadow-sm pb-[1px]">
                            CARD {currentLevel}
                        </span>
                    </div>
                </div>
            )}

            {/* Right: Quick Lobby & Menu */}
            <div className="flex items-center gap-1.5">
                {onGoHome && (
                    <button
                        onClick={onGoHome}
                        title="Voltar ao Lobby do Hub"
                        className="p-1.5 bg-white/80 hover:bg-white rounded-full border border-amber-200 transition-all shadow-sm text-amber-700 active:scale-90"
                    >
                        <Home size={18} />
                    </button>
                )}
                <button
                    onClick={onOpenMenu}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors shadow-sm text-gray-700 active:scale-90"
                >
                    <Menu size={18} />
                </button>
            </div>

        </div>
    );
}
