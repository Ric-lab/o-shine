import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Matter from 'matter-js';
import { incrementSessionDropCount, getSessionAssistFactor } from '../utils/sessionPhysics.js';
import { PHYSICS_CONFIG, computeFloorFallbackBin, buildStaticWorld, resizeWorld } from '../utils/plinkoPhysics.js';

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Vector } = Matter;

const GameCanvas = forwardRef(({ onBallLanded, onPegHit, vibrationLevel = 1, getImage, goldenCols = [] }, ref) => {
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);
    const runnerRef = useRef(null);
    // Track balls that have already triggered a score to prevent double-counting/crashes
    const processedBalls = useRef(new Set());

    // Fix Stale Closure: Keep track of the latest callback
    const onBallLandedRef = useRef(onBallLanded);
    const vibrationLevelRef = useRef(vibrationLevel);

    // Dynamic targets for subtle peg steering without restarting physics engine
    const goldenColsRef = useRef(goldenCols);

    // Audio & Visual Refs
    // const { play: playHit } = useSound('/Audio/peg.mp3', { volume: 1.0, multi: true }); // Moved to App.jsx
    const playHitRef = useRef(onPegHit);
    const litPegs = useRef(new Map()); // Map<ID, {x, y, time}>

    // Shake State
    const [shake, setShake] = useState(false);

    const getImageRef = useRef(getImage);
    useEffect(() => {
        getImageRef.current = getImage;
    }, [getImage]);

    useEffect(() => {
        onBallLandedRef.current = onBallLanded;
        playHitRef.current = onPegHit;
    }, [onBallLanded, onPegHit]);

    useEffect(() => {
        vibrationLevelRef.current = vibrationLevel;
    }, [vibrationLevel]);

    useEffect(() => {
        goldenColsRef.current = goldenCols;
    }, [goldenCols]);

    useImperativeHandle(ref, () => ({
        dropBall: (colIdx, isFireBall = false) => {
            if (!engineRef.current || !renderRef.current) return false;

            const width = renderRef.current.options.width;

            // --- GRID LOGIC ---
            // Buckets: 5 (Standard)
            // const TOTAL_BINS = 5; // Unused for drop logic now

            // PEG DENSITY (Decoupled from Bins)
            const pegSpacing = width / PHYSICS_CONFIG.PEG_COLS;

            // FIXED DROP POINTS aligned to peg columns (1..5 of 7)
            let startX;

            if (isFireBall) {
                // FIREBALL: Perfect Center of the Bin (Advantage)
                const TOTAL_BINS = 5;
                const binW = width / TOTAL_BINS;
                startX = (colIdx * binW) + (binW / 2);
            } else {
                // NORMAL BALL: Aligned to specific Peg Columns (Challenge)
                const targetPegCol = colIdx + 1;
                startX = (targetPegCol * pegSpacing) + (pegSpacing / 2);
            }

            const ballRadius = width * PHYSICS_CONFIG.BALL_RADIUS_RATIO;
            const ball = Bodies.circle(startX, -20, ballRadius, {
                restitution: isFireBall ? 0.0 : PHYSICS_CONFIG.BALL_RESTITUTION,
                friction: isFireBall ? 0 : PHYSICS_CONFIG.BALL_FRICTION,
                frictionAir: isFireBall ? 0.07 : PHYSICS_CONFIG.BALL_FRICTION_AIR,
                density: PHYSICS_CONFIG.BALL_DENSITY,
                render: isFireBall ? {
                    fillStyle: '#ff4d00',
                    strokeStyle: '#ffae00',
                    lineWidth: 4
                } : {
                    sprite: {
                        texture: getImage('ball.png'),
                        xScale: (ballRadius * 2) / 128, // Image is now 128px
                        yScale: (ballRadius * 2) / 128
                    }
                },
                label: isFireBall ? 'fireball' : 'player-ball',
                isSensor: isFireBall // FIREBALL IGNORES ALL COLLISIONS (But triggers events)
            });

            // Random slight x velocity (chaos) ONLY IF NOT FIREBALL — prevents straight fall
            if (!isFireBall) {
                incrementSessionDropCount();
                Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * PHYSICS_CONFIG.BALL_INITIAL_X_CHAOS, y: 0 });
            } else {
                Matter.Body.setVelocity(ball, { x: 0, y: 5 }); // Push it down
            }

            Composite.add(engineRef.current.world, ball);
            return true;
        }
    }));

    useEffect(() => {
        if (!sceneRef.current) return;

        // CRITICAL FIX: Delay initialization to ensure layout is stable
        // The container might be resizing (flexbox) when this runs immediately.
        const timer = setTimeout(() => {
            if (!sceneRef.current) return;

            // dimensions (Check freshly)
            const width = sceneRef.current.clientWidth;
            const height = sceneRef.current.clientHeight;

            // Setup Matter JS
            const engine = Engine.create();
            engine.world.gravity.y = PHYSICS_CONFIG.GRAVITY_Y;
            engineRef.current = engine;

            const render = Render.create({
                element: sceneRef.current,
                engine: engine,
                options: {
                    width,
                    height,
                    wireframes: false, // SHOW ACTUAL BODIES (Solids)
                    background: 'transparent',
                    pixelRatio: window.devicePixelRatio
                }
            });
            renderRef.current = render;

            // Build static physical world (walls, floor, pegs, funnels, sensors)
            buildStaticWorld(engine, width, height, getImageRef.current);

            // Collision Event
            Events.on(engine, 'collisionStart', (evt) => {
                evt.pairs.forEach(pair => {
                    const { bodyA, bodyB } = pair;

                    // Identify ball and sensor
                    let ball = null;
                    let sensor = null;

                    if (bodyA.label === 'player-ball' || bodyA.label === 'fireball') ball = bodyA;
                    else if (bodyB.label === 'player-ball' || bodyB.label === 'fireball') ball = bodyB;

                    if (bodyA.label.startsWith('bin-')) sensor = bodyA;
                    else if (bodyB.label.startsWith('bin-')) sensor = bodyB;

                    const isFloor = bodyA.label === 'floor' || bodyB.label === 'floor';
                    const peg = (bodyA.label === 'peg' ? bodyA : (bodyB.label === 'peg' ? bodyB : null));

                    // Explicitly IGNORE separators/funnels for sound
                    const isFunnel = bodyA.label.includes('funnel') || bodyB.label.includes('funnel');
                    if (isFunnel) return;

                    // ACTIVE BUMPER LOGIC — kick along the normal for "relevant" direction change
                    if (ball && peg) {
                        const normal = Vector.normalise(Vector.sub(ball.position, peg.position));
                        const force = Vector.mult(normal, PHYSICS_CONFIG.PEG_ACTIVE_FORCE);

                        // SUBTLE PROGRESSIVE NUDGE TOWARDS GOLDEN TARGETS (Imperceptible to player)
                        if (ball.label === 'player-ball') {
                            const activeTargets = goldenColsRef.current;
                            if (activeTargets && activeTargets.length > 0) {
                                const width = renderRef.current?.options?.width || sceneRef.current?.clientWidth || 360;
                                const binW = width / 5;

                                let bestTargetX = null;
                                let minDist = Infinity;

                                for (let i = 0; i < activeTargets.length; i++) {
                                    const colIdx = activeTargets[i];
                                    const colCenterX = (colIdx + 0.5) * binW;
                                    const dist = Math.abs(colCenterX - ball.position.x);
                                    if (dist < minDist) {
                                        minDist = dist;
                                        bestTargetX = colCenterX;
                                    }
                                }

                                if (bestTargetX !== null) {
                                    const diffX = bestTargetX - ball.position.x;
                                    // Only nudge if not already directly centered above the target bucket
                                    if (Math.abs(diffX) > 6) {
                                        const dirX = Math.sign(diffX);
                                        const assist = getSessionAssistFactor();
                                        const nudge = dirX * PHYSICS_CONFIG.PEG_STEER_NUDGE * assist;
                                        force.x += nudge;
                                    }
                                }
                            }
                        }

                        Body.applyForce(ball, ball.position, force);

                        // --- FEEDBACK SECTION ---
                        // 1. Audio
                        // FIREBALL IS SILENT (For now)
                        if (playHitRef.current && ball.label !== 'fireball') {
                            playHitRef.current();
                        }

                        // 2. Haptic
                        if (vibrationLevelRef.current > 0 && navigator.vibrate) navigator.vibrate(15 * vibrationLevelRef.current);

                        // 3. Visual (Light Up)
                        // Save the peg position and time to the map
                        litPegs.current.set(peg.id, {
                            x: peg.position.x,
                            y: peg.position.y,
                            time: Date.now()
                        });
                    }

                    // ACTIVE WALL KICK (Keep it in the center!)
                    if (ball) {
                        const hitLeft = (bodyA.label === 'wall-left' || bodyB.label === 'wall-left');
                        const hitRight = (bodyA.label === 'wall-right' || bodyB.label === 'wall-right');

                        if (hitLeft) {
                            Body.applyForce(ball, ball.position, { x: PHYSICS_CONFIG.WALL_KICK_X, y: PHYSICS_CONFIG.WALL_KICK_Y });
                        } else if (hitRight) {
                            Body.applyForce(ball, ball.position, { x: -PHYSICS_CONFIG.WALL_KICK_X, y: PHYSICS_CONFIG.WALL_KICK_Y });
                        }
                    }

                    // VALID COLLISION LOGIC
                    if (ball && sensor) {
                        // 1. CRITICAL: Check Duplicate Logic
                        if (processedBalls.current.has(ball.id)) {
                            return; // Already processed this ball. IGNORE.
                        }

                        // 2. Mark as processed immediately
                        processedBalls.current.add(ball.id);

                        // 3. Extract Index
                        const binIdx = parseInt(sensor.label.split('-')[1]);

                        // 4. Trigger Game Logic (Use Ref to get latest state)
                        if (onBallLandedRef.current) {
                            onBallLandedRef.current(binIdx, ball.label === 'fireball');
                        }

                        // --- FIREBALL IMPACT EFFECT ---
                        if (ball.label === 'fireball') {
                            // 1. Heavy Vibrate
                            if (vibrationLevelRef.current > 0 && navigator.vibrate) {
                                navigator.vibrate([100 * vibrationLevelRef.current, 50 * vibrationLevelRef.current, 100 * vibrationLevelRef.current]); // Scaled vibration
                            }
                            // 2. Trigger Shake
                            setShake(true);
                            setTimeout(() => setShake(false), 500); // Reset after anim
                        }

                        // 5. DELAYED REMOVAL (Let user see it land)
                        setTimeout(() => {
                            if (engineRef.current) Composite.remove(engineRef.current.world, ball);
                        }, 1000);
                    } else if (ball && isFloor) {
                        // FEEDBACK: Play sound/haptics on floor hit (ONCE)
                        if (!ball.hasHitFloor) {
                            // FIREBALL IS SILENT
                            if (playHitRef.current && ball.label !== 'fireball') {
                                playHitRef.current();
                            }
                            if (vibrationLevelRef.current > 0 && navigator.vibrate) navigator.vibrate(10 * vibrationLevelRef.current);
                            ball.hasHitFloor = true;
                        }

                        // GUARANTEE: Even if the ball hit the floor without triggering sensor,
                        // resolve turn based on current x position so phase never freezes in RESOLVE.
                        if (!processedBalls.current.has(ball.id)) {
                            processedBalls.current.add(ball.id);
                            const canvasW = renderRef.current?.options?.width || sceneRef.current?.clientWidth || width || 360;
                            const fallbackBinIdx = computeFloorFallbackBin(ball.position.x, canvasW);
                            if (onBallLandedRef.current) {
                                onBallLandedRef.current(fallbackBinIdx, ball.label === 'fireball');
                            }
                            setTimeout(() => {
                                if (engineRef.current) Composite.remove(engineRef.current.world, ball);
                            }, 800);
                        }
                    }

                });
            });

            // --- ADVANCED PARTICLE SYSTEM FOR FIREBALLS (COMET) ---
            const particles = [];

            // Helper to add particles
            const emitParticles = (x, y) => {
                // 1. Core Fire (Intense, Fast)
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: x + (Math.random() - 0.5) * 10,
                        y: y + (Math.random() - 0.5) * 10,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() * -3) - 1, // Upward bias relative to ball (which falls down, effectively trail stays behind)
                        life: 1.0,
                        decay: 0.05 + Math.random() * 0.05,
                        size: 6 + Math.random() * 6,
                        color: '255, 100, 0', // OrangeBase
                        type: 'core'
                    });
                }

                // 2. Sparks (Wide spread, long life)
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: x,
                        y: y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 1.0,
                        decay: 0.02 + Math.random() * 0.02,
                        size: 2 + Math.random() * 2,
                        color: '255, 255, 0', // Yellow
                        type: 'spark'
                    });
                }

                // 3. Smoke (Rising, Dark)
                if (Math.random() > 0.5) {
                    particles.push({
                        x: x + (Math.random() - 0.5) * 20,
                        y: y,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -2 - Math.random(), // Floats up
                        life: 1.0,
                        decay: 0.015,
                        size: 10 + Math.random() * 10,
                        color: '50, 50, 50', // Gray
                        type: 'smoke'
                    });
                }
            };

            Events.on(render, 'afterRender', () => {
                const ctx = render.context;
                const bodies = Composite.allBodies(engine.world);

                // 1. EMIT from active fireballs
                bodies.forEach(body => {
                    if (body.label === 'fireball') {
                        emitParticles(body.position.x, body.position.y);

                        // Draw Glowing Head
                        const x = body.position.x;
                        const y = body.position.y;

                        // Intense Core Glow
                        const gradient = ctx.createRadialGradient(x, y, 5, x, y, 40);
                        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                        gradient.addColorStop(0.2, 'rgba(255, 200, 0, 0.8)');
                        gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.4)');
                        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

                        ctx.globalCompositeOperation = 'screen'; // Additive blending for glow
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(x, y, 45, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over'; // Reset
                    }
                });

                // 2. DRAW LIT PEGS (Visual Feedback)
                const now = Date.now();
                const GLOW_DURATION = 350; // slightly longer fade

                litPegs.current.forEach((data, id) => {
                    const elapsed = now - data.time;
                    if (elapsed > GLOW_DURATION) {
                        litPegs.current.delete(id);
                        return;
                    }

                    // Ease out cubic for smoother fade
                    const t = elapsed / GLOW_DURATION;
                    const alpha = 1 - t; // Linear fade is fine for subtle effects

                    // Draw Glow - Soft & Subtle
                    // Using 'source-over' instead of 'screen' for less "burning" white intensity
                    ctx.globalCompositeOperation = 'source-over';

                    ctx.beginPath();
                    // Match peg size roughly (approx 12-15px depending on screen)
                    // We just add a small rim
                    ctx.arc(data.x, data.y, 16, 0, 2 * Math.PI);

                    // Softer Gold/Orange, low opacity
                    ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.5})`;
                    ctx.fill();

                    // No inner white core - keeps it flat and subtle
                });

                // 2. UPDATE & DRAW Particles
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= p.decay;

                    if (p.life <= 0) {
                        particles.splice(i, 1);
                        continue;
                    }

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);

                    // Dynamic colors based on life/type
                    if (p.type === 'core') {
                        // Fade from Yellow to Red
                        const red = 255;
                        const green = Math.floor(255 * p.life); // 255 -> 0
                        const blue = 0;
                        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${p.life})`;
                    } else if (p.type === 'spark') {
                        ctx.fillStyle = `rgba(255, 255, 200, ${p.life})`;
                    } else if (p.type === 'smoke') {
                        ctx.fillStyle = `rgba(50, 50, 50, ${p.life * 0.5})`;
                    }

                    ctx.fill();
                }
            });

            const runner = Runner.create();
            runnerRef.current = runner;
            Runner.run(runner, engine);
            Render.run(render);

        }, 100); // 100ms delay for layout stability

        // Handle screen resize & orientation change dynamically
        let resizeTimer = null;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (!sceneRef.current || !renderRef.current || !engineRef.current) return;
                const newWidth = sceneRef.current.clientWidth;
                const newHeight = sceneRef.current.clientHeight;
                if (newWidth <= 0 || newHeight <= 0) return;
                const render = renderRef.current;
                resizeWorld(engineRef.current, render.options.width, render.options.height,
                    newWidth, newHeight, getImageRef.current);
                // Apply render and physical dimensions in the same callback.
                Render.setSize(render, newWidth, newHeight);
                Render.setPixelRatio(render, window.devicePixelRatio || 1);
                litPegs.current.clear();
            }, 100);
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Cleanup
        const balls = processedBalls.current;
        return () => {
            clearTimeout(timer);
            clearTimeout(resizeTimer);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (runnerRef.current) {
                Runner.stop(runnerRef.current);
                runnerRef.current = null;
            }
            if (renderRef.current) {
                Render.stop(renderRef.current);
                if (renderRef.current.canvas) renderRef.current.canvas.remove();
            }
            if (engineRef.current) Engine.clear(engineRef.current);
            balls.clear();
        };
    }, []);

    return (
        <div ref={sceneRef} className={`w-full h-full relative ${shake ? 'animate-shake-heavy' : ''}`} />
    );
});

export default GameCanvas;
