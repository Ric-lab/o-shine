// VFX & Juiciness Event Bus for O-Shine
// Allows any minigame or UI component to trigger juicy particles, shakes, and feedback.

class VFXBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        const set = this.listeners.get(event);
        if (set) {
            set.delete(callback);
            if (set.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    emit(event, payload) {
        const set = this.listeners.get(event);
        if (set) {
            set.forEach(cb => {
                try {
                    cb(payload);
                } catch (err) {
                    console.error(`[VFXBus] Error in listener for ${event}:`, err);
                }
            });
        }
    }

    // Convenience triggers
    triggerCoinFountain(options = {}) {
        const defaultX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
        const defaultY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
        this.emit('coin-fountain', {
            origin: options.origin || { x: defaultX, y: defaultY },
            count: options.count || 12,
            value: options.value || 0,
            color: options.color || 'gold',
            ...options
        });
    }

    triggerScreenShake(options = {}) {
        this.emit('screen-shake', {
            intensity: options.intensity || 5,
            duration: options.duration || 60,
            ...options
        });
    }

    triggerFloatingText(options = {}) {
        const defaultX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
        const defaultY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
        this.emit('floating-text', {
            text: options.text || '',
            origin: options.origin || { x: defaultX, y: defaultY },
            type: options.type || 'gold', // 'gold', 'combo', 'win', 'bonus'
            duration: options.duration || 1200,
            ...options
        });
    }

    notifyCoinLanded(payload = {}) {
        this.emit('coin-landed', payload);
    }
}

export const vfxBus = new VFXBus();
