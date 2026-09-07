export function validateProgress(value) {
    if (!value || !Number.isSafeInteger(value.coins) || value.coins < 0) {
        throw new Error('Saldo inválido no backup.');
    }
    const levels = {};
    for (const mode of ['FINGO', 'BINGO', 'SPINGO']) {
        const level = value.levels?.[mode];
        if (!Number.isSafeInteger(level) || level < 1 || level > 1000000) {
            throw new Error('Níveis inválidos no backup.');
        }
        levels[mode] = level;
    }
    // Deliberately omit the current card, balls, timers and powers.
    return { coins: value.coins, levels };
}

export function createBackup(progress, userId, now = new Date()) {
    if (!userId) throw new Error('Entre com Google para salvar.');
    return { version: 1, userId, savedAt: now.toISOString(), progress: validateProgress(progress) };
}

export function readBackup(value, userId) {
    if (value?.version !== 1 || value.userId !== userId || !Number.isFinite(Date.parse(value.savedAt))) {
        throw new Error('Backup incompatível ou pertencente a outra conta.');
    }
    return { ...value, progress: validateProgress(value.progress) };
}
