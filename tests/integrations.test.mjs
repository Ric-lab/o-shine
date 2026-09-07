import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createBackup, readBackup } from '../src/utils/progress.js';
import { createDriveClient } from '../src/services/googleDrive.js';
import { createRewardedAds } from '../src/services/rewardedAds.js';
import { useRewardedAd } from '../src/hooks/useRewardedAd.js';
import { useGameLogic } from '../src/hooks/useGameLogic.js';
import { RewardAdPluginEvents as Event } from '@capacitor-community/admob';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const progress = { coins: 123, levels: { FINGO: 2, BINGO: 3, SPINGO: 4 } };
const flush = () => new Promise(resolve => setImmediate(resolve));

test('backup contains only durable progress and rejects incompatible/account-mismatched data', () => {
    const backup = createBackup({ ...progress, balls: 9, bingoCard: ['active'] }, 'account-a');
    assert.deepEqual(backup.progress, progress);
    assert.deepEqual(readBackup(backup, 'account-a').progress, progress);
    assert.throws(() => readBackup(backup, 'account-b'));
    assert.throws(() => readBackup({ ...backup, version: 2 }, 'account-a'));
    for (const coins of [-1, Infinity, '100', 2.5]) assert.throws(() => createBackup({ ...progress, coins }, 'a'));
    assert.throws(() => createBackup({ ...progress, levels: { FINGO: 1 } }, 'a'));
});

test('Drive authorizes appdata only, appends snapshots and clears access on disconnect', async () => {
    const requests = [];
    let options, signedOut = false;
    const backup = createBackup(progress, 'account-a');
    const auth = {
        initialize: async value => { options = value; },
        signIn: async () => ({ userId: 'account-a', accessToken: 'test-access', email: 'test@example.com' }),
        signOut: async () => { signedOut = true; },
    };
    const client = createDriveClient({ clientId: 'test-client', auth, fetcher: async (url, init) => {
        requests.push({ url, init });
        return { ok: true, json: async () => url.includes('alt=media') ? backup : { files: [{ id: 'file-1' }] } };
    } });
    const account = await client.connect();
    assert.equal(account.accessToken, undefined);
    assert.deepEqual(options.scopes, ['https://www.googleapis.com/auth/drive.appdata']);
    assert.deepEqual((await client.latest()).progress, progress);
    assert.ok(requests[0].url.includes('spaces=appDataFolder'));
    await client.save({ ...progress, balls: 99 });
    const upload = requests.at(-1);
    assert.equal(upload.init.method, 'POST');
    assert.ok(upload.init.body.includes('"parents":["appDataFolder"]'));
    assert.ok(!upload.init.body.includes('"balls"'));
    assert.equal(upload.init.headers.Authorization, 'Bearer test-access');
    await client.disconnect();
    assert.equal(signedOut, true);
    await assert.rejects(client.save(progress));
});

test('Drive expiry invalidates the session and prevents a subsequent upload', async () => {
    let calls = 0;
    const client = createDriveClient({ clientId: 'test-client', auth: {
        initialize: async () => {}, signIn: async () => ({ userId: 'a', accessToken: 'test' }),
    }, fetcher: async () => { calls++; return { status: 401, ok: false }; } });
    await client.connect();
    await assert.rejects(client.latest(), /expirou/);
    await assert.rejects(client.save(progress));
    assert.equal(calls, 1);
});

function fakeAds() {
    const listeners = new Map();
    let shown = 0;
    const sdk = {
        initialize: async () => {},
        requestConsentInfo: async () => ({ canRequestAds: true, status: 'NOT_REQUIRED' }),
        addListener: async (event, fn) => {
            listeners.set(event, fn);
            return { remove: async () => listeners.delete(event) };
        },
        prepareRewardVideoAd: async () => {},
        // Match Android: show may never resolve for an unrewarded dismissal.
        showRewardVideoAd: () => { shown++; listeners.get(Event.Showed)?.(); return new Promise(() => {}); },
    };
    const service = createRewardedAds({ sdk, platform: () => 'android', unitId: 'test-unit', testing: false, timeoutMs: 1000 });
    return { sdk, service, listeners, shown: () => shown, emit: event => listeners.get(event)?.() };
}

test('ad dismissal without Rewarded returns false and removes listeners', async () => {
    const ad = fakeAds();
    const result = ad.service.show();
    await flush();
    assert.equal(ad.shown(), 1);
    ad.emit(Event.Dismissed);
    assert.equal(await result, false);
    assert.equal(ad.listeners.size, 0);
});

test('duplicate reward events settle once after dismissal and concurrent ad calls are rejected', async () => {
    const ad = fakeAds();
    const result = ad.service.show();
    await assert.rejects(ad.service.show(), /andamento/);
    await flush();
    ad.emit(Event.Rewarded); ad.emit(Event.Rewarded);
    ad.emit(Event.Dismissed); ad.emit(Event.Dismissed);
    assert.equal(await result, true);
    assert.equal(ad.shown(), 1);
    assert.equal(ad.listeners.size, 0);
});

test('load failure and denied consent cannot grant rewards', async () => {
    const ad = fakeAds();
    ad.sdk.prepareRewardVideoAd = async () => { throw new Error('offline'); };
    await assert.rejects(ad.service.show(), /exibir/);
    assert.equal(ad.listeners.size, 0);
    assert.equal(ad.shown(), 0);
    ad.sdk.requestConsentInfo = async () => ({ canRequestAds: false });
    await assert.rejects(ad.service.show(), /consentimento/);
});

test('real reward hook grants once and ignores completion after unmount', async () => {
    let resolve, hook, grants = 0, calls = 0;
    const service = { show: () => { calls++; return new Promise(r => { resolve = r; }); } };
    function Harness() { hook = useRewardedAd(service); return null; }
    let tree;
    await act(async () => { tree = TestRenderer.create(React.createElement(Harness)); });
    let first, second;
    await act(async () => {
        first = hook.watch(() => { grants++; });
        second = hook.watch(() => { grants++; });
    });
    await act(async () => { resolve(true); await first; await second; });
    assert.equal(grants, 1); assert.equal(calls, 1);
    await act(async () => { first = hook.watch(() => { grants++; }); });
    await act(async () => tree.unmount());
    resolve(true); await first;
    assert.equal(grants, 1);
});

test('restore replaces coins and all mode levels, cancels spin and starts a fresh card', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let game, tree;
    function Harness() { game = useGameLogic('FINGO'); return null; }
    await act(async () => { tree = TestRenderer.create(React.createElement(Harness)); });
    try {
        await act(async () => game.actions.startSpin());
        assert.equal(game.state.phase, 'SPINNING');
        await act(async () => game.actions.restoreProgress({ ...progress, balls: 1 }));
        await act(async () => t.mock.timers.tick(10000));
        assert.equal(game.state.coins, 123);
        assert.deepEqual(game.state.levels, progress.levels);
        assert.equal(game.state.level, 2);
        assert.equal(game.state.balls, 50);
        assert.equal(game.state.phase, 'SPIN');
        assert.equal(game.state.bingoCard.length, 25);
        assert.throws(() => game.actions.restoreProgress({ ...progress, coins: -1 }));
        assert.equal(game.state.coins, 123);
    } finally { await act(async () => tree.unmount()); }
});
