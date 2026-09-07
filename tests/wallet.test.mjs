import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useWallet } from '../src/hooks/useWallet.js';

function TestWalletComponent({ initialCoins, onRender }) {
    const wallet = useWallet(initialCoins);
    onRender(wallet);
    return null;
}

test('useWallet handles deposits, withdrawals, and balance checks correctly', () => {
    let currentWallet = null;

    act(() => {
        TestRenderer.create(
            React.createElement(TestWalletComponent, {
                initialCoins: 500,
                onRender: (wallet) => { currentWallet = wallet; }
            })
        );
    });

    assert.equal(currentWallet.coins, 500);
    assert.equal(currentWallet.canAfford(300), true);
    assert.equal(currentWallet.canAfford(600), false);

    // Test deposit
    act(() => {
        currentWallet.deposit(250, 'bonus', { triggerVfx: false });
    });
    assert.equal(currentWallet.coins, 750);
    assert.equal(currentWallet.history.length, 1);
    assert.equal(currentWallet.history[0].type, 'DEPOSIT');
    assert.equal(currentWallet.history[0].amount, 250);

    // Test withdraw success
    let withdrawOk = false;
    act(() => {
        withdrawOk = currentWallet.withdraw(200, 'spin_bet');
    });
    assert.equal(withdrawOk, true);
    assert.equal(currentWallet.coins, 550);
    assert.equal(currentWallet.history.length, 2);
    assert.equal(currentWallet.history[0].type, 'WITHDRAW');

    // Test withdraw failure (insufficient balance)
    let failedWithdraw = true;
    act(() => {
        failedWithdraw = currentWallet.withdraw(1000, 'big_bet');
    });
    assert.equal(failedWithdraw, false);
    assert.equal(currentWallet.coins, 550, 'Balance should remain unchanged on failed withdrawal');
});
