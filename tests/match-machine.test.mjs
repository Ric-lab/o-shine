import test from 'node:test';
import assert from 'node:assert/strict';
import {
    SYMBOLS,
    PAYLINES,
    generateSpinGrid,
    evaluateSpin
} from '../src/utils/matchMachineLogic.js';

test('PAYLINES defines exactly 8 valid lines on a 3x3 grid', () => {
    assert.equal(PAYLINES.length, 8);
    PAYLINES.forEach(line => {
        assert.equal(line.positions.length, 3);
        line.positions.forEach(([r, c]) => {
            assert.ok(r >= 0 && r < 3, `Row ${r} out of bounds`);
            assert.ok(c >= 0 && c < 3, `Col ${c} out of bounds`);
        });
    });
});

test('generateSpinGrid produces a 3x3 grid of valid symbols', () => {
    const grid = generateSpinGrid();
    assert.equal(grid.length, 3);
    for (let r = 0; r < 3; r++) {
        assert.equal(grid[r].length, 3);
        for (let c = 0; c < 3; c++) {
            const sym = grid[r][c];
            assert.ok(sym.id, 'Symbol must have id');
            assert.ok(sym.icon, 'Symbol must have icon');
            assert.ok(typeof sym.multiplier === 'number', 'Multiplier must be number');
        }
    }
});

test('evaluateSpin correctly scores 3 CHERRIES on top horizontal line', () => {
    const cherry = { ...SYMBOLS.CHERRY, multiplier: 1 };
    const d1 = { ...SYMBOLS.BELL, multiplier: 1 };
    const d2 = { ...SYMBOLS.ORANGE, multiplier: 1 };
    const d3 = { ...SYMBOLS.BAR, multiplier: 1 };

    const grid = [
        [cherry, cherry, cherry], // Line 0 (Top Horizontal)
        [d1,     d2,     d3],
        [d2,     d3,     d1]
    ];

    const totalBet = 80; // lineBet = 10
    const evalResult = evaluateSpin(grid, totalBet);

    assert.equal(evalResult.isWin, true);
    assert.equal(evalResult.winningLineCount, 1);
    assert.equal(evalResult.winningLines[0].lineIndex, 0);
    // Base payout for cherry: 5 * 10 = 50
    assert.equal(evalResult.totalWin, 50);
});

test('WILD substitutes for other symbols and applies multiplier', () => {
    const seven = { ...SYMBOLS.SEVEN, multiplier: 1 };
    const wildX3 = { ...SYMBOLS.WILD, isWild: true, multiplier: 3 };
    const d1 = { ...SYMBOLS.CHERRY, multiplier: 1 };
    const d2 = { ...SYMBOLS.ORANGE, multiplier: 1 };
    const d3 = { ...SYMBOLS.BELL, multiplier: 1 };
    const d4 = { ...SYMBOLS.DIAMOND, multiplier: 1 };

    const grid = [
        [d1,    d2,     d3],
        [seven, wildX3, seven], // Line 1: Seven + Wild (x3) + Seven
        [d2,    d3,     d4]
    ];

    const totalBet = 40; // lineBet = 5
    const evalResult = evaluateSpin(grid, totalBet);

    assert.equal(evalResult.isWin, true);
    assert.equal(evalResult.winningLineCount, 1);
    const lineWin = evalResult.winningLines[0];
    assert.equal(lineWin.symbol.id, 'SEVEN');
    assert.equal(lineWin.multiplier, 3);
    // SEVEN payoutMultiplier is 120 * lineBet(5) = 600 * 3 = 1800
    assert.equal(lineWin.payout, 1800);
    assert.equal(evalResult.totalWin, 1800);
    assert.equal(evalResult.isBigWin, true);
});

test('3 WILDS triggers JACKPOT', () => {
    const wild = { ...SYMBOLS.WILD, isWild: true, multiplier: 2 };
    const d1 = { ...SYMBOLS.CHERRY, multiplier: 1 };
    const d2 = { ...SYMBOLS.ORANGE, multiplier: 1 };
    const d3 = { ...SYMBOLS.BELL, multiplier: 1 };

    const grid = [
        [d1,   d2,   d3],
        [d2,   d3,   d1],
        [wild, wild, wild] // Line 2: 3 Wilds
    ];

    const totalBet = 80; // lineBet = 10
    const evalResult = evaluateSpin(grid, totalBet);

    assert.equal(evalResult.isWin, true);
    assert.equal(evalResult.isJackpot, true);
    const jackpotLine = evalResult.winningLines.find(l => l.symbol.id === 'WILD');
    assert.ok(jackpotLine, 'Must have a WILD jackpot line');
    // Multipliers: 2 * 2 * 2 = 8. Base payout 400 * 10 = 4000. Payout: 4000 * 8 = 32000
    assert.equal(jackpotLine.multiplier, 8);
    assert.equal(jackpotLine.payout, 32000);
});

test('3 SCATTERS triggers 10 Free Spins', () => {
    const scatter = { ...SYMBOLS.SCATTER, isScatter: true, multiplier: 1 };
    const d1 = { ...SYMBOLS.CHERRY, multiplier: 1 };
    const d2 = { ...SYMBOLS.ORANGE, multiplier: 1 };
    const d3 = { ...SYMBOLS.BELL, multiplier: 1 };

    const grid = [
        [scatter, d1,      d2],
        [d2,      scatter, d3],
        [d3,      d1,      scatter]
    ];

    const evalResult = evaluateSpin(grid, 50);
    assert.equal(evalResult.scatterCount, 3);
    assert.equal(evalResult.freeSpinsTriggered, true);
    assert.equal(evalResult.freeSpinsAwarded, 10);
});

test('Free Spins mode applies bonus multiplier boost', () => {
    const bell = { ...SYMBOLS.BELL, multiplier: 1 };
    const d1 = { ...SYMBOLS.CHERRY, multiplier: 1 };
    const d2 = { ...SYMBOLS.ORANGE, multiplier: 1 };

    const grid = [
        [bell, d1,   d2],
        [d2,   bell, d1],
        [d1,   d2,   bell] // Line 6: Diagonal Desc
    ];

    const totalBet = 80; // lineBet = 10
    const evalNormal = evaluateSpin(grid, totalBet, { isFreeSpin: false });
    const evalBonus = evaluateSpin(grid, totalBet, { isFreeSpin: true });

    // Normal: 16 * 10 = 160
    assert.equal(evalNormal.totalWin, 160);
    // Free Spin gives extra 2x boost: 160 * 2 = 320
    assert.equal(evalBonus.totalWin, 320);
});

test('Diagonal and Vertical paylines are properly recognized', () => {
    const bar = { ...SYMBOLS.BAR, multiplier: 1 };
    const d1 = { ...SYMBOLS.CHERRY, multiplier: 1 };
    const d2 = { ...SYMBOLS.ORANGE, multiplier: 1 };

    // Column 0 (Line 3: Vertical Left)
    const gridCol0 = [
        [bar, d1, d2],
        [bar, d2, d1],
        [bar, d1, d2]
    ];
    const evalCol0 = evaluateSpin(gridCol0, 80);
    assert.equal(evalCol0.winningLines.some(l => l.lineIndex === 3), true);

    // Diagonal Asc (Line 7)
    const gridDiagAsc = [
        [d1,  d2,  bar],
        [d2,  bar, d1],
        [bar, d1,  d2]
    ];
    const evalDiagAsc = evaluateSpin(gridDiagAsc, 80);
    assert.equal(evalDiagAsc.winningLines.some(l => l.lineIndex === 7), true);
});
