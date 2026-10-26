/** Metres and seconds; y runs from the penalty spot towards the goal. */
export const PITCH = {
    distance: 11,
    goalWidth: 7.32,
    goalHeight: 2.44,
    ballRadius: 0.11,
    postRadius: 0.06,
    keeperPlane: 9.7,
    netDepth: 1.6,
} as const;

export const VIEW = { width: 700, height: 420, goalX: 80, goalY: 60, goalWidth: 540, goalHeight: 200, ballX: 350, ballY: 375 } as const;
const GRAVITY = 9.81;
const DRAG = 0.012;
const STEP = 1 / 240;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export type ShotOutcome = 'goal' | 'save' | 'bar' | 'post' | 'over' | 'wide' | 'short';
export interface SwipePoint { x: number; y: number }
export interface BallState {
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    spin: number;
    elapsed: number;
}
export interface Shot {
    ball: BallState;
    power: number;
    outcome: ShotOutcome | null;
    resolvedAt: number | null;
    saveContact: SaveContact | null;
    netImpacts: NetImpact[];
}
export interface SaveContact {
    kind: 'catch' | 'parry';
    time: number;
    speed: number;
    x: number;
    z: number;
    offsetX: number;
    offsetZ: number;
}
export interface NetImpact {
    surface: 'back' | 'left' | 'right' | 'roof';
    x: number; y: number; z: number;
    speed: number;
    time: number;
}
export interface KeeperFrame {
    x: number;
    z: number;
    angle: number;
    handX: number;
    handZ: number;
    handSpread: number;
    kneeBend: number;
    progress: number;
    stage: 'ready' | 'push' | 'air' | 'land' | 'recover';
    landingImpact: number;
    grip: number;
}
export interface KeeperPlan {
    startX: number;
    startZ: number;
    targetX: number;
    targetZ: number;
    reaction: number;
    duration: number;
}

export function projectBall(ball: Pick<BallState, 'x' | 'y' | 'z'>) {
    const depth = ball.y / PITCH.distance;
    const perspective = Math.max(0.5, 1.55 - depth * 0.55);
    const groundY = VIEW.ballY + 14 - depth * (VIEW.ballY + 14 - (VIEW.goalY + VIEW.goalHeight));
    return {
        x: VIEW.ballX + ball.x * (VIEW.goalWidth / PITCH.goalWidth) * perspective,
        y: groundY - ball.z * (VIEW.goalHeight / PITCH.goalHeight) * perspective,
        scale: perspective / 1.55,
        groundY,
    };
}

export function readSwipe(path: SwipePoint[]) {
    if (path.length < 2) return null;
    const start = path[0];
    const end = path[path.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);
    if (dy > -10 || distance < 25) return null;

    // Integrate signed deviation from the chord, weighted by segment length.
    // An unevenly sampled straight diagonal must not accidentally gain spin.
    let area = 0;
    let length = 0;
    for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        const segment = Math.hypot(b.x - a.x, b.y - a.y);
        const midX = (a.x + b.x) / 2 - start.x;
        const midY = (a.y + b.y) / 2 - start.y;
        area += (dx * midY - dy * midX) / distance * segment;
        length += segment;
    }
    const bend = length ? area / length / distance : 0;
    const spin = Math.abs(bend) < 0.008 ? 0 : clamp(bend * 115, -26, 26);
    return {
        targetX: VIEW.ballX + dx,
        targetY: VIEW.ballY + dy,
        power: clamp(distance / 330, 0, 1),
        spin,
    };
}

export function createShot(path: SwipePoint[]): Shot | null {
    const aim = readSwipe(path);
    if (!aim) return null;
    const speed = (15 + aim.power * 17) * (1 - Math.abs(aim.spin) / 26 * 0.12);
    const targetX = (aim.targetX - VIEW.ballX) / (VIEW.goalWidth / PITCH.goalWidth);
    const targetZ = (VIEW.goalY + VIEW.goalHeight - aim.targetY) / (VIEW.goalHeight / PITCH.goalHeight);
    const travelTime = Math.expm1(DRAG * PITCH.distance) / (DRAG * speed);
    return {
        ball: {
            x: 0, y: 0, z: PITCH.ballRadius,
            vx: targetX / PITCH.distance * speed,
            vy: speed,
            vz: (targetZ - PITCH.ballRadius) / travelTime + GRAVITY * travelTime / 2
                + Math.max(0, aim.power - 0.86) * 4,
            spin: aim.spin,
            elapsed: 0,
        },
        power: aim.power,
        outcome: null,
        resolvedAt: null,
        saveContact: null,
        netImpacts: [],
    };
}

export function integrateBall(ball: BallState, dt: number) {
    const speed = Math.hypot(ball.vx, ball.vy, ball.vz);
    const ax = -DRAG * speed * ball.vx + 0.022 * ball.spin * ball.vy;
    const ay = -DRAG * speed * ball.vy - 0.022 * ball.spin * ball.vx;
    ball.vx += ax * dt;
    ball.vy += ay * dt;
    ball.vz += (-GRAVITY - DRAG * speed * ball.vz) * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;
    ball.spin *= Math.exp(-0.45 * dt);
    ball.elapsed += dt;
    if (ball.z < PITCH.ballRadius) {
        ball.z = PITCH.ballRadius;
        if (ball.vz < -0.6) {
            ball.vz *= -0.48;
            ball.vx *= 0.86;
            ball.vy *= 0.86;
        } else {
            ball.vz = 0;
            const friction = Math.exp(-0.8 * dt);
            ball.vx *= friction;
            ball.vy *= friction;
        }
        ball.spin *= Math.exp(-3 * dt);
    }
}

export function classifyGoalLine(x: number, z: number): Exclude<ShotOutcome, 'save' | 'short'> {
    const halfWidth = PITCH.goalWidth / 2;
    const contactRadius = PITCH.ballRadius + PITCH.postRadius;
    if (Math.abs(Math.abs(x) - halfWidth) <= contactRadius && z <= PITCH.goalHeight + contactRadius) return 'post';
    if (Math.abs(z - PITCH.goalHeight) <= contactRadius && Math.abs(x) <= halfWidth + contactRadius) return 'bar';
    if (Math.abs(x) + PITCH.ballRadius < halfWidth && z >= PITCH.ballRadius - 0.001
        && z + PITCH.ballRadius < PITCH.goalHeight) return 'goal';
    return Math.abs(x) > halfWidth ? 'wide' : 'over';
}

export function planKeeper(shot: Shot, startX: number, random = Math.random): KeeperPlan {
    // Read the initial strike, not its eventual endpoint. Late spin can beat
    // a committed dive, but never grants an automatic goal or immunity.
    const prediction = { ...shot.ball, spin: shot.ball.spin * (0.65 + random() * 0.2) };
    while (prediction.y < PITCH.keeperPlane && prediction.elapsed < 2) integrateBall(prediction, STEP);
    const central = Math.abs(prediction.x) < 1.1;
    const readChance = (central ? 0.84 : 0.73)
        - Math.abs(shot.ball.spin) / 26 * 0.06 - Math.max(0, shot.power - 0.8) * 0.15;
    const readsShot = random() < readChance;
    const targetX = readsShot
        ? prediction.x + (random() - 0.5) * 0.38
        : (prediction.x >= 0 ? -1 : 1) * (1.1 + random() * 1.5);
    const targetZ = readsShot ? prediction.z + (random() - 0.5) * 0.24 : 0.65 + random() * 0.8;
    const x = clamp(targetX, -3.25, 3.25);
    const z = clamp(targetZ, 0.25, 2.6);
    const reaction = 0.1 + random() * 0.06;
    return {
        startX, startZ: 0.9,
        targetX: x, targetZ: z,
        reaction,
        duration: Math.max(0.22, prediction.elapsed - reaction, Math.hypot(x - startX, z - 0.9) / 10.5),
    };
}

const smooth = (t: number) => {
    const p = clamp(t, 0, 1);
    return p * p * (3 - 2 * p);
};

function approachHands(plan: KeeperPlan, time: number) {
    const progress = clamp((time - plan.reaction) / plan.duration, 0, 1);
    const eased = smooth(progress);
    return {
        x: plan.startX + (plan.targetX - plan.startX) * eased,
        z: plan.startZ + (plan.targetZ - plan.startZ) * eased,
        progress,
    };
}

function diveParameters(plan: KeeperPlan) {
    const direction = Math.sign(plan.targetX - plan.startX);
    const angle = direction * clamp(Math.abs(plan.targetX - plan.startX) * 0.48, 0, 1.25);
    const floor = 0.26 + 0.4 * Math.cos(angle);
    const targetZ = Math.max(floor + 0.04, plan.targetZ - Math.cos(angle) * 0.56);
    return {
        angle,
        vx: (plan.targetX - Math.sin(angle) * 0.48 - plan.startX) / plan.duration,
        vz: (targetZ - 0.94) / plan.duration + GRAVITY * plan.duration / 2,
    };
}

function flightAngle(plan: KeeperPlan, age: number, angle: number) {
    if (age <= plan.duration) return angle * smooth(age / plan.duration);
    const resting = Math.abs(angle) > 0.25 ? Math.sign(angle) * 1.48 : angle;
    return angle + (resting - angle) * smooth((age - plan.duration) / 0.28);
}

function horizontalFlight(vx: number, duration: number, age: number) {
    if (age <= duration) {
        const p = age / duration;
        return vx * duration * (-1.65 * p ** 3 + 2.65 * p ** 2);
    }
    return vx * duration + vx * 0.35 * (1 - Math.exp(-(age - duration) * 1.2)) / 1.2;
}

function horizontalSpeed(vx: number, duration: number, age: number) {
    if (age <= duration) {
        const p = age / duration;
        return vx * (-4.95 * p ** 2 + 5.3 * p);
    }
    return vx * 0.35 * Math.exp(-(age - duration) * 1.2);
}

/** Solve the ballistic body/ground intersection, including the dive rotation. */
export function keeperLanding(plan: KeeperPlan) {
    const launch = diveParameters(plan);
    let lo = plan.duration;
    let hi = plan.duration + 3;
    for (let i = 0; i < 24; i++) {
        const t = (lo + hi) / 2;
        const angle = flightAngle(plan, t, launch.angle);
        const floor = 0.26 + 0.4 * Math.cos(angle);
        if (0.94 + launch.vz * t - GRAVITY * t * t / 2 > floor) lo = t;
        else hi = t;
    }
    const angle = flightAngle(plan, hi, launch.angle);
    return {
        time: plan.reaction + hi,
        x: plan.startX + horizontalFlight(launch.vx, plan.duration, hi),
        z: 0.26 + 0.4 * Math.cos(angle),
        angle,
        speed: Math.max(0, GRAVITY * hi - launch.vz),
    };
}

export function restingKeeper(x: number, crouch = 0): KeeperFrame {
    return {
        x, z: 0.98 - crouch * 0.04, angle: 0,
        handX: x, handZ: 0.7 + crouch * 0.2,
        handSpread: 0.3, kneeBend: 0.18 + crouch * 0.25,
        progress: 0, stage: 'ready', landingImpact: 0, grip: 0,
    };
}

/** One articulated pose drives both the glove collider and the drawn keeper. */
export function keeperMotion(plan: KeeperPlan, time: number, contact: SaveContact | null = null): KeeperFrame {
    const age = Math.max(0, time - plan.reaction);
    const launch = diveParameters(plan);
    const landing = keeperLanding(plan);
    const hands = approachHands(plan, time);
    const afterLanding = Math.max(0, time - landing.time);
    const recover = smooth((afterLanding - 0.55) / 0.6);
    let x = plan.startX + horizontalFlight(launch.vx, plan.duration, age);
    let z = 0.94 + launch.vz * age - GRAVITY * age * age / 2;
    let angle = flightAngle(plan, age, launch.angle);
    if (time >= landing.time) {
        const slideSpeed = horizontalSpeed(launch.vx, plan.duration, landing.time - plan.reaction) * 0.38;
        x = landing.x + slideSpeed * (1 - Math.exp(-afterLanding * 7)) / 7;
        z = landing.z + Math.max(0, Math.sin(afterLanding * 28)) * Math.min(0.05, landing.speed * 0.008) * Math.exp(-afterLanding * 15);
        z += (0.98 - z) * recover;
        angle = landing.angle * (1 - recover);
    }
    const frame: KeeperFrame = {
        x, z, angle,
        handX: hands.x, handZ: hands.z,
        handSpread: 0.24,
        kneeBend: time >= landing.time ? 0.85 * (1 - recover) + 0.18 : 0.3 + Math.sin(hands.progress * Math.PI) * 0.35,
        progress: hands.progress,
        stage: time < plan.reaction ? 'push' : time < landing.time ? 'air' : afterLanding < 0.55 ? 'land' : recover < 1 ? 'recover' : 'ready',
        landingImpact: time >= landing.time ? Math.min(1, landing.speed / 6) * Math.exp(-afterLanding * 12) : 0,
        grip: 0,
    };

    // Preserve the actual reach during interception. After the leap, the arms
    // follow the falling body rather than leaving the gloves hanging in space.
    if (age > plan.duration || (contact && time >= contact.time)) {
        const anchorTime = contact?.time ?? plan.reaction + plan.duration;
        const anchorAge = Math.max(0, anchorTime - plan.reaction);
        const anchorAngle = flightAngle(plan, anchorAge, launch.angle);
        const anchorX = plan.startX + horizontalFlight(launch.vx, plan.duration, anchorAge);
        const anchorZ = 0.94 + launch.vz * anchorAge - GRAVITY * anchorAge * anchorAge / 2;
        const anchorHands = approachHands(plan, anchorTime);
        const dx = anchorHands.x - anchorX;
        const dz = anchorHands.z - anchorZ;
        let localX = dx * Math.cos(anchorAngle) - dz * Math.sin(anchorAngle);
        let localZ = dx * Math.sin(anchorAngle) + dz * Math.cos(anchorAngle);
        const elapsed = Math.max(0, time - anchorTime);
        const caught = contact?.kind === 'catch';
        const tuck = smooth(elapsed / (caught ? 0.3 : 0.48));
        localX *= 1 - tuck;
        localZ += ((caught ? 0.08 : -0.16) - localZ) * tuck;
        if (contact) localZ -= Math.sin(Math.PI * clamp(elapsed / 0.2, 0, 1)) * Math.min(0.13, contact.speed * 0.005);
        frame.handX = x + localX * Math.cos(angle) + localZ * Math.sin(angle);
        frame.handZ = Math.max(0.16, z - localX * Math.sin(angle) + localZ * Math.cos(angle));
        frame.handSpread = caught ? 0.24 - 0.13 * tuck : 0.24 + 0.06 * tuck;
        frame.grip = caught ? tuck : 0;
    }
    return frame;
}

export function keeperPosition(plan: KeeperPlan, time: number) {
    const frame = keeperMotion(plan, time);
    return { x: frame.handX, z: frame.handZ, progress: frame.progress };
}

function retainInNet(shot: Shot, dt: number) {
    const b = shot.ball;
    const radius = PITCH.ballRadius;
    const side = PITCH.goalWidth / 2 - radius;
    const back = PITCH.distance + PITCH.netDepth - radius;
    const roof = PITCH.goalHeight - radius;
    const impact = (surface: NetImpact['surface'], speed: number) => {
        if (speed < 0.8) return;
        shot.netImpacts.push({ surface, x: b.x, y: b.y, z: b.z, speed, time: b.elapsed });
        if (shot.netImpacts.length > 12) shot.netImpacts.shift();
    };
    if (b.y > back) {
        b.y = back;
        impact('back', Math.abs(b.vy));
        b.vy = -Math.abs(b.vy) * 0.09;
        b.vx *= 0.45;
        b.vz *= 0.55;
    }
    if (Math.abs(b.x) > side) {
        const sign = Math.sign(b.x);
        b.x = sign * side;
        impact(sign > 0 ? 'right' : 'left', Math.abs(b.vx));
        b.vx = -sign * Math.abs(b.vx) * 0.16;
        b.vy *= 0.7;
    }
    if (b.z > roof) {
        b.z = roof;
        impact('roof', Math.abs(b.vz));
        b.vz = -Math.abs(b.vz) * 0.15;
    }
    // Once scored, loose netting and turf absorb the rebound inside the cage.
    if (b.y < PITCH.distance + radius) {
        b.y = PITCH.distance + radius;
        b.vy = Math.abs(b.vy) * 0.05;
    }
    const grounded = b.z <= radius + 0.005;
    const damping = Math.exp(-(grounded ? 9 : 1.5) * dt);
    b.vx *= damping;
    b.vy *= damping;
    b.spin *= Math.exp(-6 * dt);
    if (grounded && Math.hypot(b.vx, b.vy, b.vz) < 0.12) b.vx = b.vy = b.vz = 0;
}

/** A travelling, damped wave; the renderer pins the net's boundary knots. */
export function netDisplacement(impact: NetImpact, point: Pick<BallState, 'x' | 'y' | 'z'>, time: number) {
    const distance = Math.hypot(point.x - impact.x, point.y - impact.y, point.z - impact.z);
    const age = time - impact.time - distance / 11;
    if (age < 0 || age > 2) return 0;
    return Math.min(0.7, impact.speed * 0.026) * Math.exp(-age * 4.5 - distance * 0.75) * Math.cos(age * 19);
}

export function advanceShot(shot: Shot, seconds: number, keeper?: KeeperPlan) {
    let remaining = seconds;
    while (remaining > 1e-8) {
        const dt = Math.min(STEP, remaining);
        remaining -= dt;
        const ball = shot.ball;
        const previous = { ...ball };
        if (shot.saveContact?.kind === 'catch') {
            ball.elapsed += dt;
            if (keeper) {
                const grip = keeperMotion(keeper, ball.elapsed, shot.saveContact);
                const settle = Math.exp(-(ball.elapsed - shot.saveContact.time) * 22);
                ball.x = grip.handX + shot.saveContact.offsetX * settle;
                ball.y = PITCH.keeperPlane;
                ball.z = Math.max(PITCH.ballRadius, grip.handZ + shot.saveContact.offsetZ * settle);
                ball.vx = (ball.x - previous.x) / dt;
                ball.vz = (ball.z - previous.z) / dt;
            }
            ball.vy = 0;
            ball.spin = 0;
            continue;
        }
        integrateBall(ball, dt);

        if (!shot.outcome && keeper && previous.y < PITCH.keeperPlane && ball.y >= PITCH.keeperPlane) {
            const fraction = (PITCH.keeperPlane - previous.y) / (ball.y - previous.y);
            const x = previous.x + (ball.x - previous.x) * fraction;
            const z = previous.z + (ball.z - previous.z) * fraction;
            const hands = keeperPosition(keeper, previous.elapsed + dt * fraction);
            const miss = Math.hypot(x - hands.x, z - hands.z);
            if (miss < 0.34 + PITCH.ballRadius) {
                const speed = Math.hypot(ball.vx, ball.vy, ball.vz);
                const caught = speed < 23 && miss < 0.24 && Math.abs(ball.spin) < 16;
                shot.outcome = 'save';
                shot.saveContact = {
                    kind: caught ? 'catch' : 'parry', time: previous.elapsed + dt * fraction,
                    speed, x, z, offsetX: x - hands.x, offsetZ: z - hands.z,
                };
                if (caught) {
                    ball.x = x;
                    ball.y = PITCH.keeperPlane;
                    ball.z = z;
                    ball.vx = ball.vy = ball.vz = ball.spin = 0;
                } else {
                    ball.vy = -Math.abs(ball.vy) * clamp(0.25 + (speed - 18) * 0.012, 0.25, 0.52);
                    ball.vx = (x - hands.x) * 5 + ball.vx * 0.3;
                    ball.vz = Math.max(1.4, Math.abs(ball.vz) * 0.45);
                    ball.spin *= 0.35;
                }
            }
        }

        const goalPlane = PITCH.distance + PITCH.ballRadius;
        if (!shot.outcome && previous.y < goalPlane && ball.y >= goalPlane) {
            const fraction = (goalPlane - previous.y) / (ball.y - previous.y);
            const x = previous.x + (ball.x - previous.x) * fraction;
            const z = previous.z + (ball.z - previous.z) * fraction;
            shot.outcome = classifyGoalLine(x, z);
            if (shot.outcome === 'post') {
                ball.vx = -ball.vx * 0.6;
                ball.vy = -Math.abs(ball.vy) * 0.48;
            } else if (shot.outcome === 'bar') {
                ball.vz = -Math.abs(ball.vz) * 0.65;
                ball.vy = -Math.abs(ball.vy) * 0.45;
            }
            // Wide/high shots retain their forward momentum and leave play.
        }
        if (!shot.outcome && (ball.elapsed > 3 || (Math.hypot(ball.vx, ball.vy) < 0.8 && ball.z <= PITCH.ballRadius))) {
            shot.outcome = 'short';
        }
        if (shot.outcome && shot.resolvedAt === null) shot.resolvedAt = ball.elapsed;
        if (shot.outcome === 'goal') retainInNet(shot, dt);
    }
    return shot.outcome;
}
