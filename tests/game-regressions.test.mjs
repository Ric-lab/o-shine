import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { transformWithEsbuild } from 'vite';
import Matter from 'matter-js';
import { useGameLogic } from '../src/hooks/useGameLogic.js';

// Transpile the production JSX; all state, actions and event handlers stay intact.
async function loadComponent(name) {
    const filename = new URL(`../src/components/${name}.jsx`, import.meta.url);
    const { code } = await transformWithEsbuild(await readFile(filename, 'utf8'), filename.pathname,
        { loader: 'jsx', jsx: 'automatic', format: 'esm' });
    const resolved = code.replace(/from (['"])([^'"]+)\1/g, (_, quote, specifier) => {
        const url = specifier.startsWith('.') ? new URL(specifier, filename).href : import.meta.resolve(specifier);
        return `from ${quote}${url}${quote}`;
    });
    const source = `${resolved}\n//# sourceURL=${filename.href}`;
    return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
}
const LuckySpin = await loadComponent('LuckySpin');
const GameCanvas = await loadComponent('GameCanvas');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// The ticker's visual frame loop is irrelevant to payout. The real 8s timeout is tested.
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

async function mountGame(t, wheel = false) {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let game;
    function Harness() {
        game = useGameLogic('FINGO');
        return wheel ? React.createElement(LuckySpin, {
            ...game.actions, reward: game.state.luckySpinReward, playTicker() {},
        }) : null;
    }
    let tree;
    await act(async () => {
        tree = TestRenderer.create(React.createElement(React.StrictMode, null, React.createElement(Harness)));
    });
    t.after(async () => { await act(async () => tree.unmount()); });
    return { tree, current: () => game };
}

test('real LuckySpin button credits its pending prize only after 8 seconds', async t => {
    const { tree, current } = await mountGame(t, true);
    const before = current().state.coins;
    const onClick = tree.root.findAllByType('button')[0].props.onClick;
    await act(async () => { onClick(); onClick(); });
    const prize = current().state.luckySpinReward;
    assert.ok(prize > 0);
    await act(async () => t.mock.timers.tick(7999));
    assert.equal(current().state.coins, before);
    await act(async () => t.mock.timers.tick(1));
    assert.equal(current().state.coins, before + prize);
    assert.equal(current().state.luckySpinReward, null);
    assert.ok(JSON.stringify(tree.toJSON()).includes('Continuar'));
    await act(async () => t.mock.timers.tick(8000));
    assert.equal(current().state.coins, before + prize);
});

test('a pre-spin claim callback reads current reward and consumes it once within a batch', async t => {
    const { current } = await mountGame(t);
    const claim = current().actions.claimLuckySpinReward;
    const before = current().state.coins;
    let prize, first, second;
    await act(async () => {
        prize = current().actions.spinLuckySpin();
        // The caller cannot replace the hook's stored prize with another amount.
        first = claim(999999);
        second = claim();
    });
    assert.equal(first, prize);
    assert.equal(second, 0);
    assert.equal(current().state.coins, before + prize);
    assert.equal(current().state.luckySpinReward, null);
});

test('initLevel cancels real spin timers and clears unclaimed rewards', async t => {
    const { current } = await mountGame(t);
    const before = current().state.coins;
    const claim = current().actions.claimLuckySpinReward;
    await act(async () => { current().actions.startSpin(); current().actions.spinLuckySpin(); });
    assert.equal(current().state.phase, 'SPINNING');
    await act(async () => current().actions.initLevel());
    await act(async () => t.mock.timers.tick(10000));
    assert.equal(current().state.phase, 'SPIN');
    assert.deepEqual(current().state.slotsResult, [0, 0, 0, 0, 0]);
    assert.equal(current().state.luckySpinReward, null);
    assert.equal(claim(), 0);
    assert.equal(current().state.coins, before);
});

test('unmounting the real wheel cancels its delayed payout', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const claim = t.mock.fn();
    let tree;
    await act(async () => {
        tree = TestRenderer.create(React.createElement(LuckySpin, {
            reward: null, spinLuckySpin: () => 500, claimLuckySpinReward: claim,
        }));
    });
    await act(async () => tree.root.findAllByType('button')[0].props.onClick());
    await act(async () => tree.unmount());
    await act(async () => t.mock.timers.tick(8000));
    assert.equal(claim.mock.callCount(), 0);
});

for (const label of ['player-ball', 'fireball']) {
    test(`GameCanvas resize and real collisions resolve an in-flight ${label} exactly once`, async t => {
        t.mock.timers.enable({ apis: ['setTimeout'] });
        const scene = { clientWidth: 360, clientHeight: 600 };
        const listeners = new Map();
        const originalWindow = globalThis.window;
        globalThis.window = {
            devicePixelRatio: 1,
            addEventListener: (name, callback) => listeners.set(name, callback),
            removeEventListener: name => listeners.delete(name),
        };
        // Stub only canvas drawing / automatic frame scheduling. The engine,
        // world builder, resize listener and collision callbacks are production code.
        let engine, render;
        t.mock.method(Matter.Render, 'create', options => {
            engine = options.engine;
            render = {
                options: { ...options.options },
                canvas: { style: {}, setAttribute() {}, remove() {} },
                bounds: { min: { x: 0, y: 0 }, max: { x: 360, y: 600 } },
            };
            return render;
        });
        t.mock.method(Matter.Render, 'run', () => {});
        t.mock.method(Matter.Render, 'stop', () => {});
        t.mock.method(Matter.Runner, 'run', () => {});
        const stopRunner = t.mock.method(Matter.Runner, 'stop', () => {});
        let game, resolutions = 0;
        const canvasRef = React.createRef();
        function CanvasHarness() {
            game = useGameLogic('FINGO');
            return React.createElement(GameCanvas, {
                ref: canvasRef, getImage: name => name,
                onBallLanded: index => {
                    resolutions++;
                    game.actions.resolveTurn(game.state.slotsResult[index]);
                },
            });
        }
        let tree;
        t.after(async () => {
            await act(async () => tree.unmount());
            globalThis.window = originalWindow;
        });
        await act(async () => {
            tree = TestRenderer.create(React.createElement(CanvasHarness), { createNodeMock: () => scene });
        });
        await act(async () => t.mock.timers.tick(100));
        await act(async () => game.actions.startSpin());
        await act(async () => t.mock.timers.tick(2200));
        await act(async () => {
            assert.equal(canvasRef.current.dropBall(2, label === 'fireball'), true);
            game.actions.dropBall();
        });
        assert.equal(game.state.phase, 'RESOLVE');
        const ball = Matter.Composite.allBodies(engine.world).find(b => b.label === label);
        Matter.Body.setPosition(ball, { x: 180, y: 550 });
        scene.clientWidth = 320;
        scene.clientHeight = 300;
        listeners.get('resize')();
        listeners.get('orientationchange')();
        await act(async () => t.mock.timers.tick(99));
        assert.equal(render.options.height, 600);
        await act(async () => t.mock.timers.tick(1));
        assert.equal(render.options.height, 300);
        assert.equal(render.canvas.style.height, '300px');
        assert.equal(render.bounds.max.x, 320);
        assert.ok(ball.position.y + ball.circleRadius < 280);
        assert.equal(Matter.Composite.allBodies(engine.world).filter(b => b.label.startsWith('bin-')).length, 5);
        await act(async () => {
            for (let i = 0; i < 180; i++) Matter.Engine.update(engine, 1000 / 60);
        });
        assert.equal(resolutions, 1);
        assert.equal(game.state.phase, 'SPIN');
        await act(async () => tree.unmount());
        assert.equal(stopRunner.mock.callCount(), 1);
        assert.equal(listeners.size, 0);
    });
}
