import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateProbabilities, pickNonAdjacentColumns } from '../utils/mathUtils.js';
import { loadJSON, saveJSON } from '../utils/storage.js';
import { validateProgress } from '../utils/progress.js';

const STORAGE_KEY = 'bplm.gameLogic.v1';

const COLS = ['B', 'I', 'N', 'G', 'O'];

export const MODE_CONFIG = {
    'FINGO': {
        balls: 50,
        centerFree: true,
        baseReward: 100
    },
    'BINGO': {
        balls: 100,
        centerFree: true,
        baseReward: 300
    },
    'SPINGO': {
        balls: 25,
        centerFree: false, // Random number
        baseReward: 50
    }
};

export const getLevelRanges = (level) => {
    if (level % 5 === 0) {
        return {
            'B': [1, 20],
            'I': [21, 40],
            'N': [41, 60],
            'G': [61, 80],
            'O': [81, 99]
        };
    }

    if (level % 2 === 0) {
        return {
            'B': [1, 15],
            'I': [16, 30],
            'N': [31, 45],
            'G': [46, 60],
            'O': [61, 75]
        };
    }

    return {
        'B': [1, 10],
        'I': [11, 20],
        'N': [21, 30],
        'G': [31, 40],
        'O': [41, 50]
    };
};

// --- WIN CHECK FUNCTIONS ---

export function checkLineMatch(card) {
    for (let r = 0; r < 5; r++) {
        const rowCells = card.filter(c => c.row === r);
        if (rowCells.every(c => c.marked)) return true;
    }
    for (let c = 0; c < 5; c++) {
        const colCells = card.filter(cell => cell.col === c);
        if (colCells.every(c => c.marked)) return true;
    }
    const diag1 = [0, 1, 2, 3, 4].map(i => card.find(c => c.col === i && c.row === i));
    if (diag1.every(c => c.marked)) return true;

    const diag2 = [0, 1, 2, 3, 4].map(i => card.find(c => c.col === (4 - i) && c.row === i));
    if (diag2.every(c => c.marked)) return true;

    return false;
}

export function checkFullCard(card) {
    return card.every(c => c.marked);
}

export function checkAnyFive(card) {
    const markedCount = card.filter(c => c.marked).length;
    return markedCount >= 5;
}

export function calculateWinReward(mode, level) {
    const modeConf = MODE_CONFIG[mode];
    return (modeConf?.baseReward || 100) + level;
}

// --- HELPERS ---

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getUniqueRandoms(min, max, count) {
    let arr = [];
    while (arr.length < count) {
        let r = getRandomInt(min, max);
        if (!arr.includes(r)) arr.push(r);
    }
    return arr;
}

export function useGameLogic(gameMode = 'FINGO') {
    // --- STATE ---
    const [coins, setCoins] = useState(1000);

    // Level Persistence: Object
    const [levels, setLevels] = useState({
        'FINGO': 1,
        'BINGO': 1,
        'SPINGO': 1
    });

    // Hydrate from device storage on first mount, then persist on changes.
    const hydratedRef = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const [storageError, setStorageError] = useState(false);
    useEffect(() => {
        let cancelled = false;
        loadJSON(STORAGE_KEY).then(saved => {
            if (cancelled) return;
            if (saved) {
                const progress = validateProgress(saved);
                setCoins(progress.coins);
                setLevels(progress.levels);
            }
            hydratedRef.current = true;
            setIsReady(true);
        }).catch(() => { if (!cancelled) setStorageError(true); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!hydratedRef.current) return;
        let cancelled = false;
        const persist = () => saveJSON(STORAGE_KEY, { coins, levels })
            .then(() => { if (!cancelled) setStorageError(false); })
            .catch(() => { if (!cancelled) setStorageError(true); });
        persist();
        const retry = setInterval(persist, 15000);
        return () => { cancelled = true; clearInterval(retry); };
    }, [coins, levels, isReady]);

    // Derived current level
    const currentLevel = levels[gameMode || 'FINGO'];

    const [balls, setBalls] = useState(50);
    const [bingoCard, setBingoCard] = useState([]);
    const [slotsResult, setSlotsResult] = useState([0, 0, 0, 0, 0]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winState, setWinState] = useState(false);
    const [fireBallActive, setFireBallActive] = useState(false);
    const [magicActive, setMagicActive] = useState(false);

    // PHASE: 'SPIN' | 'SPINNING' | 'DROP' | 'RESOLVE' | 'GAME_OVER' | 'VICTORY' | 'BONUS_WHEEL'
    const [phase, setPhase] = useState('SPIN');
    const [luckySpinReward, setLuckySpinReward] = useState(null);
    // The pending reward must be consumed synchronously, including by callbacks
    // captured before React renders the result of spinLuckySpin.
    const pendingLuckyRewardRef = useRef(null);
    const [winReward, setWinReward] = useState(0);

    // Config for Current Mode
    const config = MODE_CONFIG[gameMode || 'FINGO'];

    // Manage active timers to isolate games and prevent race conditions on restarts
    const timersRef = useRef(new Set());
    const safeTimeout = useCallback((fn, delay) => {
        const id = setTimeout(() => {
            timersRef.current.delete(id);
            fn();
        }, delay);
        timersRef.current.add(id);
        return id;
    }, []);

    const clearAllTimers = useCallback(() => {
        timersRef.current.forEach(id => clearTimeout(id));
        timersRef.current.clear();
    }, []);

    // Clean timers on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    // --- INITIALIZATION ---
    const initLevel = useCallback(() => {
        // Cancel all pending timeouts from any previous round
        clearAllTimers();

        pendingLuckyRewardRef.current = null;
        setLuckySpinReward(null);

        // Use currentLevel derived from state
        const lvl = levels[gameMode || 'FINGO'];

        // Generate Numbers per Column
        const ranges = getLevelRanges(lvl);
        let colsData = [[], [], [], [], []];
        for (let c = 0; c < 5; c++) {
            const range = ranges[COLS[c]];
            colsData[c] = getUniqueRandoms(range[0], range[1], 5);
        }

        // Flatten to Grid
        let newCard = [];

        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                // Center Cell Check
                const isCenter = (c === 2 && r === 2);

                let numVal = colsData[c][r];
                let isFree = false;
                let marked = false;

                if (isCenter) {
                    if (config.centerFree) {
                        numVal = 'FREE';
                        isFree = true;
                        marked = true;
                    } else {
                        // Spingo: Random Number (already generated in colsData), NOT free, NOT marked
                        // numVal is already colsData[c][r]
                        isFree = false;
                        marked = false;
                    }
                }

                newCard.push({
                    id: `cell-${c}-${r}`,
                    col: c,
                    row: r,
                    num: numVal,
                    marked: marked,
                    isFree: isFree
                });
            }
        }

        setBingoCard(newCard);
        setWinState(false);
        setIsGameOver(false);
        setWinReward(0);
        setPhase('SPIN');

        // Set Balls based on Mode
        setBalls(config.balls);

        setSlotsResult([0, 0, 0, 0, 0]);
        setFireBallActive(false);
        setMagicActive(false);

    }, [clearAllTimers, config, gameMode, levels]); // Re-init if mode or level changes

    // Init on Mount (and when mode changes)
    useEffect(() => {
        initLevel();
    }, [initLevel]);

    // --- ACTIONS ---

    const nextLevel = () => {
        const lvl = levels[gameMode || 'FINGO'];

        // Check for Lucky Wheel Trigger (every 25 levels) GLOBAL? Or per mode? "Global" logic usually
        // User said: "Persistência de Nível... individualmente". "Carteira de coins... global".
        // Lucky Spin is usually tied to progression. Let's keep it tied to the active mode's level progression.
        if (lvl % 25 === 0 && phase !== 'BONUS_WHEEL') {
            setPhase('BONUS_WHEEL');
            return;
        }

        // Increment ONLY current mode level
        setLevels(prev => ({
            ...prev,
            [gameMode]: prev[gameMode] + 1
        }));
    };

    const spinLuckySpin = () => {
        if (pendingLuckyRewardRef.current !== null) return pendingLuckyRewardRef.current;
        // Same probabilities as before
        const r = Math.random() * 100;
        let reward = 0;
        if (r < 0.4) reward = 5;
        else if (r < 0.9) reward = 50;
        else if (r < 3.4) reward = 100;
        else if (r < 13.4) reward = 250;
        else if (r < 32.4) reward = 500;
        else if (r < 72.4) reward = 1000;
        else if (r < 97.4) reward = 2500;
        else if (r < 99.4) reward = 5000;
        else if (r < 99.9) reward = 7500;
        else reward = 10000;

        // Save reward for visual wheel alignment; credit coins when wheel stops (claimLuckySpinReward)
        pendingLuckyRewardRef.current = reward;
        setLuckySpinReward(reward);
        return reward;
    };

    const claimLuckySpinReward = useCallback(() => {
        const finalReward = pendingLuckyRewardRef.current;
        if (finalReward === null) return 0;
        pendingLuckyRewardRef.current = null;
        setLuckySpinReward(null);
        setCoins(prev => prev + finalReward);
        return finalReward;
    }, []);

    const completeLuckySpin = () => {
        pendingLuckyRewardRef.current = null;
        setLuckySpinReward(null);
        // Advance Level after spin
        setLevels(prev => ({
            ...prev,
            [gameMode]: prev[gameMode] + 1
        }));
    };

    const restoreProgress = (value) => {
        const progress = validateProgress(value);
        clearAllTimers();
        pendingLuckyRewardRef.current = null;
        setLuckySpinReward(null);
        setCoins(progress.coins);
        setLevels(progress.levels);
    };

    const startSpin = (magicNumberOverride = null) => {
        if (phase !== 'SPIN' && !(phase === 'DROP' && magicNumberOverride !== null)) return false;

        setPhase('SPINNING');

        // Identify needed numbers
        const neededByCol = [[], [], [], [], []];
        bingoCard.forEach(cell => {
            if (!cell.marked && !cell.isFree) {
                neededByCol[cell.col].push(cell.num);
            }
        });

        const availableCols = [0, 1, 2, 3, 4].filter(c => neededByCol[c].length > 0);

        // Probabilities based on Current Level
        const probs = calculateProbabilities(currentLevel);
        const rand = Math.random();
        let targetCount = 1;

        if (rand < probs.one) targetCount = 1;
        else if (rand < probs.one + probs.two) targetCount = 2;
        else targetCount = 3;

        // Magic Override
        const magicNumber = typeof magicNumberOverride === 'number' ? magicNumberOverride : null;
        if (magicNumber !== null) {
            const cell = bingoCard.find(c => c.num === magicNumber);
            if (cell) setMagicActive(true);
        }

        // Determine Chosen Indices (Golden Buckets) - strictly non-adjacent
        const chosenIndices = pickNonAdjacentColumns(availableCols, targetCount);

        // Fill Data
        const newSlots = [0, 0, 0, 0, 0];
        if (magicNumber !== null) {
            newSlots.fill(magicNumber);
        } else {
            for (let c = 0; c < 5; c++) {
                if (chosenIndices.includes(c)) {
                    const possible = neededByCol[c];
                    newSlots[c] = possible[Math.floor(Math.random() * possible.length)];
                } else {
                    // Random trash
                    const ranges = getLevelRanges(currentLevel);
                    const range = ranges[COLS[c]];
                    let candidate = -1;
                    const existingInCol = bingoCard.filter(cell => cell.col === c).map(cell => cell.num);
                    let attempts = 0;
                    do {
                        candidate = getRandomInt(range[0], range[1]);
                        attempts++;
                    } while ((existingInCol.includes(candidate) || candidate === 'FREE') && attempts < 50);
                    newSlots[c] = candidate;
                }
            }
        }

        setSlotsResult(newSlots);
        safeTimeout(() => setPhase('DROP'), 2200);
        return true;
    };

    const dropBall = () => {
        if (phase !== 'DROP' || balls <= 0) return false;
        setPhase('RESOLVE');
        setBalls(b => b - 1);
        return true;
    };

    const resolveTurn = (numberVal) => {
        let isDefeat = false;
        if (fireBallActive) setFireBallActive(false);
        if (magicActive) setMagicActive(false);

        setSlotsResult([0, 0, 0, 0, 0]);

        let hit = false;
        const newCard = bingoCard.map(cell => {
            // Match number AND ensure it's not already marked
            if (cell.num === numberVal && !cell.marked) {
                hit = true;
                return { ...cell, marked: true };
            }
            return cell;
        });

        let earned = 0;
        let checkResult = false;

        if (hit) {
            setBingoCard(newCard);
            earned = 5;
            setCoins(prev => prev + earned);

            // MODE SPECIFIC WIN CHECK
            if (gameMode === 'FINGO') checkResult = checkLineMatch(newCard);
            else if (gameMode === 'BINGO') checkResult = checkFullCard(newCard);
            else if (gameMode === 'SPINGO') checkResult = checkAnyFive(newCard);

            if (checkResult) {
                // VICTORY
                safeTimeout(() => {
                    setWinState(true);
                    setIsGameOver(true);
                    setPhase('VICTORY');

                    // REWARDS from MODE_CONFIG
                    const earnedReward = calculateWinReward(gameMode, currentLevel);
                    setWinReward(earnedReward);
                    setCoins(prev => prev + earnedReward);
                }, 1100);
            } else {
                // NO Win yet
                if (balls <= 0) {
                    safeTimeout(() => {
                        setIsGameOver(true);
                        setPhase('GAME_OVER');
                    }, 750);
                    isDefeat = true;
                } else {
                    setPhase('SPIN');
                }
            }
        } else {
            if (balls <= 0) {
                if (!winState) {
                    safeTimeout(() => {
                        setIsGameOver(true);
                        setPhase('GAME_OVER');
                    }, 750);
                    isDefeat = true;
                }
            } else {
                setPhase('SPIN');
            }
        }

        return {
            hit,
            earned,
            hasBingo: winState || checkResult,
            isDefeat
        };
    };

    const buyItem = (item, cost) => {
        if (coins >= cost) {
            setCoins(c => c - cost);
            if (item === 'balls') {
                setBalls(b => b + 5);
                setIsGameOver(false);
                if (phase === 'GAME_OVER') setPhase('SPIN');
            } else if (item === 'continue') {
                setBalls(b => b + 10);
                setIsGameOver(false);
                setPhase('SPIN');
            } else if (item === 'fireball') {
                setFireBallActive(true);
            }
            return true;
        }
        return false;
    };

    const modifyCoins = (amount) => {
        if (!Number.isFinite(amount)) return;
        setCoins(c => Math.max(0, c + Math.round(amount)));
    };

    return {
        state: {
            levels,
            isReady,
            storageError,
            coins,
            balls,
            level: currentLevel, // Expose only current level
            bingoCard,
            slotsResult,
            isGameOver,
            winState,
            winReward,
            phase,
            fireBallActive,
            magicActive,
            luckySpinReward
        },
        actions: {
            modifyCoins,
            restoreProgress,
            initLevel,
            startSpin,
            dropBall,
            resolveTurn,
            buyItem,
            nextLevel,
            spinLuckySpin,
            claimLuckySpinReward,
            completeLuckySpin
        }
    };
}
