import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutomaticProgress } from '../src/services/automaticProgress.js';
import { createDriveClient } from '../src/services/googleDrive.js';
import { createBackup } from '../src/utils/progress.js';

const clone = value => structuredClone(value);
const progress = coins => ({ coins, levels: { FINGO: 1, BINGO: 1, SPINGO: 1 } });
const account = { userId: 'a', email: 'a@example.com' };
const revision = (id, coins, parents = []) => ({ ...createBackup(progress(coins), 'a'), revision: id, parents });
function fixture({ local = progress(1000), remote = [], meta = { account, owner: null, base: null, heads: [] } } = {}) {
    const f = { local: clone(local), remote: clone(remote), meta: clone(meta), uploads: [], states: [], connects: 0 };
    let seq = 0;
    f.drive = {
        resume: async () => {}, connect: async () => { f.connects++; return account; }, disconnect: async () => {},
        heads: async () => clone(f.remote),
        save: async (value, info) => {
            f.uploads.push(clone({ value, info }));
            f.remote = [{ ...createBackup(value, 'a'), ...info }];
        },
    };
    f.mount = () => {
        f.controller = createAutomaticProgress({ drive: f.drive, id: () => `new-${++seq}`,
            load: async () => clone(f.meta), save: async value => { f.meta = clone(value); },
            apply: async value => { f.local = clone(value); }, notify: value => f.states.push(value),
        });
        f.controller.update(f.local, true);
        return f.controller;
    };
    f.mount();
    f.status = () => f.states.at(-1).status;
    return f;
}

test('fresh installation automatically restores existing backup without interactive login', async () => {
    const f = fixture({ remote: [revision('r1', 4321)] });
    await f.controller.start();
    assert.equal(f.local.coins, 4321);
    assert.equal(f.connects, 0);
    assert.equal(f.uploads.length, 0);
    assert.equal(f.status(), 'saved');
});

test('offline progress uploads on retry and never sums balances', async () => {
    const f = fixture();
    await f.controller.start();
    const realHeads = f.drive.heads;
    f.drive.heads = async () => { throw new Error('offline'); };
    f.local = progress(800);
    f.controller.update(f.local, true);
    await f.controller.sync();
    assert.equal(f.status(), 'pending');
    f.mount();
    f.drive.heads = realHeads;
    await f.controller.start();
    assert.equal(f.remote[0].progress.coins, 800);
    assert.equal(f.status(), 'saved');
});

test('uncertain upload is acknowledged by its durable revision after restart', async () => {
    const f = fixture();
    const upload = f.drive.save;
    f.drive.save = async (...args) => { await upload(...args); throw new Error('response lost'); };
    await f.controller.start();
    assert.ok(f.meta.pending);
    f.mount();
    await f.controller.start();
    assert.equal(f.uploads.length, 1);
    assert.equal(f.meta.pending, undefined);
    assert.equal(f.status(), 'saved');
});

test('progress changing during upload is queued for the next synchronization', async () => {
    const f = fixture();
    const upload = f.drive.save;
    let release;
    f.drive.save = async (...args) => { await new Promise(resolve => { release = resolve; }); await upload(...args); };
    const running = f.controller.start();
    while (!release) await new Promise(resolve => setImmediate(resolve));
    f.controller.update(progress(1200), true);
    release();
    await running;
    assert.equal(f.status(), 'pending');
    f.drive.save = upload;
    await f.controller.sync();
    assert.equal(f.remote[0].progress.coins, 1200);
    assert.equal(f.uploads.length, 2);
});

test('concurrent device histories require selection and retain all parents', async () => {
    const f = fixture({ remote: [revision('a', 500), revision('b', 900)] });
    await f.controller.start();
    assert.equal(f.status(), 'conflict');
    assert.equal(f.local.coins, 1000);
    assert.equal(f.uploads.length, 0);
    await f.controller.choose('a');
    assert.equal(f.local.coins, 500);
    assert.deepEqual(f.uploads[0].info.parents, ['a', 'b']);
    assert.equal(f.remote[0].progress.coins, 500);
    assert.equal(f.status(), 'saved');
});

test('switching accounts requires explicit choice even when new Drive is empty', async () => {
    const f = fixture({ meta: { account, owner: 'other', base: null, heads: [] } });
    await f.controller.start();
    assert.equal(f.status(), 'conflict');
    assert.equal(f.uploads.length, 0);
    await f.controller.choose('local');
    assert.equal(f.status(), 'saved');
    assert.equal(f.meta.owner, 'a');
});

test('cloud restoration waits for Home and then restores automatically', async () => {
    const f = fixture({ remote: [revision('r1', 4000)] });
    f.controller.update(f.local, false);
    await f.controller.start();
    assert.equal(f.status(), 'waiting-home');
    assert.equal(f.local.coins, 1000);
    f.controller.update(f.local, true);
    await f.controller.sync();
    assert.equal(f.local.coins, 4000);
});

test('failed metadata load retries; failed outbox persistence prevents network writes', async () => {
    let fail = true, writes = 0;
    const controller = createAutomaticProgress({
        drive: { resume: async () => {}, heads: async () => [], save: async () => { writes++; } },
        load: async () => { if (fail) throw new Error('disk'); return { account, owner: null, base: null, heads: [] }; },
        save: async () => { throw new Error('disk'); }, apply: async () => {},
    });
    controller.update(progress(1000), true);
    await controller.start();
    fail = false;
    await controller.sync();
    assert.equal(writes, 0);
});

test('divergent local and cloud progress is preserved until a choice', async () => {
    const f = fixture({ local: progress(500), remote: [revision('r2', 900)],
        meta: { account, owner: 'a', base: JSON.stringify(progress(1000)), heads: ['r1'] } });
    await f.controller.start();
    assert.equal(f.status(), 'conflict');
    assert.equal(f.local.coins, 500);
    assert.equal(f.uploads.length, 0);
});

test('Drive paginates metadata, migrates legacy history and returns concurrent heads', async () => {
    const urls = [];
    const files = [
        { id: 'old1' }, { id: 'old2' },
        { id: 'a', description: 'bplm:' + JSON.stringify({ revision: 'a', parents: ['legacy:old2'] }) },
        { id: 'b', description: 'bplm:' + JSON.stringify({ revision: 'b', parents: ['legacy:old2'] }) },
    ];
    const client = createDriveClient({ silentAuth: { resume: async () => ({ accessToken: 'token' }) }, fetcher: async url => {
        urls.push(url);
        return { ok: true, json: async () => url.includes('alt=media') ? createBackup(progress(100), 'a') :
            url.includes('pageToken=next') ? { files: files.slice(2) } : { files: files.slice(0, 2), nextPageToken: 'next' } };
    } });
    await client.resume(account);
    assert.deepEqual((await client.heads()).map(value => value.revision), ['a', 'b']);
    assert.equal(urls.length, 4);
});

test('Drive refuses cyclic metadata rather than interpreting it as a new account', async () => {
    const client = createDriveClient({ silentAuth: { resume: async () => ({ accessToken: 'token' }) }, fetcher: async () => ({ ok: true,
        json: async () => ({ files: [{ id: 'a', description: 'bplm:{"revision":"a","parents":["a"]}' }] }),
    }) });
    await client.resume(account);
    await assert.rejects(client.heads());
});

test('Drive refreshes rejected access token silently once without persisting credentials', async () => {
    let resumes = 0, invalidated = 0;
    const tokens = [];
    const client = createDriveClient({ silentAuth: {
        resume: async () => ({ accessToken: `token-${++resumes}` }),
        invalidate: async () => { invalidated++; },
    }, fetcher: async (url, options) => {
        tokens.push(options.headers.Authorization);
        return tokens.length === 1 ? { status: 401 } : { ok: true, json: async () => ({ files: [] }) };
    } });
    await client.resume(account);
    assert.deepEqual(await client.heads(), []);
    assert.equal(invalidated, 1);
    assert.deepEqual(tokens, ['Bearer token-1', 'Bearer token-2']);
});
