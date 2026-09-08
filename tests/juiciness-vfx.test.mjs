import assert from 'node:assert/strict';
import test from 'node:test';
import { vfxBus } from '../src/services/vfxBus.js';
import { setJuiceVolume, playCoinTinkle, playOdometerTick, playJuicyHit, playReelTick, playReelStop, playPaylineWin, playScatterHit } from '../src/utils/audioJuice.js';

test('vfxBus registers listeners and dispatches events correctly', () => {
    let receivedFountain = null;
    let receivedShake = null;
    let receivedText = null;
    let receivedLanded = false;

    const unsubs = [
        vfxBus.on('coin-fountain', (payload) => { receivedFountain = payload; }),
        vfxBus.on('screen-shake', (payload) => { receivedShake = payload; }),
        vfxBus.on('floating-text', (payload) => { receivedText = payload; }),
        vfxBus.on('coin-landed', () => { receivedLanded = true; })
    ];

    vfxBus.triggerCoinFountain({ count: 15, value: 100 });
    assert.equal(receivedFountain?.count, 15);
    assert.equal(receivedFountain?.value, 100);

    vfxBus.triggerScreenShake({ intensity: 4, duration: 60 });
    assert.equal(receivedShake?.intensity, 4);
    assert.equal(receivedShake?.duration, 60);

    vfxBus.triggerFloatingText({ text: 'BIG WIN!', type: 'win' });
    assert.equal(receivedText?.text, 'BIG WIN!');
    assert.equal(receivedText?.type, 'win');

    vfxBus.notifyCoinLanded();
    assert.equal(receivedLanded, true);

    // Test unsubscription
    unsubs.forEach(unsub => unsub());

    receivedLanded = false;
    vfxBus.notifyCoinLanded();
    assert.equal(receivedLanded, false, 'Unsubscribed listener should not receive events');
});

test('audioJuice synthesizes sounds safely in headless environment without crashing', () => {
    // In Node.js environment without window.AudioContext, functions should safely no-op
    assert.doesNotThrow(() => {
        setJuiceVolume(0.8);
        playCoinTinkle(0);
        playCoinTinkle(3);
        playOdometerTick();
        playJuicyHit(80);
        playReelTick();
        playReelStop(0);
        playReelStop(1);
        playReelStop(2);
        playPaylineWin();
        playScatterHit();
    });
});

