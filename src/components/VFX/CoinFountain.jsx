import { useEffect, useRef } from 'react';
import { vfxBus } from '../../services/vfxBus.js';
import { playCoinTinkle } from '../../utils/audioJuice.js';

/**
 * 60 FPS Canvas Particle Fountain for 3D Flying Coins.
 * Spawns 3D tumbling coins in an explosive arc that magnetically fly in Bézier curves
 * to the Header coin counter, playing pentatonic Web Audio dings upon arrival.
 */
export default function CoinFountain() {
    const canvasRef = useRef(null);
    const coinsRef = useRef([]);
    const sparksRef = useRef([]);
    const animRef = useRef(null);
    const spriteSheetRef = useRef(null);
    const masterCoinRef = useRef(null);
    const noteCounterRef = useRef(0);

    // Preload spritesheet and fallback coin
    useEffect(() => {
        const sheet = new Image();
        sheet.src = '/Images/Immutable/coin_spin_sheet.png';
        sheet.onload = () => {
            spriteSheetRef.current = sheet;
        };

        const master = new Image();
        master.src = '/Images/Immutable/Coin.png';
        master.onload = () => {
            masterCoinRef.current = master;
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Handle high DPI display
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const spawnFountain = ({
            origin = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            count = 14,
            targetSelector = '#header-coin-badge'
        }) => {
            // Find target position on screen
            let targetX = 60;
            let targetY = 25;
            const targetEl = document.querySelector(targetSelector);
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
            }

            const now = performance.now();
            const newCoins = [];

            for (let i = 0; i < count; i++) {
                // Burst outwards and upwards
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5; // -135 to -45 deg
                const speed = 7 + Math.random() * 8;
                const burstDuration = 18 + Math.floor(Math.random() * 14); // frames in burst

                newCoins.push({
                    x: origin.x + (Math.random() - 0.5) * 20,
                    y: origin.y + (Math.random() - 0.5) * 20,
                    startX: origin.x,
                    startY: origin.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    targetX,
                    targetY,
                    // Bézier control points for the flight arc
                    cp1X: origin.x + (Math.random() - 0.5) * 160,
                    cp1Y: origin.y - 120 - Math.random() * 100,
                    cp2X: targetX + (Math.random() - 0.5) * 100,
                    cp2Y: targetY + 120 + Math.random() * 80,
                    state: 'BURST', // 'BURST' -> 'HOMING'
                    frameTimer: 0,
                    burstDuration,
                    homingProgress: 0,
                    homingDuration: 22 + Math.floor(Math.random() * 10), // frames to travel
                    spinFrame: Math.floor(Math.random() * 16),
                    spinSpeed: 0.35 + Math.random() * 0.3,
                    scale: 0.8 + Math.random() * 0.3,
                    spawnTime: now + i * 28 // Staggered spawn for juicy stream
                });
            }

            coinsRef.current.push(...newCoins);

            if (!animRef.current) {
                animRef.current = requestAnimationFrame(renderLoop);
            }
        };

        const renderLoop = (timestamp) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            ctx.clearRect(0, 0, width, height);

            const coins = coinsRef.current;
            const sparks = sparksRef.current;

            // 1. Update and draw coins
            for (let i = coins.length - 1; i >= 0; i--) {
                const coin = coins[i];

                if (timestamp < coin.spawnTime) {
                    continue; // Wait for staggered launch
                }

                coin.spinFrame = (coin.spinFrame + coin.spinSpeed) % 16;

                if (coin.state === 'BURST') {
                    coin.x += coin.vx;
                    coin.y += coin.vy;
                    coin.vy += 0.35; // Gravity
                    coin.vx *= 0.96; // Air resistance
                    coin.frameTimer++;

                    if (coin.frameTimer >= coin.burstDuration) {
                        coin.state = 'HOMING';
                        coin.burstStartX = coin.x;
                        coin.burstStartY = coin.y;
                    }
                } else if (coin.state === 'HOMING') {
                    coin.homingProgress += 1 / coin.homingDuration;
                    const t = Math.min(1, coin.homingProgress);

                    // Cubic Bézier calculation
                    const u = 1 - t;
                    const tt = t * t;
                    const uu = u * u;
                    const uuu = uu * u;
                    const ttt = tt * t;

                    coin.x = uuu * coin.burstStartX + 3 * uu * t * coin.cp1X + 3 * u * tt * coin.cp2X + ttt * coin.targetX;
                    coin.y = uuu * coin.burstStartY + 3 * uu * t * coin.cp1Y + 3 * u * tt * coin.cp2Y + ttt * coin.targetY;

                    if (t >= 1) {
                        // Reached target!
                        // 1. Trigger Pentatonic Sound
                        playCoinTinkle(noteCounterRef.current++);
                        // 2. Spawn golden starburst sparkles
                        for (let s = 0; s < 7; s++) {
                            const sparkAngle = (s / 7) * 2 * Math.PI + Math.random() * 0.5;
                            const sparkSpeed = 2.5 + Math.random() * 4;
                            sparks.push({
                                x: coin.targetX,
                                y: coin.targetY,
                                vx: Math.cos(sparkAngle) * sparkSpeed,
                                vy: Math.sin(sparkAngle) * sparkSpeed,
                                life: 1.0,
                                decay: 0.05 + Math.random() * 0.04,
                                size: 2.5 + Math.random() * 2.5,
                                color: s % 2 === 0 ? '#FBBF24' : '#FFFBEB'
                            });
                        }
                        // 3. Notify that a coin landed
                        vfxBus.notifyCoinLanded();
                        coins.splice(i, 1);
                        continue;
                    }
                }

                // Render Coin Sprite
                const coinRadius = 16 * coin.scale;
                const sheet = spriteSheetRef.current;
                const master = masterCoinRef.current;

                if (sheet && sheet.complete && sheet.naturalWidth > 0) {
                    const currentFrame = Math.floor(coin.spinFrame) % 16;
                    const col = currentFrame % 4;
                    const row = Math.floor(currentFrame / 4);
                    const frameSize = 256;

                    ctx.save();
                    ctx.translate(coin.x, coin.y);
                    ctx.drawImage(
                        sheet,
                        col * frameSize,
                        row * frameSize,
                        frameSize,
                        frameSize,
                        -coinRadius,
                        -coinRadius,
                        coinRadius * 2,
                        coinRadius * 2
                    );
                    ctx.restore();
                } else if (master && master.complete) {
                    ctx.save();
                    ctx.translate(coin.x, coin.y);
                    ctx.drawImage(master, -coinRadius, -coinRadius, coinRadius * 2, coinRadius * 2);
                    ctx.restore();
                } else {
                    // Procedural golden coin fallback
                    ctx.save();
                    ctx.translate(coin.x, coin.y);
                    ctx.fillStyle = '#F59E0B';
                    ctx.beginPath();
                    ctx.arc(0, 0, coinRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#FEF3C7';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // 2. Update and draw sparks
            for (let j = sparks.length - 1; j >= 0; j--) {
                const spark = sparks[j];
                spark.x += spark.vx;
                spark.y += spark.vy;
                spark.life -= spark.decay;

                if (spark.life <= 0) {
                    sparks.splice(j, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = Math.max(0, spark.life);
                ctx.fillStyle = spark.color;
                ctx.beginPath();
                ctx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Keep loop alive if there are active particles
            if (coins.length > 0 || sparks.length > 0) {
                animRef.current = requestAnimationFrame(renderLoop);
            } else {
                animRef.current = null;
                ctx.clearRect(0, 0, width, height);
            }
        };

        const unsubscribe = vfxBus.on('coin-fountain', spawnFountain);

        return () => {
            unsubscribe();
            window.removeEventListener('resize', resizeCanvas);
            if (animRef.current) {
                cancelAnimationFrame(animRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50 w-full h-full"
            style={{ touchAction: 'none' }}
        />
    );
}
