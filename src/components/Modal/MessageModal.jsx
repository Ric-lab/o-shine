import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MessageModal({ isOpen, onClose, type = 'info', title, message }) {
    if (!isOpen) return null;

    // Determine styles based on type
    const styles = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            iconColor: 'text-green-500',
            btnBg: 'bg-green-600 hover:bg-green-700',
            Icon: CheckCircle
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            iconColor: 'text-red-500',
            btnBg: 'bg-red-600 hover:bg-red-700',
            Icon: AlertCircle
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            iconColor: 'text-blue-500',
            btnBg: 'bg-blue-600 hover:bg-blue-700',
            Icon: Info
        },
        celebration: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-400',
            iconColor: 'text-yellow-500',
            btnBg: 'bg-yellow-600 hover:bg-yellow-700',
            Icon: CheckCircle,
            cardClass: 'shadow-[0_0_50px_rgba(255,215,0,0.5)] scale-110'
        },
        minimal: {
            bg: 'bg-transparent',
            border: 'border-transparent',
            iconColor: 'text-white/0', // Hide icon effectively or use distinct
            btnBg: 'hidden', // Hide button
            Icon: X,
            wrapperClass: 'bg-transparent shadow-none border-none p-0'
        }
    };

    const currentStyle = styles[type] || styles.info;
    const Icon = currentStyle.Icon;

    // Custom render for MINIMAL type (Try Again) to be cleaner
    if (type === 'minimal') {
        return (
            <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none animate-bounce-in flex-col overflow-hidden">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm -z-10 animate-fade-in" />

                <div className="flex flex-col items-center animate-pulse px-4 text-center">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 drop-shadow-[0_2px_0_rgba(139,0,0,1)] stroke-white tracking-widest uppercase">
                        TRY AGAIN
                    </h1>

                    {message && (
                        <div className="mt-4 bg-white text-red-600 font-extrabold text-xl px-6 py-2 rounded-full border-2 border-red-400 shadow-[0_0_20px_rgba(255,0,0,0.4)] animate-float-up transform -rotate-1">
                            {message}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Custom render for CELEBRATION type (LUCK) to be festive but direct
    if (type === 'celebration') {
        return <CelebrationContent message={message} isOpen={isOpen} />;
    }

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`
                w-full max-w-sm rounded-3xl shadow-2xl p-6 relative animate-scale-up
                bg-white border-2 ${currentStyle.border} ${currentStyle.cardClass || ''}
            `}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    <div className={`p-4 rounded-full ${currentStyle.bg} mb-2`}>
                        <Icon size={48} className={currentStyle.iconColor} />
                    </div>

                    <div>
                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-wide">
                            {title}
                        </h3>
                        <p className="text-gray-600 font-medium mt-2 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className={`
                            w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95
                            ${currentStyle.btnBg}
                        `}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

function CelebrationContent({ message, isOpen }) {
    const canvasRef = React.useRef(null);

    React.useEffect(() => {
        if (isOpen && canvasRef.current) {
            const myConfetti = confetti.create(canvasRef.current, {
                resize: true,
                useWorker: true
            });

            const isMobile = window.innerWidth < 768;
            const particleCount = isMobile ? 60 : 100;
            const scalar = isMobile ? 1.2 : 1.0;
            const velocity = isMobile ? 60 : 80;

            const defaults = {
                spread: isMobile ? 50 : 70,
                ticks: 200,
                gravity: 1.2,
                decay: 0.92,
                startVelocity: velocity,
                colors: ['#FFD700', '#FFA500', '#DAA520', '#FFFFFF'],
                scalar
            };

            myConfetti({
                ...defaults,
                particleCount,
                angle: 60,
                origin: { x: 0, y: 0.9 }
            });

            myConfetti({
                ...defaults,
                particleCount,
                angle: 120,
                origin: { x: 1, y: 0.9 }
            });
        }
    }, [isOpen]);

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none animate-bounce-in flex-col overflow-hidden">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm -z-10 animate-fade-in" />

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
            />

            <div className="flex flex-col items-center animate-pulse px-4 text-center z-10">
                <h1 className="text-6xl font-black text-yellow-300 drop-shadow-[0_3px_0_rgba(255,140,0,1)] stroke-black tracking-widest uppercase flex items-center justify-center gap-2">
                    <span className="text-5xl">🍀</span> LUCKY! <span className="text-5xl">🍀</span>
                </h1>

                {message && (
                    <div className="mt-2 flex items-center gap-2 justify-center">
                        <span className="text-white font-black text-6xl drop-shadow-[0_3px_3px_rgba(0,0,0,0.8)] stroke-black tracking-widest">
                            {message.replace('+', '').replace('🟡', '')}
                        </span>
                        <img src="/Images/Immutable/Coin.png" alt="Coin" className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                    </div>
                )}
            </div>
        </div>
    );
}

