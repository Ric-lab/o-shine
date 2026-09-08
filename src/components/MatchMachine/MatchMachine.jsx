import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Zap, Sparkles, Flame, Volume2, VolumeX, RotateCw, Plus, Trophy } from 'lucide-react';
import NumberTicker from '../VFX/NumberTicker.jsx';
import { vfxBus } from '../../services/vfxBus.js';
import {
    SYMBOLS,
    PAYLINES,
    BET_PRESETS,
    generateSpinGrid,
    evaluateSpin
} from '../../utils/matchMachineLogic.js';
import {
    playReelTick,
    playReelStop,
    playPaylineWin,
    playScatterHit,
    playJuicyHit
} from '../../utils/audioJuice.js';

export default function MatchMachine({
    wallet,
    onBack,
    onOpenLuckySpin,
    onWatchAdReward
}) {
    const { coins, withdraw, deposit, canAfford } = wallet;

    // Bet State
    const [selectedBet, setSelectedBet] = useState(25);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isTurbo, setIsTurbo] = useState(false);
    const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);

    // Free Spins State
    const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
    const [freeSpinsAccumulatedWin, setFreeSpinsAccumulatedWin] = useState(0);

    // Grid Display State (3x3 array of symbol objects)
    const [displayGrid, setDisplayGrid] = useState(() => generateSpinGrid());
    // Reel spinning states (true while column is in motion)
    const [spinningReels, setSpinningReels] = useState([false, false, false]);

    // Active win results & payline highlights
    const [lastEvaluation, setLastEvaluation] = useState(null);
    const [activeWinningLineIndex, setActiveWinningLineIndex] = useState(null);
    const [tigerMood, setTigerMood] = useState('IDLE'); // 'IDLE' | 'SPINNING' | 'WIN' | 'MEGA_WIN'

    // Sound mute toggle
    const [isMuted, setIsMuted] = useState(false);

    // Refs for safe lifecycle cleanup
    const spinTimersRef = useRef([]);
    const tickIntervalsRef = useRef([]);
    const paylineCycleTimerRef = useRef(null);
    const isMountedRef = useRef(true);

    const clearAllTimers = useCallback(() => {
        spinTimersRef.current.forEach(t => clearTimeout(t));
        spinTimersRef.current = [];
        tickIntervalsRef.current.forEach(i => clearInterval(i));
        tickIntervalsRef.current = [];
        if (paylineCycleTimerRef.current) {
            clearInterval(paylineCycleTimerRef.current);
            paylineCycleTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearAllTimers();
        };
    }, [clearAllTimers]);

    // Payline cycle animation on win
    useEffect(() => {
        if (!lastEvaluation || lastEvaluation.winningLines.length <= 1) return;

        const lines = lastEvaluation.winningLines;
        let currentIdx = 0;
        const interval = setInterval(() => {
            currentIdx = (currentIdx + 1) % lines.length;
            setActiveWinningLineIndex(lines[currentIdx].lineIndex);
        }, 1200);

        return () => clearInterval(interval);
    }, [lastEvaluation]);

    // Handle Spin Action
    const executeSpin = useCallback(() => {
        if (isSpinning) return;

        const isFreeSpin = freeSpinsLeft > 0;
        const currentBet = selectedBet;

        // Check funds if not free spin
        if (!isFreeSpin) {
            if (!canAfford(currentBet)) {
                vfxBus.triggerFloatingText({ text: 'SALDO INSUFICIENTE!', type: 'minimal' });
                setAutoSpinsLeft(0);
                return;
            }
            // Deduct bet from wallet
            withdraw(currentBet, 'Aposta Match Machine 777');
        } else {
            setFreeSpinsLeft(prev => Math.max(0, prev - 1));
        }

        if (!isMuted) playJuicyHit(110);
        setIsSpinning(true);
        setLastEvaluation(null);
        setActiveWinningLineIndex(null);
        setTigerMood('SPINNING');

        // Pre-determine final grid and evaluate math
        const targetGrid = generateSpinGrid({ isFreeSpin });
        const evaluation = evaluateSpin(targetGrid, currentBet, { isFreeSpin });

        // Start reel spinning animations
        setSpinningReels([true, true, true]);

        // Start rapid reel ticks audio
        if (!isMuted) {
            const tickInterval = setInterval(() => {
                playReelTick(0.18);
            }, 65);
            tickIntervalsRef.current.push(tickInterval);
        }

        // Timing parameters based on Turbo mode
        const stopDelay1 = isTurbo ? 350 : 800;
        const stopDelay2 = isTurbo ? 550 : 1200;
        const stopDelay3 = isTurbo ? 750 : 1600;

        // Stop Reel 0
        const t1 = setTimeout(() => {
            if (!isMountedRef.current) return;
            setSpinningReels([false, true, true]);
            setDisplayGrid(prev => [
                [targetGrid[0][0], prev[0][1], prev[0][2]],
                [targetGrid[1][0], prev[1][1], prev[1][2]],
                [targetGrid[2][0], prev[2][1], prev[2][2]]
            ]);
            if (!isMuted) playReelStop(0);
        }, stopDelay1);

        // Stop Reel 1
        const t2 = setTimeout(() => {
            if (!isMountedRef.current) return;
            setSpinningReels([false, false, true]);
            setDisplayGrid(prev => [
                [targetGrid[0][0], targetGrid[0][1], prev[0][2]],
                [targetGrid[1][0], targetGrid[1][1], prev[1][2]],
                [targetGrid[2][0], targetGrid[2][1], prev[2][2]]
            ]);
            if (!isMuted) playReelStop(1);
        }, stopDelay2);

        // Stop Reel 2 (Full resolution)
        const t3 = setTimeout(() => {
            if (!isMountedRef.current) return;
            setSpinningReels([false, false, false]);
            setDisplayGrid(targetGrid);
            if (!isMuted) playReelStop(2);

            // Clear tick audio interval
            tickIntervalsRef.current.forEach(i => clearInterval(i));
            tickIntervalsRef.current = [];

            // Settle evaluation
            setLastEvaluation(evaluation);
            setActiveWinningLineIndex(evaluation.winningLines[0]?.lineIndex ?? null);
            setIsSpinning(false);

            // Handle Wins & Celebrations
            if (evaluation.isWin) {
                // Deposit win in global wallet
                deposit(evaluation.totalWin, 'Vitória Match Machine 777', { silent: true });

                if (isFreeSpin) {
                    setFreeSpinsAccumulatedWin(prev => prev + evaluation.totalWin);
                }

                if (!isMuted) playPaylineWin(1.0);

                if (evaluation.isJackpot || evaluation.isMegaWin) {
                    setTigerMood('MEGA_WIN');
                    vfxBus.triggerScreenShake({ intensity: 7, duration: 90 });
                    vfxBus.triggerFloatingText({
                        text: evaluation.isJackpot ? '🎰 JACKPOT x100!' : `MEGA WIN! +${evaluation.totalWin}🟡`,
                        type: 'win',
                        duration: 2200
                    });
                    vfxBus.triggerCoinFountain({
                        count: 24,
                        value: evaluation.totalWin,
                        origin: { x: window.innerWidth / 2, y: window.innerHeight * 0.55 }
                    });
                } else if (evaluation.isBigWin) {
                    setTigerMood('WIN');
                    vfxBus.triggerScreenShake({ intensity: 4, duration: 60 });
                    vfxBus.triggerFloatingText({
                        text: `BIG WIN! +${evaluation.totalWin}🟡`,
                        type: 'win',
                        duration: 1800
                    });
                    vfxBus.triggerCoinFountain({
                        count: 16,
                        value: evaluation.totalWin,
                        origin: { x: window.innerWidth / 2, y: window.innerHeight * 0.55 }
                    });
                } else {
                    setTigerMood('WIN');
                    vfxBus.triggerFloatingText({
                        text: `+${evaluation.totalWin}🟡`,
                        type: 'gold',
                        duration: 1400
                    });
                    vfxBus.triggerCoinFountain({
                        count: Math.min(12, Math.max(6, Math.floor(evaluation.totalWin / 10))),
                        value: evaluation.totalWin,
                        origin: { x: window.innerWidth / 2, y: window.innerHeight * 0.55 }
                    });
                }
            } else {
                setTigerMood('IDLE');
            }

            // Handle Free Spins Trigger
            if (evaluation.freeSpinsTriggered) {
                if (!isMuted) playScatterHit();
                vfxBus.triggerScreenShake({ intensity: 6, duration: 80 });
                vfxBus.triggerFloatingText({ text: '⚡ 10 GIROS GRÁTIS! ⚡', type: 'win', duration: 2500 });
                setFreeSpinsLeft(prev => prev + 10);
            }
        }, stopDelay3);

        spinTimersRef.current.push(t1, t2, t3);
    }, [isSpinning, freeSpinsLeft, selectedBet, isTurbo, isMuted, canAfford, withdraw, deposit]);

    // Auto-spin runner
    useEffect(() => {
        if (!isSpinning && autoSpinsLeft > 0) {
            const timer = setTimeout(() => {
                setAutoSpinsLeft(prev => prev - 1);
                executeSpin();
            }, isTurbo ? 400 : 800);
            return () => clearTimeout(timer);
        }
    }, [isSpinning, autoSpinsLeft, isTurbo, executeSpin]);

    // Free-spin automatic chain
    useEffect(() => {
        if (!isSpinning && freeSpinsLeft > 0 && autoSpinsLeft === 0) {
            const timer = setTimeout(() => {
                executeSpin();
            }, isTurbo ? 600 : 1000);
            return () => clearTimeout(timer);
        }
    }, [isSpinning, freeSpinsLeft, autoSpinsLeft, isTurbo, executeSpin]);

    // Helper to check if a cell [row, col] is part of the currently active winning line
    const isCellInActiveWinningLine = (row, col) => {
        if (activeWinningLineIndex === null || !lastEvaluation) return false;
        const line = PAYLINES.find(p => p.id === activeWinningLineIndex);
        if (!line) return false;
        return line.positions.some(([r, c]) => r === row && c === col);
    };

    return (
        <div className="w-full h-full flex flex-col bg-stone-950 text-white relative overflow-hidden select-none">
            {/* Ambient Casino Lighting Glows */}
            <div className="absolute top-[-10%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-red-600/20 blur-[100px] pointer-events-none" />
            <div className="absolute top-[30%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-amber-500/15 blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[10%] w-[80vw] h-[80vw] rounded-full bg-yellow-600/15 blur-[120px] pointer-events-none" />

            {/* Top Bar Header */}
            <div className="w-full h-[60px] flex items-center justify-between px-3 z-30 flex-shrink-0 bg-stone-900/80 backdrop-blur-md border-b border-amber-500/20">
                {/* Back to Lobby Button */}
                <button
                    onClick={() => {
                        clearAllTimers();
                        onBack?.();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 active:scale-95 transition-transform"
                    aria-label="Voltar ao Lobby"
                >
                    <ChevronLeft size={18} className="text-amber-300" />
                    <span className="text-xs font-bold text-stone-200">Lobby</span>
                </button>

                {/* Balance Badge */}
                <div
                    id="header-coin-badge"
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500/25 to-yellow-500/15 border border-amber-400/50 px-3.5 py-1.2 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                    <img
                        src="/Images/Immutable/Coin.png"
                        alt="Coins"
                        className="w-5 h-5 object-contain drop-shadow-md"
                    />
                    <NumberTicker value={coins} className="text-amber-300 font-black text-sm tracking-wide" />
                </div>

                {/* Sound & Shortcuts */}
                <div className="flex items-center gap-1.5">
                    {coins < 25 && onWatchAdReward && (
                        <button
                            onClick={() => onWatchAdReward()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 text-xs font-black shadow-sm active:scale-95"
                            aria-label="Assistir anúncio por moedas"
                        >
                            <Sparkles size={12} />
                            <span>+100</span>
                        </button>
                    )}
                    {onOpenLuckySpin && (
                        <button
                            onClick={() => onOpenLuckySpin()}
                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 active:scale-95"
                            aria-label="Roleta da Sorte"
                        >
                            <Sparkles size={15} className="text-amber-300" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsMuted(prev => !prev)}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 active:scale-95"
                        aria-label="Alternar Som"
                    >
                        {isMuted ? <VolumeX size={15} className="text-stone-400" /> : <Volume2 size={15} className="text-amber-300" />}
                    </button>
                </div>
            </div>

            {/* Mascot Banner Section */}
            <div className="w-full flex-shrink-0 flex items-center justify-between px-4 pt-2 pb-1 relative z-20">
                <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 relative flex-shrink-0 animate-bounce">
                        <img
                            src="/Images/MatchMachine/tiger_wild.png"
                            alt="Tigrinho 3D"
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.7)]"
                        />
                        {tigerMood === 'MEGA_WIN' && (
                            <span className="absolute -top-2.5 -right-1.5 text-base">👑</span>
                        )}
                        {tigerMood === 'WIN' && (
                            <span className="absolute -top-2.5 -right-1.5 text-base">🔥</span>
                        )}
                    </div>
                    <div>
                        <div className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                            Tigrinho da Fortuna 777
                        </div>
                        <div className="text-[10px] text-amber-200/70 font-semibold">
                            {freeSpinsLeft > 0
                                ? `🔥 MODO BÔNUS: ${freeSpinsLeft} GIROS RESTANTES`
                                : lastEvaluation?.isWin
                                    ? `🏆 Vitória: +${lastEvaluation.totalWin} moedas!`
                                    : 'Alinhe 3 símbolos e multiplique até x100!'}
                        </div>
                    </div>
                </div>

                {/* Free Spins Accumulated Badge if active */}
                {freeSpinsAccumulatedWin > 0 && (
                    <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-md">
                        <Trophy size={12} className="text-yellow-400" />
                        <span className="text-[10px] font-bold text-yellow-200">
                            +{freeSpinsAccumulatedWin}
                        </span>
                    </div>
                )}
            </div>

            {/* 3x3 Slot Machine Cabinet */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 min-h-0">
                <div className="w-full max-w-[340px] aspect-square rounded-3xl p-3 bg-gradient-to-b from-amber-600 via-yellow-700 to-amber-900 shadow-[0_0_35px_rgba(245,158,11,0.35)] border-2 border-yellow-400/70 flex flex-col relative">
                    {/* Inner Cabinet Frame */}
                    <div className="w-full h-full rounded-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 p-2.5 grid grid-cols-3 gap-2 border border-yellow-500/40 shadow-inner relative overflow-hidden">

                        {/* Neon Scanlines / Gloss Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none rounded-2xl" />

                        {/* 3 Slot Columns (Reels) */}
                        {[0, 1, 2].map(colIdx => {
                            const isColumnSpinning = spinningReels[colIdx];
                            return (
                                <div
                                    key={colIdx}
                                    className={`flex flex-col gap-2 rounded-xl bg-stone-900/90 p-1 border border-white/10 relative overflow-hidden ${
                                        isColumnSpinning ? 'animate-pulse' : ''
                                    }`}
                                >
                                    {[0, 1, 2].map(rowIdx => {
                                        const symbol = displayGrid[rowIdx]?.[colIdx] || SYMBOLS.CHERRY;
                                        const isWinningCell = isCellInActiveWinningLine(rowIdx, colIdx);

                                        return (
                                            <div
                                                key={rowIdx}
                                                className={`flex-1 rounded-lg flex flex-col items-center justify-center relative transition-all duration-300 ${
                                                    isWinningCell
                                                        ? 'bg-gradient-to-b from-amber-400/40 to-yellow-600/40 border-2 border-yellow-300 scale-105 shadow-[0_0_15px_rgba(253,224,71,0.7)] z-20'
                                                        : 'bg-stone-800/60 border border-white/5'
                                                } ${isColumnSpinning ? 'blur-[1.5px] translate-y-[-2px]' : ''}`}
                                            >
                                                {/* 3D Symbol Sprite */}
                                                {symbol.image ? (
                                                    <img
                                                        src={symbol.image}
                                                        alt={symbol.name}
                                                        className="w-14 h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] select-none pointer-events-none"
                                                    />
                                                ) : (
                                                    <span className="text-3xl sm:text-4xl drop-shadow-md select-none transform active:scale-95">
                                                        {symbol.icon}
                                                    </span>
                                                )}

                                                {/* Wild Multiplier Badge */}
                                                {symbol.isWild && symbol.multiplier > 1 && (
                                                    <span className="absolute top-1 right-1 bg-gradient-to-r from-red-600 to-amber-600 text-[10px] font-black text-white px-1.5 rounded-full border border-yellow-300 shadow-sm animate-pulse">
                                                        x{symbol.multiplier}
                                                    </span>
                                                )}

                                                {/* Scatter Label */}
                                                {symbol.isScatter && (
                                                    <span className="absolute bottom-0.5 text-[8px] font-bold text-yellow-300 tracking-tighter uppercase">
                                                        BÔNUS
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {/* Active Winning Line Notification Banner */}
                    {activeWinningLineIndex !== null && lastEvaluation && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs shadow-lg border border-yellow-200 z-30 whitespace-nowrap animate-bounce">
                            ⭐ LINHA {activeWinningLineIndex + 1}: +{lastEvaluation.winningLines.find(l => l.lineIndex === activeWinningLineIndex)?.payout || 0} MOEDAS!
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls Deck (One-Thumb Optimized) */}
            <div className="w-full flex-shrink-0 bg-stone-900/90 backdrop-blur-md border-t border-amber-500/20 px-4 py-3 flex flex-col gap-2.5 z-30">
                {/* Bet Selector Row */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        Aposta:
                    </span>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        {BET_PRESETS.map(betVal => (
                            <button
                                key={betVal}
                                disabled={isSpinning || freeSpinsLeft > 0}
                                onClick={() => setSelectedBet(betVal)}
                                className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                                    selectedBet === betVal
                                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-105'
                                        : 'bg-white/10 text-stone-300 hover:bg-white/15'
                                } ${isSpinning || freeSpinsLeft > 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                {betVal}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Primary Action Buttons Row */}
                <div className="flex items-center justify-between gap-3">
                    {/* Turbo Mode Toggle */}
                    <button
                        onClick={() => setIsTurbo(prev => !prev)}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border transition-all ${
                            isTurbo
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                : 'bg-white/5 border-white/10 text-stone-400'
                        } active:scale-95`}
                        aria-label="Modo Turbo"
                    >
                        <Zap size={18} className={isTurbo ? 'fill-amber-300 text-amber-300' : ''} />
                        <span className="text-[9px] font-bold uppercase mt-0.5">Turbo</span>
                    </button>

                    {/* Giant Spin Button */}
                    <button
                        disabled={isSpinning || (!canAfford(selectedBet) && freeSpinsLeft === 0)}
                        onClick={executeSpin}
                        className={`flex-1 h-14 rounded-2xl font-black text-lg tracking-wider uppercase flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-100 ${
                            isSpinning
                                ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                : freeSpinsLeft > 0
                                    ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-stone-950 shadow-[0_0_25px_rgba(245,158,11,0.6)] border-2 border-yellow-300 active:scale-[0.98]'
                                    : 'bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 text-white shadow-[0_4px_20px_rgba(220,38,38,0.4)] border-2 border-amber-400/80 active:translate-y-1 active:shadow-none'
                        }`}
                        aria-label="Girar Slot"
                    >
                        {/* Shimmer Light Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2.5s_infinite]" />

                        {freeSpinsLeft > 0 ? (
                            <>
                                <Flame size={20} className="animate-spin text-stone-950" />
                                <span>GIRO GRÁTIS ({freeSpinsLeft})</span>
                            </>
                        ) : isSpinning ? (
                            <span>ROLANDO...</span>
                        ) : (
                            <>
                                <RotateCw size={20} className="text-amber-200" />
                                <span>GIRAR ({selectedBet}🟡)</span>
                            </>
                        )}
                    </button>

                    {/* Auto Spin Toggle */}
                    <button
                        onClick={() => {
                            if (autoSpinsLeft > 0) {
                                setAutoSpinsLeft(0);
                            } else {
                                setAutoSpinsLeft(10);
                                if (!isSpinning) executeSpin();
                            }
                        }}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border transition-all ${
                            autoSpinsLeft > 0
                                ? 'bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                                : 'bg-white/5 border-white/10 text-stone-400'
                        } active:scale-95`}
                        aria-label="Auto Spin"
                    >
                        <RotateCw size={18} className={autoSpinsLeft > 0 ? 'animate-spin' : ''} />
                        <span className="text-[9px] font-bold uppercase mt-0.5">
                            {autoSpinsLeft > 0 ? `${autoSpinsLeft}` : 'Auto'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
