/**
 * Match Machine (Tigrinho 777) - Core Math & Game Logic Engine
 * 3x3 Classic Slot with 8 Paylines, Wild Multipliers, and Free Spins.
 */

export const SYMBOLS = {
    WILD: {
        id: 'WILD',
        name: 'Tigrinho Wild',
        icon: '🐯',
        image: '/Images/MatchMachine/tiger_wild.png',
        color: 'from-amber-400 to-orange-600',
        payoutMultiplier: 400, // 400x line bet for 3 Wilds
        isWild: true,
        weight: 6
    },
    SEVEN: {
        id: 'SEVEN',
        name: 'Lucky 7',
        icon: '7️⃣',
        image: '/Images/MatchMachine/seven.png',
        color: 'from-red-500 to-amber-500',
        payoutMultiplier: 120, // 120x line bet
        weight: 10
    },
    DIAMOND: {
        id: 'DIAMOND',
        name: 'Diamante',
        icon: '💎',
        image: '/Images/MatchMachine/diamond.png',
        color: 'from-cyan-400 to-blue-600',
        payoutMultiplier: 60, // 60x line bet
        weight: 14
    },
    BAR: {
        id: 'BAR',
        name: 'Lingote de Ouro',
        icon: '🪙',
        image: '/Images/MatchMachine/gold_bar.png',
        color: 'from-yellow-400 to-amber-600',
        payoutMultiplier: 32, // 32x line bet
        weight: 18
    },
    BELL: {
        id: 'BELL',
        name: 'Sino Dourado',
        icon: '🔔',
        image: '/Images/MatchMachine/bell.png',
        color: 'from-amber-300 to-yellow-500',
        payoutMultiplier: 16, // 16x line bet
        weight: 24
    },
    ORANGE: {
        id: 'ORANGE',
        name: 'Laranja',
        icon: '🍊',
        image: '/Images/MatchMachine/orange.png',
        color: 'from-orange-400 to-amber-500',
        payoutMultiplier: 8, // 8x line bet
        weight: 30
    },
    CHERRY: {
        id: 'CHERRY',
        name: 'Cereja',
        icon: '🍒',
        image: '/Images/MatchMachine/cherry.png',
        color: 'from-rose-500 to-red-600',
        payoutMultiplier: 5, // 5x line bet
        weight: 36
    },
    SCATTER: {
        id: 'SCATTER',
        name: 'Raio Bônus',
        icon: '⚡',
        image: '/Images/MatchMachine/scatter_lightning.png',
        color: 'from-yellow-300 to-indigo-500',
        isScatter: true,
        payoutMultiplier: 0,
        weight: 7
    }
};

/**
 * 8 Standard Paylines on a 3x3 Grid
 * Positions are [row, col] (0-indexed)
 */
export const PAYLINES = [
    { id: 0, name: 'Horizontal Top', positions: [[0, 0], [0, 1], [0, 2]] },
    { id: 1, name: 'Horizontal Mid', positions: [[1, 0], [1, 1], [1, 2]] },
    { id: 2, name: 'Horizontal Bot', positions: [[2, 0], [2, 1], [2, 2]] },
    { id: 3, name: 'Vertical Left',  positions: [[0, 0], [1, 0], [2, 0]] },
    { id: 4, name: 'Vertical Mid',   positions: [[0, 1], [1, 1], [2, 1]] },
    { id: 5, name: 'Vertical Right', positions: [[0, 2], [1, 2], [2, 2]] },
    { id: 6, name: 'Diagonal Desc',  positions: [[0, 0], [1, 1], [2, 2]] },
    { id: 7, name: 'Diagonal Asc',   positions: [[2, 0], [1, 1], [0, 2]] }
];

export const BET_PRESETS = [10, 25, 50, 100, 250, 500];

// Weighted pool for fast random symbol selection
const WEIGHTED_POOL = [];
Object.values(SYMBOLS).forEach(sym => {
    for (let i = 0; i < sym.weight; i++) {
        WEIGHTED_POOL.push(sym.id);
    }
});

const WILD_MULTIPLIERS = [2, 2, 2, 3, 3, 5, 10];

/**
 * Generates a single random symbol item
 */
export function getRandomSymbol(isFreeSpin = false) {
    const symbolId = WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
    const base = SYMBOLS[symbolId];
    const item = {
        id: base.id,
        name: base.name,
        icon: base.icon,
        image: base.image,
        color: base.color,
        isWild: !!base.isWild,
        isScatter: !!base.isScatter,
        payoutMultiplier: base.payoutMultiplier,
        multiplier: 1
    };

    if (item.isWild) {
        // Assign a wild multiplier
        const pool = isFreeSpin ? [3, 5, 5, 10, 10] : WILD_MULTIPLIERS;
        item.multiplier = pool[Math.floor(Math.random() * pool.length)];
    }

    return item;
}

/**
 * Generates a complete 3x3 spin grid.
 * Returns a 3x3 2D array: grid[row][col]
 */
export function generateSpinGrid(options = {}) {
    if (options.forceGrid) {
        return options.forceGrid;
    }

    const grid = [];
    for (let r = 0; r < 3; r++) {
        const row = [];
        for (let c = 0; c < 3; c++) {
            row.push(getRandomSymbol(options.isFreeSpin));
        }
        grid.push(row);
    }
    return grid;
}

/**
 * Evaluates the results of a spin on a 3x3 grid.
 *
 * @param {Array<Array<Object>>} grid - 3x3 array of symbol objects
 * @param {number} totalBet - Total coins wagered
 * @param {Object} options - { isFreeSpin: boolean }
 * @returns {Object} Evaluation summary
 */
export function evaluateSpin(grid, totalBet = 10, options = {}) {
    const lineBet = Math.max(1, Math.floor(totalBet / PAYLINES.length));
    const winningLines = [];
    let totalWin = 0;
    let scatterCount = 0;

    // Count scatters anywhere on the grid
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (grid[r][c]?.isScatter) {
                scatterCount++;
            }
        }
    }

    // Evaluate each of the 8 paylines
    PAYLINES.forEach(line => {
        const symbolsOnLine = line.positions.map(([r, c]) => grid[r][c]);

        // Scatters do not pay on paylines
        if (symbolsOnLine.some(s => s?.isScatter)) {
            return;
        }

        // Check if all 3 match (with WILD substitution)
        // Find the target non-wild symbol if any
        const nonWilds = symbolsOnLine.filter(s => !s?.isWild);

        let matchingSymbol = null;
        let isWin = false;

        if (nonWilds.length === 0) {
            // All 3 are WILDS! Jackpot!
            isWin = true;
            matchingSymbol = SYMBOLS.WILD;
        } else {
            const firstId = nonWilds[0].id;
            const allMatch = nonWilds.every(s => s.id === firstId);
            if (allMatch) {
                isWin = true;
                matchingSymbol = SYMBOLS[firstId];
            }
        }

        if (isWin && matchingSymbol) {
            // Calculate multipliers from any Wilds on this line
            let lineMultiplier = 1;
            symbolsOnLine.forEach(s => {
                if (s?.isWild && s?.multiplier > 1) {
                    lineMultiplier *= s.multiplier;
                }
            });

            // If in free spin mode, give an extra 2x boost
            if (options.isFreeSpin) {
                lineMultiplier *= 2;
            }

            const basePayout = matchingSymbol.payoutMultiplier * lineBet;
            const payout = basePayout * lineMultiplier;
            totalWin += payout;

            winningLines.push({
                lineIndex: line.id,
                lineName: line.name,
                symbol: matchingSymbol,
                positions: line.positions,
                multiplier: lineMultiplier,
                basePayout,
                payout
            });
        }
    });

    const freeSpinsTriggered = scatterCount >= 3;
    const isJackpot = winningLines.some(w => w.symbol.id === 'WILD');
    const isBigWin = totalWin >= totalBet * 8;
    const isMegaWin = totalWin >= totalBet * 25;

    return {
        totalBet,
        lineBet,
        totalWin,
        winningLines,
        winningLineCount: winningLines.length,
        scatterCount,
        freeSpinsTriggered,
        freeSpinsAwarded: freeSpinsTriggered ? 10 : 0,
        isWin: totalWin > 0,
        isJackpot,
        isBigWin,
        isMegaWin
    };
}
