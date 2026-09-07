/**
 * sessionPhysics.js
 * Tracks the player's drops in the current session and computes a subtle progressive
 * steering assist curve for Plinko pegs.
 * 
 * Rules:
 * 1. Early in session (drops 0-3): High assist (1.0), giving the player luck when opening the game.
 * 2. As more balls are dropped: Smooth non-linear decay towards baseline.
 * 3. Always possible: Floor is strictly positive (0.15), never zero, never negative.
 */

const SESSION_STORAGE_KEY = 'bplm_session_drop_count';

let memoryDropCount = 0;

/**
 * Returns the number of balls dropped in the current session.
 * @returns {number}
 */
export function getSessionDropCount() {
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            const val = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (val !== null) {
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed) && parsed >= 0) {
                    return parsed;
                }
            }
        }
    } catch {
        // Fallback to in-memory counter if sessionStorage is restricted/unavailable
    }
    return memoryDropCount;
}

/**
 * Increments the session drop count by 1 and returns the updated count.
 * @returns {number}
 */
export function incrementSessionDropCount() {
    const next = getSessionDropCount() + 1;
    memoryDropCount = next;
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem(SESSION_STORAGE_KEY, next.toString());
        }
    } catch {
        // Ignore storage exceptions
    }
    return next;
}

/**
 * Resets the session drop count (e.g. for testing or new session).
 */
export function resetSessionDropCount() {
    memoryDropCount = 0;
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } catch {
        // Ignore
    }
}

/**
 * Computes the assist factor between [0.15, 1.0] based on the number of drops.
 * 
 * - Drops 0 to 3: 1.0 (Maximum assist - player feels lucky right when opening the game)
 * - Drops 4 to 29: Smooth decay from 1.0 down to 0.15
 * - Drops 30+: Baseline floor of 0.15 (Ensures winning is always physically possible)
 * 
 * @param {number} [dropCount] - Optional count override (defaults to current session count)
 * @returns {number} Assist factor between 0.15 and 1.0
 */
export function getSessionAssistFactor(dropCount = getSessionDropCount()) {
    if (dropCount <= 3) {
        return 1.0;
    }
    if (dropCount >= 30) {
        return 0.15;
    }

    // Normalized progression between drop 3 and drop 30: t in (0, 1)
    const t = (dropCount - 3) / 27;

    // Smooth cubic curve: starts flat at 1.0, decays smoothly, flattens out before 0.15
    const factor = 0.15 + (1.0 - 0.15) * Math.pow(1 - t, 1.8);

    return Math.max(0.15, Math.min(1.0, factor));
}
