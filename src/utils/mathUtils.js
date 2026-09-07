
/**
 * Linearly interpolates between two values.
 * @param {number} start - The start value.
 * @param {number} end - The end value.
 * @param {number} t - The interpolation factor (0 to 1).
 * @returns {number} The interpolated value.
 */
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

/**
 * Calculates the probabilities for generating 1, 2, or 3 numbers based on the current level.
 * Performs a linear interpolation (Lerp) from Level 1 to Level 500.
 * 
 * Level 1:
 * 1 Number: 34%
 * 2 Numbers: 33%
 * 3 Numbers: 33%
 * 
 * Level 500 (and above):
 * 1 Number: 95%
 * 2 Numbers: 4%
 * 3 Numbers: 1%
 * 
 * @param {number} currentLevel - The current game level.
 * @returns {Object} An object containing the probabilities { p1, p2, p3 }.
 */
export function calculateProbabilities(currentLevel) {
    // Clamp level to max 500 for calculation
    const effectiveLevel = Math.min(Math.max(currentLevel, 1), 500);
    const maxLevel = 500;

    // Calculate t (0.0 at level 1, 1.0 at level 500)
    const t = (effectiveLevel - 1) / (maxLevel - 1);

    const p1 = lerp(0.34, 0.95, t);
    const p2 = lerp(0.33, 0.04, t);
    const p3 = lerp(0.33, 0.01, t);

    return {
        one: p1,
        two: p2,
        three: p3
    };
}

/**
 * Selects up to `targetCount` columns from `availableCols` ensuring that
 * no two chosen columns are adjacent (distance |c1 - c2| >= 2).
 * 
 * @param {number[]} availableCols - Array of column indices (e.g. [0, 1, 2, 3, 4]).
 * @param {number} targetCount - Desired number of columns to select (typically 1, 2, or 3).
 * @returns {number[]} Array of selected non-adjacent column indices.
 */
export function pickNonAdjacentColumns(availableCols, targetCount) {
    if (!availableCols || availableCols.length === 0 || targetCount <= 0) {
        return [];
    }

    const sortedCols = [...availableCols].sort((a, b) => a - b);

    // Find all non-adjacent combinations of a specific size `k`
    const findCombinations = (k) => {
        const combos = [];
        const backtrack = (start, current) => {
            if (current.length === k) {
                combos.push([...current]);
                return;
            }
            for (let i = start; i < sortedCols.length; i++) {
                const col = sortedCols[i];
                if (current.length === 0 || col - current[current.length - 1] >= 2) {
                    current.push(col);
                    backtrack(i + 1, current);
                    current.pop();
                }
            }
        };
        backtrack(0, []);
        return combos;
    };

    // Try desired targetCount down to 1 until we find valid non-adjacent combinations
    for (let count = Math.min(targetCount, sortedCols.length); count >= 1; count--) {
        const validCombos = findCombinations(count);
        if (validCombos.length > 0) {
            const randomIndex = Math.floor(Math.random() * validCombos.length);
            return validCombos[randomIndex];
        }
    }

    return [sortedCols[Math.floor(Math.random() * sortedCols.length)]];
}

