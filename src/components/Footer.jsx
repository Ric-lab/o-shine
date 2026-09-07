import React from 'react';

export default function Footer({ phase, onSpin, onPowerUp, balls, getImage }) {
    const busy = phase === 'SPINNING' || phase === 'RESOLVE' || phase === 'GAME_OVER' || phase === 'VICTORY' || phase === 'BONUS_WHEEL';

    // spin.png is 720x256 (ratio ~2.8:1). At flex-1 width we let it define its own height
    // via padding-top trick so it never distorts.
    // Side buttons are square 224x224 originals — we display them at 72x72.

    return (
        <div
            className="w-full flex items-center px-2 gap-3 z-30 flex-shrink-0"
            style={{
                height: 96,
                backgroundImage: `url(${getImage('footerbg.png')})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center'
            }}
        >

            {/* Fireball — 72×72 square */}
            <button
                onClick={() => onPowerUp('fireball')}
                className="flex-shrink-0 transition-all duration-100 active:scale-90 hover:brightness-110"
                style={{ width: 72, height: 72 }}
                disabled={busy}
            >
                <img
                    src={getImage('fireball.png')}
                    alt="Fireball"
                    className="w-full h-full object-contain drop-shadow-lg"
                />
            </button>

            {/* SPIN — flex-1, height drives from image ratio (720x256 ≈ 2.8:1).
                We clamp the height so it stays proportional inside the 96px footer. */}
            <button
                onClick={onSpin}
                disabled={phase !== 'SPIN'}
                className={`flex-1 relative transition-all duration-100 active:scale-[0.97]
                    ${phase === 'SPIN' ? 'hover:brightness-110' : 'cursor-not-allowed'}`}
                style={{ height: 72 }}
            >
                {/* Background pill image — fills button, object-fill OK because
                    the button's aspect ratio is intentionally made to match ~2.8:1 */}
                <img
                    src={getImage('spin.png')}
                    alt="Spin"
                    className="absolute inset-0 w-full h-full object-fill"
                    style={{ opacity: phase !== 'SPIN' ? 0.5 : 1 }}
                />
                <span className="relative z-10 w-full h-full flex items-center justify-center
                    text-white font-black text-xl tracking-widest
                    drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {phase === 'SPIN' ? balls : phase === 'DROP' ? 'DROP!' : 'WAIT'}
                </span>
            </button>

            {/* Magic Number — 72×72 square */}
            <button
                onClick={() => onPowerUp('magic')}
                className="flex-shrink-0 transition-all duration-100 active:scale-90 hover:brightness-110"
                style={{ width: 72, height: 72 }}
                disabled={busy}
            >
                <img
                    src={getImage('magicnumber.png')}
                    alt="Magic Number"
                    className="w-full h-full object-contain drop-shadow-lg"
                />
            </button>

        </div>
    );
}
