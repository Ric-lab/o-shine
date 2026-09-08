import React, { useState } from 'react';
import { Menu, Play, Sparkles, Trophy, Lock, Dice5, Flame, Award } from 'lucide-react';
import NumberTicker from './VFX/NumberTicker.jsx';

const GAMES_CATALOG = [
    {
        id: 'BINGO_PLINKO',
        title: 'Bingo Plinko',
        tagline: 'Bolas físicas, cartelas da sorte e baldes multiplicadores',
        status: 'PLAYABLE',
        badge: 'JOGAR AGORA',
        badgeColor: 'bg-emerald-500 text-white',
        icon: '🎰',
        gradient: 'from-amber-500/30 via-orange-600/20 to-purple-900/40',
        border: 'border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
        modes: [
            { id: 'FINGO', label: 'FINGO', desc: '50 Bolas • Modo Clássico' },
            { id: 'BINGO', label: 'BINGO', desc: '100 Bolas • Recompensa x3' },
            { id: 'SPINGO', label: 'SPINGO', desc: '25 Bolas • Ritmo Rápido' }
        ]
    },
    {
        id: 'MATCH_MACHINE',
        title: 'Match Machine (777)',
        tagline: 'Slot 3x3 clássico com rolos dourados e multiplicadores selvagens',
        status: 'PLAYABLE',
        badge: 'JOGAR AGORA',
        badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black',
        icon: '🐯',
        gradient: 'from-amber-600/30 via-red-900/30 to-stone-900/40',
        border: 'border-yellow-400/70 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
    },
    {
        id: 'RASPADINHA_ROYALE',
        title: 'Raspadinha Royale',
        tagline: 'Raspe a película dourada e revele 3 símbolos premiados',
        status: 'COMING_SOON',
        badge: 'EM BREVE',
        badgeColor: 'bg-purple-600/80 text-purple-100',
        icon: '🪙',
        gradient: 'from-purple-600/20 via-pink-900/20 to-stone-900/40',
        border: 'border-purple-500/30'
    },
    {
        id: 'PENALTI_DOURADO',
        title: 'Pênalti Dourado',
        tagline: '5 cobranças consecutivas para dobrar o valor com cashout',
        status: 'COMING_SOON',
        badge: 'EM BREVE',
        badgeColor: 'bg-blue-600/80 text-blue-100',
        icon: '⚽',
        gradient: 'from-emerald-600/20 via-blue-900/20 to-stone-900/40',
        border: 'border-blue-500/30'
    },
    {
        id: 'TILES_HOP',
        title: 'Tiles Hop (Crash)',
        tagline: 'Salte de piso em piso antes que o vidro quebre de surpresa',
        status: 'COMING_SOON',
        badge: 'EM BREVE',
        badgeColor: 'bg-cyan-600/80 text-cyan-100',
        icon: '🪟',
        gradient: 'from-cyan-600/20 via-indigo-900/20 to-stone-900/40',
        border: 'border-cyan-500/30'
    },
    {
        id: 'CRAZY_CLOWN',
        title: 'Crazy Clown (360°)',
        tagline: 'Giro dinâmico da cabeça com multiplicadores e holofotes',
        status: 'COMING_SOON',
        badge: 'EM BREVE',
        badgeColor: 'bg-rose-600/80 text-rose-100',
        icon: '🤡',
        gradient: 'from-rose-600/20 via-orange-900/20 to-stone-900/40',
        border: 'border-rose-500/30'
    },
    {
        id: 'CLAW_MACHINE',
        title: 'Claw Machine',
        tagline: 'Garra mecânica de shopping sobre piscina de cápsulas raras',
        status: 'COMING_SOON',
        badge: 'EM BREVE',
        badgeColor: 'bg-indigo-600/80 text-indigo-100',
        icon: '🕹️',
        gradient: 'from-indigo-600/20 via-violet-900/20 to-stone-900/40',
        border: 'border-indigo-500/30'
    },
    {
        id: 'BASKET_SKEEBALL',
        title: 'Basket / Skee-Ball',
        tagline: 'Arremesso parabólico com deslize em cestas de neon',
        status: 'COMING_SOON',
        badge: 'EM BREVE',
        badgeColor: 'bg-orange-600/80 text-orange-100',
        icon: '🏀',
        gradient: 'from-orange-600/20 via-amber-900/20 to-stone-900/40',
        border: 'border-orange-500/30'
    },
    {
        id: 'MARBLE_RUN',
        title: 'Marble Run',
        tagline: 'Corrida física de bolinhas em tubos transparentes de acrílico',
        status: 'COMING_SOON',
        badge: 'EM BREVE',
        badgeColor: 'bg-teal-600/80 text-teal-100',
        icon: '🔮',
        gradient: 'from-teal-600/20 via-emerald-900/20 to-stone-900/40',
        border: 'border-teal-500/30'
    }
];

export default function HubLobby({
    coins = 1000,
    level = 1,
    onPlayBingoPlinko,
    onPlayMatchMachine,
    onOpenLuckySpin,
    onOpenMenu,
    playClick
}) {
    const [selectedMode, setSelectedMode] = useState('FINGO');

    const handleLaunchBingoPlinko = (mode) => {
        playClick?.();
        setSelectedMode(mode);
        onPlayBingoPlinko?.(mode);
    };

    return (
        <div className="w-full h-full flex flex-col bg-stone-950 text-white relative overflow-hidden select-none">
            {/* Ambient Casino Lighting Glows */}
            <div className="absolute top-[-10%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-purple-600/15 blur-[100px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />

            {/* Top Bar */}
            <div className="w-full h-[60px] flex items-center justify-between px-4 z-30 flex-shrink-0 bg-stone-900/60 backdrop-blur-md border-b border-white/10">
                {/* Coins Badge */}
                <div
                    id="header-coin-badge"
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                >
                    <img
                        src="/Images/Immutable/Coin.png"
                        alt="Coins"
                        className="w-5 h-5 object-contain drop-shadow-md"
                    />
                    <NumberTicker value={coins} className="text-amber-300 font-black text-sm tracking-wide" />
                </div>

                {/* Center Title Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Trophy size={14} className="text-amber-400" />
                    <span className="text-xs font-bold tracking-wider text-amber-200 uppercase">
                        NÍVEL {level}
                    </span>
                </div>

                {/* Settings / Menu Button */}
                <button
                    onClick={() => { playClick?.(); onOpenMenu?.(); }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10 shadow-sm"
                    aria-label="Abrir Menu"
                >
                    <Menu size={18} />
                </button>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 w-full overflow-y-auto px-4 py-5 space-y-6 pb-24">

                {/* Neon Signboard Hero */}
                <div className="relative text-center py-4 px-2 rounded-3xl bg-gradient-to-b from-purple-950/40 via-stone-900/60 to-black/60 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-[11px] font-bold tracking-widest text-amber-300 uppercase mb-2">
                        <Sparkles size={12} className="text-amber-400 animate-spin-slow" />
                        Arcade & Casino Hub
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)]">
                        O-SHINE
                    </h1>
                    <p className="text-xs font-medium text-stone-300 tracking-wide mt-1">
                        9 Minijogos • Carteira Compartilhada • Visual de Estúdio
                    </p>
                </div>

                {/* Daily Lucky Spin Banner */}
                <button
                    onClick={() => { playClick?.(); onOpenLuckySpin?.(); }}
                    className="w-full relative group overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-500 text-stone-950 shadow-[0_8px_25px_rgba(245,158,11,0.4)] border-2 border-yellow-200 active:scale-95 transition-all text-left flex items-center justify-between"
                >
                    <div className="relative z-10 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-stone-900 bg-white/40 px-2 py-0.5 rounded-md inline-flex">
                            <Sparkles size={12} />
                            Bônus Grátis
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                            Roleta da Sorte
                        </h2>
                        <p className="text-xs font-bold text-yellow-950">
                            Gire agora e ganhe até 10.000 moedas!
                        </p>
                    </div>

                    <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center text-2xl shadow-inner group-hover:rotate-45 transition-transform">
                        🎡
                    </div>
                </button>

                {/* Games Section Header */}
                <div className="flex items-center justify-between pt-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                        <Dice5 size={16} className="text-amber-400" />
                        Catálogo de Jogos (9)
                    </h3>
                    <span className="text-[11px] font-bold text-amber-400/80">
                        2 Ativos • 7 em Produção
                    </span>
                </div>

                {/* 9 Games Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {GAMES_CATALOG.map((game) => {
                        const isPlayable = game.status === 'PLAYABLE';

                        return (
                            <div
                                key={game.id}
                                className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${game.gradient} border ${game.border} backdrop-blur-sm transition-all ${
                                    isPlayable
                                        ? 'hover:scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                                        : 'opacity-85'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                                            {game.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-base text-white tracking-wide">
                                                    {game.title}
                                                </h4>
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${game.badgeColor}`}>
                                                    {game.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-300 font-medium leading-tight mt-0.5">
                                                {game.tagline}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {isPlayable && game.id === 'BINGO_PLINKO' && (
                                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            {game.modes?.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => { playClick?.(); setSelectedMode(m.id); }}
                                                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                                                        selectedMode === m.id
                                                            ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                                            : 'bg-black/30 text-stone-300 border-white/10 hover:bg-black/50'
                                                    }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleLaunchBingoPlinko(selectedMode)}
                                            className="w-full mt-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm tracking-wider uppercase shadow-[0_4px_15px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-300/40"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            JOGAR {selectedMode} AGORA
                                        </button>
                                    </div>
                                )}

                                {isPlayable && game.id === 'MATCH_MACHINE' && (
                                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                                        <button
                                            onClick={() => {
                                                playClick?.();
                                                onPlayMatchMachine?.();
                                            }}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 hover:from-red-500 hover:to-amber-400 text-stone-950 font-black text-sm tracking-wider uppercase shadow-[0_4px_15px_rgba(245,158,11,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 border border-yellow-300/80"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            JOGAR MATCH MACHINE 777 AGORA
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
