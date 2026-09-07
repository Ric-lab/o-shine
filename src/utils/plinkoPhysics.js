import Matter from 'matter-js';

const { Bodies, Body, Composite } = Matter;

// ============================================================================
// PHYSICS_CONFIG — tune the gameplay feel here. All ratios scale with screen.
// ============================================================================
export const PHYSICS_CONFIG = {
    // --- Ball ---
    BALL_RADIUS_RATIO: 0.027,       // % of canvas width
    BALL_RESTITUTION: 0.75,         // bounciness on collision (0-1)
    BALL_FRICTION: 0.005,
    BALL_FRICTION_AIR: 0.01,
    BALL_DENSITY: 1.5,              // heavier mass = more momentum
    BALL_INITIAL_X_CHAOS: 3,        // max abs horizontal velocity at drop (prevents straight fall)

    // --- Pegs ---
    PEG_RADIUS_RATIO: 0.021,        // large pegs (even rows)
    PEG_RADIUS_SMALL_RATIO: 0.013,  // small pegs (odd rows, interleaved)
    PEG_RESTITUTION_LARGE: 0.9,     // bouncy but loses energy
    PEG_RESTITUTION_SMALL: 1.0,     // perfect bounce
    PEG_ACTIVE_FORCE: 0.05,         // extra kick on hit (creates "relevant" direction change)
    PEG_STEER_NUDGE: 0.006,         // subtle progressive horizontal bias vector towards target buckets
    PEG_COLS: 7,                    // horizontal density

    // --- Rows are computed dynamically — target this row-gap relative to ball ---
    PEG_ROW_GAP_RATIO: 2.4,         // target vertical gap = this × ball diameter
    PEG_ROWS_MIN: 10,               // short screens
    PEG_ROWS_MAX: 16,               // tall screens

    // --- Walls ---
    WALL_RESTITUTION: 1.3,          // bouncy edges
    WALL_KICK_X: 0.15,              // active push inward when ball touches wall
    WALL_KICK_Y: -0.05,             // slight upward lift on wall hit

    // --- World ---
    GRAVITY_Y: 1.2,
};

/**
 * Computes which bin index (0-4) corresponds to a given horizontal ball position.
 * Clamps result safely between 0 and 4.
 */
export function computeFloorFallbackBin(ballX, canvasWidth = 360) {
    const binW = canvasWidth / 5;
    return Math.max(0, Math.min(4, Math.floor(ballX / binW)));
}

/** Resize the world and keep falling balls inside the new playable area. */
export function resizeWorld(engine, oldWidth, oldHeight, width, height, getImage) {
    if (!engine?.world || oldWidth <= 0 || oldHeight <= 0 || width <= 0 || height <= 0) return;
    const scaleX = width / oldWidth;
    const scaleY = height / oldHeight;
    for (const ball of Composite.allBodies(engine.world)) {
        if (ball.label !== 'player-ball' && ball.label !== 'fireball') continue;
        const x = ball.position.x * scaleX;
        const y = ball.position.y * scaleY;
        const velocity = { x: ball.velocity.x * scaleX, y: ball.velocity.y * scaleY };
        Body.scale(ball, scaleX, scaleX);
        if (ball.render.sprite) {
            ball.render.sprite.xScale *= scaleX;
            ball.render.sprite.yScale *= scaleX;
        }
        const radius = ball.circleRadius;
        Body.setPosition(ball, {
            x: Math.max(radius + 1, Math.min(width - radius - 1, x)),
            // Keep the ball above the sensor even if it passed the old floor
            // during the resize debounce. Collision resolution still owns scoring.
            y: Math.min(y, height - 20 - radius - 6),
        });
        Body.setVelocity(ball, velocity);
    }
    buildStaticWorld(engine, width, height, getImage);
}

/**
 * Rebuilds all static elements (walls, floor, pegs, funnels, sensors)
 * aligned with the current dimensions (width and height).
 * Removes any existing static bodies so resize won't leave ghost obstacles or misaligned sensors.
 */
export function buildStaticWorld(engine, width, height, getImage = (img) => img) {
    if (!engine || !engine.world || width <= 0 || height <= 0) return;

    // 1. Remove all old static bodies (walls, pegs, funnels, sensors, floor)
    const existingStatic = Composite.allBodies(engine.world).filter(b => b.isStatic);
    if (existingStatic.length > 0) {
        Composite.remove(engine.world, existingStatic);
    }

    const bodiesToAdd = [];

    // 2. Walls (Edges of the screen) & Floor
    const wallThick = 60;
    bodiesToAdd.push(
        Bodies.rectangle(-wallThick / 2, height / 2, wallThick, height * 2, {
            isStatic: true,
            label: 'wall-left',
            friction: 0,
            restitution: PHYSICS_CONFIG.WALL_RESTITUTION
        }),
        Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 2, {
            isStatic: true,
            label: 'wall-right',
            friction: 0,
            restitution: PHYSICS_CONFIG.WALL_RESTITUTION
        }),
        Bodies.rectangle(width / 2, height + 25, width, 50, {
            isStatic: true,
            label: 'floor'
        })
    );

    // 3. Pegs Grid (dynamically sized & positioned)
    const pegRadius = width * PHYSICS_CONFIG.PEG_RADIUS_RATIO;
    const pegRadiusSmall = width * PHYSICS_CONFIG.PEG_RADIUS_SMALL_RATIO;
    const startY = 25;
    const endY = height - 100;
    const ballDiameter = width * PHYSICS_CONFIG.BALL_RADIUS_RATIO * 2;
    const targetGapY = ballDiameter * PHYSICS_CONFIG.PEG_ROW_GAP_RATIO;
    const computedRows = Math.floor((endY - startY) / targetGapY) + 1;
    const rows = Math.max(PHYSICS_CONFIG.PEG_ROWS_MIN, Math.min(PHYSICS_CONFIG.PEG_ROWS_MAX, computedRows));
    const gapY = (endY - startY) / (rows - 1);

    const PEG_COLS = PHYSICS_CONFIG.PEG_COLS;
    const pegSpacing = width / PEG_COLS;

    for (let r = 0; r < rows; r++) {
        const isEven = (r % 2 === 0);
        if (isEven) {
            for (let c = 0; c <= PEG_COLS; c++) {
                const px = c * pegSpacing;
                bodiesToAdd.push(Bodies.circle(px, startY + (r * gapY), pegRadius, {
                    isStatic: true,
                    render: {
                        sprite: {
                            texture: getImage('peg.png'),
                            xScale: (pegRadius * 2) / 64,
                            yScale: (pegRadius * 2) / 64
                        }
                    },
                    restitution: PHYSICS_CONFIG.PEG_RESTITUTION_LARGE,
                    label: 'peg'
                }));
            }
        } else {
            for (let c = 0; c < PEG_COLS; c++) {
                const px = (c * pegSpacing) + (pegSpacing / 2);
                bodiesToAdd.push(Bodies.circle(px, startY + (r * gapY), pegRadiusSmall, {
                    isStatic: true,
                    render: {
                        sprite: {
                            texture: getImage('peg.png'),
                            xScale: (pegRadiusSmall * 2) / 64,
                            yScale: (pegRadiusSmall * 2) / 64
                        }
                    },
                    restitution: PHYSICS_CONFIG.PEG_RESTITUTION_SMALL,
                    label: 'peg'
                }));
            }
        }
    }

    // 4. Physical Separators & Sensors (5 columns)
    const TOTAL_BINS = 5;
    const binW = width / TOTAL_BINS;
    const funnelHeight = 90;

    const internalOptions = {
        isStatic: true,
        friction: 0,
        frictionStatic: 0,
        render: {
            sprite: {
                texture: getImage('triangle.png'),
                xScale: 40 / 80,
                yScale: 90 / 180
            }
        },
        label: 'funnel-internal',
        restitution: 0.5
    };

    for (let i = 0; i < TOTAL_BINS; i++) {
        const x = i * binW;
        bodiesToAdd.push(Bodies.trapezoid(x, height - 20, 40, funnelHeight, 0.8, internalOptions));
        if (i === 4) {
            bodiesToAdd.push(Bodies.trapezoid(x + binW, height - 20, 40, funnelHeight, 0.8, internalOptions));
        }

        const pipeX = x + binW / 2;
        const sensorHeight = 10;
        const sensorY = height - 20;

        const sensor = Bodies.rectangle(pipeX, sensorY, binW + 2, sensorHeight, {
            isStatic: true,
            isSensor: true,
            label: `bin-${i}`,
            render: {
                visible: false,
                fillStyle: 'red'
            }
        });
        bodiesToAdd.push(sensor);
    }

    Composite.add(engine.world, bodiesToAdd);
}
