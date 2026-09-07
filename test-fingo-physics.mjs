// test-fingo-physics.mjs
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { getSessionDropCount, incrementSessionDropCount, resetSessionDropCount, getSessionAssistFactor } from './src/utils/sessionPhysics.js';
import { calculateProbabilities, pickNonAdjacentColumns } from './src/utils/mathUtils.js';
import { computeFloorFallbackBin, buildStaticWorld } from './src/utils/plinkoPhysics.js';
import {
    MODE_CONFIG,
    calculateWinReward,
    checkLineMatch,
    checkFullCard,
    checkAnyFive,
    getLevelRanges
} from './src/hooks/useGameLogic.js';

console.log('=== TEST 1: sessionPhysics (Peg Assist Curve & Drop Tracking) ===');
resetSessionDropCount();
assert.equal(getSessionDropCount(), 0, 'Initial drop count should be 0');

// Test early drops (0-3): Assist factor must be exactly 1.0
for (let d = 0; d <= 3; d++) {
    const factor = getSessionAssistFactor(d);
    assert.equal(factor, 1.0, `Drop ${d} should have maximum assist factor 1.0, got ${factor}`);
}

// Test decay (drops 4 to 29): Must strictly decrease and remain within (0.15, 1.0)
let prevFactor = 1.0;
for (let d = 4; d <= 29; d++) {
    const factor = getSessionAssistFactor(d);
    assert.ok(factor < prevFactor, `Drop ${d} factor (${factor}) must be less than previous (${prevFactor})`);
    assert.ok(factor >= 0.15, `Drop ${d} factor (${factor}) must be >= 0.15`);
    assert.ok(factor <= 1.0, `Drop ${d} factor (${factor}) must be <= 1.0`);
    prevFactor = factor;
}

// Test baseline floor (drops 30+): Must equal 0.15 exactly
for (let d of [30, 31, 50, 100, 1000]) {
    const factor = getSessionAssistFactor(d);
    assert.equal(factor, 0.15, `Drop ${d} should have baseline assist factor 0.15, got ${factor}`);
}

// Test incrementSessionDropCount
assert.equal(incrementSessionDropCount(), 1);
assert.equal(incrementSessionDropCount(), 2);
assert.equal(getSessionDropCount(), 2);
resetSessionDropCount();
assert.equal(getSessionDropCount(), 0);
console.log('✓ sessionPhysics tests PASSED!');


console.log('\n=== TEST 2: mathUtils (Probabilities & Column Selection) ===');
// Test level probabilities
const pLvl1 = calculateProbabilities(1);
assert.ok(pLvl1.one + pLvl1.two + pLvl1.three > 0.99 && pLvl1.one + pLvl1.two + pLvl1.three < 1.01, 'Probabilities should sum to 1');
assert.ok(pLvl1.one > pLvl1.three, 'Level 1 should favor 1 golden column over 3');

// Test pickNonAdjacentColumns
for (let i = 0; i < 50; i++) {
    const available = [0, 1, 2, 3, 4];
    const picked2 = pickNonAdjacentColumns(available, 2);
    if (picked2.length === 2) {
        assert.ok(Math.abs(picked2[0] - picked2[1]) > 1, `Picked columns ${picked2} must NOT be adjacent`);
    }
}
console.log('✓ mathUtils tests PASSED!');


console.log('\n=== TEST 3: FINGO Win Condition (Real checkLineMatch from useGameLogic) ===');
function createTestCard() {
    const card = [];
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 5; r++) {
            const isFree = (c === 2 && r === 2);
            card.push({ col: c, row: r, marked: isFree, isFree });
        }
    }
    return card;
}

// Test initial card: not won
const blankCard = createTestCard();
assert.equal(checkLineMatch(blankCard), false, 'Initial card with only center free should NOT win');

// Test row win
for (let r = 0; r < 5; r++) {
    const card = createTestCard();
    card.forEach(cell => { if (cell.row === r) cell.marked = true; });
    assert.equal(checkLineMatch(card), true, `Row ${r} complete should win FINGO`);
}

// Test col win
for (let c = 0; c < 5; c++) {
    const card = createTestCard();
    card.forEach(cell => { if (cell.col === c) cell.marked = true; });
    assert.equal(checkLineMatch(card), true, `Col ${c} complete should win FINGO`);
}

// Test diagonal 1 win
const cardDiag1 = createTestCard();
cardDiag1.forEach(cell => { if (cell.col === cell.row) cell.marked = true; });
assert.equal(checkLineMatch(cardDiag1), true, 'Main diagonal complete should win FINGO');

// Test diagonal 2 win
const cardDiag2 = createTestCard();
cardDiag2.forEach(cell => { if (cell.col === 4 - cell.row) cell.marked = true; });
assert.equal(checkLineMatch(cardDiag2), true, 'Anti-diagonal complete should win FINGO');

// Test 4 in a row (almost win): should NOT win
const cardAlmost = createTestCard();
cardAlmost.forEach(cell => { if (cell.row === 0 && cell.col < 4) cell.marked = true; });
assert.equal(checkLineMatch(cardAlmost), false, '4 in a row should NOT win FINGO');

console.log('✓ FINGO win check tests PASSED!');


console.log('\n=== TEST 4: Real Floor Fallback & Dynamic Resize Rebuild (plinkoPhysics) ===');
// 6.1 Real computeFloorFallbackBin imported from plinkoPhysics.js
assert.equal(computeFloorFallbackBin(-50, 360), 0, 'Negative x must clamp to bin 0');
assert.equal(computeFloorFallbackBin(450, 360), 4, 'Out of bounds right x must clamp to bin 4');
assert.equal(computeFloorFallbackBin(36, 360), 0, 'x=36 must resolve to bin 0');
assert.equal(computeFloorFallbackBin(100, 360), 1, 'x=100 must resolve to bin 1');
assert.equal(computeFloorFallbackBin(180, 360), 2, 'x=180 must resolve to bin 2');
assert.equal(computeFloorFallbackBin(250, 360), 3, 'x=250 must resolve to bin 3');
assert.equal(computeFloorFallbackBin(320, 360), 4, 'x=320 must resolve to bin 4');

// 6.2 Real buildStaticWorld dynamic repositioning on resize
const engine = Matter.Engine.create();

// Initial build at 400x600
buildStaticWorld(engine, 400, 600);
let bodies = Matter.Composite.allBodies(engine.world);
assert.ok(bodies.length > 0, 'Static bodies must be populated');

const initialFloor = bodies.find(b => b.label === 'floor');
assert.ok(initialFloor, 'Floor must exist');
assert.equal(initialFloor.position.y, 600 + 25, 'Floor position must match 600px height');

const initialSensors = bodies.filter(b => b.label.startsWith('bin-'));
assert.equal(initialSensors.length, 5, 'Must have 5 bucket sensors');
initialSensors.forEach((s, idx) => {
    assert.equal(s.position.y, 600 - 20, `Sensor ${idx} must be positioned at height - 20 (580px)`);
});

// Dynamic Resize to 320x480 (e.g. window resize or mobile orientation change)
buildStaticWorld(engine, 320, 480);
bodies = Matter.Composite.allBodies(engine.world);

const resizedFloor = bodies.find(b => b.label === 'floor');
assert.equal(resizedFloor.position.y, 480 + 25, 'Resized floor position must dynamically adjust to 480px height');

const resizedSensors = bodies.filter(b => b.label.startsWith('bin-'));
assert.equal(resizedSensors.length, 5, 'Must still have exactly 5 bucket sensors');
resizedSensors.forEach((s, idx) => {
    assert.equal(s.position.y, 480 - 20, `Resized sensor ${idx} must dynamically adjust to 480 - 20 (460px)`);
    const expectedX = (idx * (320 / 5)) + ((320 / 5) / 2);
    assert.ok(Math.abs(s.position.x - expectedX) < 1, `Sensor ${idx} X must align to new bucket column center`);
});

console.log('✓ Floor fallback & dynamic resize static world rebuild tests PASSED!');


console.log('\n=== TEST 5: Real Mode Rewards & Win Conditions (from useGameLogic) ===');
// 7.1 Verify MODE_CONFIG values
assert.equal(MODE_CONFIG.FINGO.balls, 50);
assert.equal(MODE_CONFIG.BINGO.balls, 100);
assert.equal(MODE_CONFIG.SPINGO.balls, 25);

// 7.2 Verify real calculateWinReward from useGameLogic.js
assert.equal(calculateWinReward('FINGO', 1), 101, 'FINGO lvl 1 reward must be 101');
assert.equal(calculateWinReward('FINGO', 5), 105, 'FINGO lvl 5 reward must be 105');
assert.equal(calculateWinReward('BINGO', 1), 301, 'BINGO lvl 1 reward must be 301');
assert.equal(calculateWinReward('BINGO', 10), 310, 'BINGO lvl 10 reward must be 310');
assert.equal(calculateWinReward('SPINGO', 1), 51, 'SPINGO lvl 1 reward must be 51');
assert.equal(calculateWinReward('SPINGO', 25), 75, 'SPINGO lvl 25 reward must be 75');

// 7.3 Real checkFullCard from useGameLogic.js
const testBingoCard = createTestCard();
assert.equal(checkFullCard(testBingoCard), false, 'Initial card should not win BINGO full card');
testBingoCard.forEach(c => c.marked = true);
assert.equal(checkFullCard(testBingoCard), true, 'Blackout card must win BINGO');

// 7.4 Real checkAnyFive from useGameLogic.js
const testSpingoCard = createTestCard();
testSpingoCard.forEach(c => c.marked = false); // clear free space
assert.equal(checkAnyFive(testSpingoCard), false, 'Unmarked card should not win SPINGO');
for (let i = 0; i < 5; i++) {
    testSpingoCard[i].marked = true;
}
assert.equal(checkAnyFive(testSpingoCard), true, '5 marked numbers must win SPINGO');

// 7.5 Real getLevelRanges from useGameLogic.js
const rangesLvl1 = getLevelRanges(1);
assert.deepEqual(rangesLvl1.B, [1, 10], 'Level 1 (Easy) B range must be 1-10');
const rangesLvl2 = getLevelRanges(2);
assert.deepEqual(rangesLvl2.B, [1, 15], 'Level 2 (Medium) B range must be 1-15');
const rangesLvl5 = getLevelRanges(5);
assert.deepEqual(rangesLvl5.B, [1, 20], 'Level 5 (Hard) B range must be 1-20');

console.log('✓ Real Mode rewards & win conditions tests PASSED!');


console.log('ALL 5 UNIT SUITES PASSED. Run npm test for React and canvas regressions.');
