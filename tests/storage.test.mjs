import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { loadJSON, createJSONStorage } from '../src/utils/storage.js';
import { useGameLogic } from '../src/hooks/useGameLogic.js';

const values = new Map();
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
globalThis.window = { localStorage: globalThis.localStorage };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const native = key => `CapacitorStorage.${key}`;

test('serialized writes cannot finish with an older balance; journal updates synchronously', async t => {
    let release;
    const preferences = { get: async ({ key }) => ({ value: values.get(native(key)) }), set: async ({ key, value }) => values.set(native(key), value) };
    const { saveJSON, loadJSON } = createJSONStorage(preferences);
    const original = preferences.set;
    let count = 0;
    t.mock.method(preferences, 'set', async function (options) {
        if (++count === 1) await new Promise(resolve => { release = resolve; });
        return original.call(this, options);
    });
    const first = saveJSON('race', { coins: 1000 });
    while (!release) await new Promise(resolve => setImmediate(resolve));
    const second = saveJSON('race', { coins: 500 });
    assert.equal(JSON.parse(values.get('journal:race')).value.coins, 500);
    release();
    await Promise.all([first, second]);
    assert.equal(JSON.parse(values.get(native('race'))).value.coins, 500);
    assert.equal((await loadJSON('race')).coins, 500);
});

test('journal recovers a failed native write and retry persists it', async t => {
    const preferences = { get: async ({ key }) => ({ value: values.get(native(key)) }), set: async ({ key, value }) => values.set(native(key), value) };
    const { saveJSON, loadJSON, flushStorage } = createJSONStorage(preferences);
    const mocked = t.mock.method(preferences, 'set', async () => { throw new Error('disk full'); });
    await assert.rejects(saveJSON('retry', { coins: 600 }));
    assert.equal((await loadJSON('retry')).coins, 600);
    mocked.mock.restore();
    await flushStorage();
    assert.equal(JSON.parse(values.get(native('retry'))).value.coins, 600);
});

test('legacy progress migrates and newer native records beat stale journals', async () => {
    values.set(native('legacy'), JSON.stringify({ coins: 70 }));
    assert.deepEqual(await loadJSON('legacy'), { coins: 70 });
    values.set('journal:newer', JSON.stringify({ __record: 1, sequence: 1, value: { coins: 10 } }));
    values.set(native('newer'), JSON.stringify({ __record: 1, sequence: 2, value: { coins: 20 } }));
    assert.equal((await loadJSON('newer')).coins, 20);
});

test('corruption is not silently treated as first launch; valid native copy can recover journal', async () => {
    values.set('journal:broken', '{}');
    await assert.rejects(loadJSON('broken'));
    values.set(native('broken'), JSON.stringify({ coins: 75 }));
    assert.equal((await loadJSON('broken')).coins, 75);
});

test('real game hook saves purchases and claimed wheel rewards and restores them on remount', async () => {
    let game, tree;
    function Harness() { game = useGameLogic('FINGO'); return null; }
    await act(async () => { tree = TestRenderer.create(React.createElement(Harness)); });
    assert.equal(game.state.isReady, true);
    await act(async () => { game.actions.buyItem('fireball', 100); });
    assert.equal((await loadJSON('bplm.gameLogic.v1')).coins, 900);
    await act(async () => { game.actions.spinLuckySpin(); });
    const reward = game.state.luckySpinReward;
    await act(async () => { game.actions.claimLuckySpinReward(); });
    assert.equal((await loadJSON('bplm.gameLogic.v1')).coins, 900 + reward);
    await act(async () => { tree.unmount(); });
    await act(async () => { tree = TestRenderer.create(React.createElement(Harness)); });
    assert.equal(game.state.coins, 900 + reward);
    assert.equal(game.state.storageError, false);
    await act(async () => { tree.unmount(); });
});
