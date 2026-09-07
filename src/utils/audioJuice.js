// Web Audio API Zero-Latency Juiciness Synthesizer
// Produces crystal-clear, studio-quality sound effects for coins, ticks, and impacts.

let audioCtx = null;
let sfxVolume = 1.0;

// Pentatonic scale frequencies for ascending reward arpeggios (C5 to G6)
const PENTATONIC_SCALE = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    1174.66, // D6
    1318.51, // E6
    1567.98  // G6
];

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

export function setJuiceVolume(vol) {
    sfxVolume = Math.max(0, Math.min(1, vol));
}

/**
 * Play a sparkling metallic coin chime on an ascending pentatonic pitch.
 * @param {number} pitchIndex - Index in the pentatonic scale (loops or clamps)
 * @param {number} volume - Optional local multiplier (0.0 to 1.0)
 */
export function playCoinTinkle(pitchIndex = 0, volume = 1.0) {
    if (sfxVolume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        const noteFreq = PENTATONIC_SCALE[Math.abs(pitchIndex) % PENTATONIC_SCALE.length];
        const gainNode = ctx.createGain();
        const effectiveVol = 0.25 * sfxVolume * volume;

        // Primary bell tone (Sine)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(noteFreq, now);

        // Overtone for metallic bell sheen (higher harmonic)
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(noteFreq * 2.756, now);

        // Subtle sub sparkle
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(noteFreq * 2, now);

        // Volume envelopes (instant attack, sparkling decay)
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(effectiveVol, now + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        const bellGain = ctx.createGain();
        bellGain.gain.setValueAtTime(0.4, now);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        osc1.connect(gainNode);
        osc2.connect(bellGain);
        bellGain.connect(gainNode);
        osc3.connect(gainNode);

        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);

        osc1.stop(now + 0.38);
        osc2.stop(now + 0.20);
        osc3.stop(now + 0.38);
    } catch {
        // Silently ignore if audio context is restricted
    }
}

/**
 * Mechanical, tactile click for odometer roll
 */
export function playOdometerTick(volume = 0.3) {
    if (sfxVolume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const effectiveVol = 0.12 * sfxVolume * volume;

        osc.type = 'triangle';
        // Very fast pitch drop = crisp mechanical ratchet click
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.015);

        gain.gain.setValueAtTime(effectiveVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.02);
    } catch {
        // Silently ignore
    }
}

/**
 * Punchy low-end thud for ball hits, jackpot slams, and button squash
 */
export function playJuicyHit(pitch = 100, volume = 0.8) {
    if (sfxVolume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const effectiveVol = 0.3 * sfxVolume * volume;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.09);

        gain.gain.setValueAtTime(effectiveVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
    } catch {
        // Silently ignore
    }
}
