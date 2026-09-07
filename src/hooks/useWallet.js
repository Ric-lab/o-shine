import { useState, useCallback, useRef, useEffect } from 'react';
import { vfxBus } from '../services/vfxBus.js';
import { playCoinTinkle } from '../utils/audioJuice.js';

/**
 * Unified Global Wallet Hook for O-Shine Multi-Game Hub.
 * Manages coins, bets, payouts, and transaction history across all 9 minigames.
 */
export function useWallet(initialCoins = 1000, onBalanceChange = null) {
    const [coins, setCoins] = useState(initialCoins);
    const [history, setHistory] = useState([]);
    const coinsRef = useRef(initialCoins);

    useEffect(() => {
        coinsRef.current = coins;
    }, [coins]);

    const recordTransaction = useCallback((type, amount, reason) => {
        const tx = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            type, // 'DEPOSIT' | 'WITHDRAW'
            amount,
            reason: reason || 'gameplay'
        };
        setHistory(prev => [tx, ...prev.slice(0, 49)]); // Keep last 50 transactions
        return tx;
    }, []);

    const canAfford = useCallback((amount) => {
        return Number.isFinite(amount) && amount > 0 && coinsRef.current >= amount;
    }, []);

    const deposit = useCallback((amount, reason = 'win', options = {}) => {
        if (!Number.isFinite(amount) || amount <= 0) return 0;

        const newBalance = coinsRef.current + Math.round(amount);
        setCoins(newBalance);
        coinsRef.current = newBalance;
        recordTransaction('DEPOSIT', Math.round(amount), reason);

        if (onBalanceChange) {
            onBalanceChange(newBalance);
        }

        if (options.triggerVfx !== false) {
            vfxBus.triggerCoinFountain({
                count: Math.min(24, Math.max(8, Math.floor(amount / 20))),
                value: amount,
                origin: options.origin
            });
            playCoinTinkle(0);
        }

        return newBalance;
    }, [recordTransaction, onBalanceChange]);

    const withdraw = useCallback((amount, reason = 'bet') => {
        if (!Number.isFinite(amount) || amount <= 0) return false;
        if (coinsRef.current < amount) return false;

        const newBalance = coinsRef.current - Math.round(amount);
        setCoins(newBalance);
        coinsRef.current = newBalance;
        recordTransaction('WITHDRAW', Math.round(amount), reason);

        if (onBalanceChange) {
            onBalanceChange(newBalance);
        }

        return true;
    }, [recordTransaction, onBalanceChange]);

    const setBalance = useCallback((newAmount) => {
        if (!Number.isFinite(newAmount) || newAmount < 0) return;
        setCoins(newAmount);
        coinsRef.current = newAmount;
        if (onBalanceChange) {
            onBalanceChange(newAmount);
        }
    }, [onBalanceChange]);

    return {
        coins,
        canAfford,
        deposit,
        withdraw,
        setBalance,
        history
    };
}
