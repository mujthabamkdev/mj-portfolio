import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Test the same dependency-free TypeScript module used by the canvas, without
// requiring a browser or adding a second test/build framework.
const source = await readFile(new URL('../src/lib/penaltyPhysics.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const { createShot, readSwipe, advanceShot, integrateBall, classifyGoalLine, planKeeper, keeperPosition, keeperMotion, keeperLanding, netDisplacement, PITCH } =
    await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

function swipe(x, y, bend = 0) {
    return Array.from({ length: 21 }, (_, i) => {
        const t = i / 20;
        return { x: 350 + (x - 350) * t + Math.sin(Math.PI * t) * bend, y: 375 + (y - 375) * t };
    });
}

function finish(shot, keeper, dt = 1 / 60) {
    for (let i = 0; !shot.outcome && i < 4 / dt; i++) advanceShot(shot, dt, keeper);
    assert(shot.outcome, 'A shot must resolve, even when underpowered');
    return shot;
}

function seededRandom(seed) {
    return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
}

test('rejects taps, downward gestures, and tiny swipes', () => {
    assert.equal(createShot([{ x: 350, y: 375 }]), null);
    assert.equal(createShot(swipe(350, 410)), null);
    assert.equal(createShot(swipe(350, 360)), null);
});

test('straight diagonals have no spin, even with uneven pointer sampling', () => {
    const path = [0, 0.02, 0.07, 0.25, 0.8, 1].map(t => ({ x: 350 + 200 * t, y: 375 - 215 * t }));
    assert.equal(readSwipe(path).spin, 0);
    assert.equal(readSwipe(swipe(550, 160)).spin, 0);
});

test('a well-placed shot can score; aiming is not clamped to the goal', () => {
    assert.equal(finish(createShot(swipe(550, 160))).outcome, 'goal');
    for (const x of [-150, 850]) {
        assert.equal(readSwipe(swipe(x, 140)).targetX, x);
        const shot = finish(createShot(swipe(x, 140)));
        assert.equal(shot.outcome, 'wide');
        assert(Math.abs(shot.ball.x) > PITCH.goalWidth / 2);
        const previousY = shot.ball.y;
        advanceShot(shot, 0.4);
        assert(shot.ball.y > previousY, 'Misses must continue out, not rebound as if hitting an invisible net');
        assert(shot.ball.vy > 0);
    }
});

test('high shots leave over the bar; frame contacts are geometrically bounded', () => {
    assert.equal(finish(createShot(swipe(350, -100))).outcome, 'over');
    assert.equal(finish(createShot(swipe(80, 160))).outcome, 'post');
    assert.equal(finish(createShot(swipe(350, 60))).outcome, 'bar');
    assert.equal(classifyGoalLine(8, PITCH.goalHeight), 'wide', 'A wide shot at bar height must not hit a phantom crossbar');
    assert.equal(classifyGoalLine(0, 3.5), 'over');
    assert.equal(classifyGoalLine(3.66, 1), 'post');
    assert.equal(classifyGoalLine(0, 2.44), 'bar');
});

test('the whole ball must fit inside the goal opening', () => {
    assert.equal(classifyGoalLine(3.6, 1), 'post');
    assert.equal(classifyGoalLine(0, 2.4), 'bar');
    assert.equal(classifyGoalLine(3.35, 2.15), 'goal');
});

test('spin changes the final placement and excessive curve can miss', () => {
    const straight = finish(createShot(swipe(550, 160)));
    const curved = finish(createShot(swipe(550, 160, 80)));
    assert(curved.ball.x > straight.ball.x + 0.5);
    assert.equal(finish(createShot(swipe(600, 160, 100))).outcome, 'wide');
    const left = finish(createShot(swipe(150, 160, -80)));
    assert(Math.abs(left.ball.x + curved.ball.x) < 0.001, 'Mirrored kicks should have mirrored trajectories');
});

test('gravity, aerodynamic drag, spin decay, and ground restitution apply', () => {
    const ball = { x: 0, y: 0, z: 2, vx: 0, vy: 20, vz: 0, spin: 20, elapsed: 0 };
    integrateBall(ball, 1 / 120);
    assert(ball.vz < 0);
    assert(ball.vy < 20);
    assert(ball.spin < 20);
    assert(ball.vx > 0);
    Object.assign(ball, { z: 0.111, vz: -5, vx: 3, vy: 10 });
    integrateBall(ball, 1 / 120);
    assert.equal(ball.z, PITCH.ballRadius);
    assert(ball.vz > 0 && ball.vz < 5);
    assert(ball.vy < 10);
});

test('keeper has reaction time and finite reach, not a guaranteed save', () => {
    const shot = createShot(swipe(550, 160));
    const plan = planKeeper(shot, 0, seededRandom(7));
    assert.equal(keeperPosition(plan, 0).x, 0);
    assert.equal(keeperPosition(plan, plan.reaction).progress, 0);
    assert(Math.abs(plan.targetX) <= 3.25);
    assert(plan.duration >= 0.22);
});

test('ordinary and curved shots can both be saved or score across seeded matches', () => {
    for (const bend of [0, 80]) {
        const random = seededRandom(47);
        let saves = 0;
        let goals = 0;
        for (let i = 0; i < 300; i++) {
            const shot = createShot(swipe(350, 170, bend));
            finish(shot, planKeeper(shot, 0, random));
            saves += Number(shot.outcome === 'save');
            goals += Number(shot.outcome === 'goal');
        }
        assert(saves > 150, 'Casual central shots should usually be stopped');
        assert(goals > 20 && goals < 150, 'A curve must be neither a guaranteed goal nor impossible to score');
    }
});

test('physics outcomes are stable at 30, 60, and 144 fps', () => {
    for (const [x, y, bend] of [[550, 160, 0], [600, 160, 100], [350, -100, 0], [80, 160, 0]]) {
        const outcomes = [30, 60, 144].map(fps => finish(createShot(swipe(x, y, bend)), undefined, 1 / fps).outcome);
        assert.equal(new Set(outcomes).size, 1);
    }
    for (const bend of [0, 80]) {
        const keeper = planKeeper(createShot(swipe(350, 170, bend)), 0, seededRandom(9));
        const outcomes = [30, 60, 144].map(fps => finish(createShot(swipe(350, 170, bend)), keeper, 1 / fps).outcome);
        assert.equal(new Set(outcomes).size, 1, 'Keeper collisions must not depend on the display refresh rate');
    }
});

test('resolved shots cannot award another outcome during their rebound', () => {
    const shot = finish(createShot(swipe(80, 160)));
    const resolvedAt = shot.resolvedAt;
    advanceShot(shot, 1);
    assert.equal(shot.outcome, 'post');
    assert.equal(shot.resolvedAt, resolvedAt);
    assert(shot.ball.vy < 0);
});

test('scored balls stay inside every net boundary and settle instead of rolling out', () => {
    for (const [x, y, bend] of [[350, 170, 0], [550, 160, 80], [150, 160, -80], [350, 75, 0]]) {
        const shot = finish(createShot(swipe(x, y, bend)));
        assert.equal(shot.outcome, 'goal');
        for (let i = 0; i < 5 * 120; i++) {
            advanceShot(shot, 1 / 120);
            const b = shot.ball;
            assert(Math.abs(b.x) <= PITCH.goalWidth / 2 - PITCH.ballRadius + 1e-8);
            assert(b.y >= PITCH.distance + PITCH.ballRadius - 1e-8);
            assert(b.y <= PITCH.distance + PITCH.netDepth - PITCH.ballRadius + 1e-8);
            assert(b.z >= PITCH.ballRadius && b.z <= PITCH.goalHeight - PITCH.ballRadius + 1e-8);
        }
        assert(shot.netImpacts.some(i => i.surface === 'back'), 'A goal should strike the back net');
        assert(Math.hypot(shot.ball.vx, shot.ball.vy, shot.ball.vz) < 0.01);
        assert.equal(shot.outcome, 'goal');
    }
});

test('side and roof netting contain high-energy ricochets too', () => {
    const shot = finish(createShot(swipe(350, 170)));
    Object.assign(shot.ball, { vx: 18, vy: 20, vz: 22 });
    advanceShot(shot, 1);
    assert(shot.netImpacts.some(i => i.surface === 'right'));
    assert(shot.netImpacts.some(i => i.surface === 'roof'));
    assert(Math.abs(shot.ball.x) <= PITCH.goalWidth / 2 - PITCH.ballRadius);
    assert(shot.ball.z <= PITCH.goalHeight - PITCH.ballRadius);
});

test('net impulses come from net contact, scale with speed, propagate, and decay', () => {
    const shot = finish(createShot(swipe(350, 170)));
    assert.equal(shot.netImpacts.length, 0, 'Crossing the goal line is not yet a net impact');
    advanceShot(shot, 0.2);
    assert(shot.netImpacts.length > 0);
    const hit = shot.netImpacts[0];
    assert(netDisplacement(hit, hit, hit.time) > 0);
    assert(netDisplacement({ ...hit, speed: 8 }, hit, hit.time) < netDisplacement(hit, hit, hit.time));
    assert.equal(netDisplacement(hit, { ...hit, x: hit.x + 3 }, hit.time + 0.1), 0);
    assert.equal(netDisplacement(hit, hit, hit.time + 2.1), 0);
    const miss = finish(createShot(swipe(850, 140)));
    advanceShot(miss, 2);
    assert.equal(miss.netImpacts.length, 0, 'Off-target shots must not hit an invisible net');
});

function gloveContact(speed, miss = 0, spin = 0) {
    const keeper = { startX: 0, startZ: 0.9, targetX: 0, targetZ: 1, reaction: 0.1, duration: 0.3 };
    const hands = keeperPosition(keeper, 0.4);
    const shot = createShot(swipe(350, 170));
    Object.assign(shot.ball, { x: hands.x + miss, y: PITCH.keeperPlane - 0.02, z: hands.z, vx: 0, vy: speed, vz: 0, spin, elapsed: 0.4 });
    advanceShot(shot, 1 / 120, keeper);
    return { shot, keeper };
}

test('clean low-speed saves are caught, while hard/glancing/spinning shots are parried', () => {
    const soft = gloveContact(14).shot;
    const hard = gloveContact(32).shot;
    const glancing = gloveContact(14, 0.33).shot;
    const spinning = gloveContact(14, 0, 22).shot;
    for (const shot of [soft, hard, glancing, spinning]) assert.equal(shot.outcome, 'save');
    assert.equal(soft.saveContact.kind, 'catch');
    assert.equal(soft.ball.vy, 0);
    for (const shot of [hard, glancing, spinning]) {
        assert.equal(shot.saveContact.kind, 'parry');
        assert(shot.ball.vy < 0);
    }
    const medium = gloveContact(25).shot;
    assert(Math.abs(hard.ball.vy) > Math.abs(medium.ball.vy), 'Hard strikes must produce stronger parries');
});

test('a caught ball follows the gloves through the tuck, fall, landing, and recovery', () => {
    const { shot, keeper } = gloveContact(14);
    const resolvedAt = shot.resolvedAt;
    const seen = new Set();
    for (let i = 0; i < 240; i++) {
        advanceShot(shot, 1 / 120, keeper);
        const pose = keeperMotion(keeper, shot.ball.elapsed, shot.saveContact);
        seen.add(pose.stage);
        assert(Math.hypot(shot.ball.x - pose.handX, shot.ball.z - pose.handZ) < 0.03);
        assert.equal(shot.outcome, 'save');
        assert.equal(shot.resolvedAt, resolvedAt);
        assert(shot.ball.z >= PITCH.ballRadius);
    }
    assert(seen.has('land') && seen.has('recover') && seen.has('ready'));
    assert(keeperMotion(keeper, shot.ball.elapsed, shot.saveContact).grip > 0.99);
});

test('keeper jumps follow gravity, land continuously, and recover without snapping upright', () => {
    const keeper = { startX: 0, startZ: 0.9, targetX: 2.2, targetZ: 2.3, reaction: 0.12, duration: 0.4 };
    const a = keeperMotion(keeper, 0.32);
    const b = keeperMotion(keeper, 0.34);
    const c = keeperMotion(keeper, 0.36);
    assert(Math.abs((c.z - 2 * b.z + a.z) / 0.02 ** 2 + 9.81) < 1e-7);
    const land = keeperLanding(keeper);
    const before = keeperMotion(keeper, land.time - 0.00001);
    const after = keeperMotion(keeper, land.time + 0.00001);
    assert.equal(before.stage, 'air');
    assert.equal(after.stage, 'land');
    assert(Math.hypot(before.x - after.x, before.z - after.z) < 0.001);
    assert(Math.abs(before.angle - after.angle) < 0.001);
    const recovery = keeperMotion(keeper, land.time + 0.75);
    assert.equal(recovery.stage, 'recover');
    assert(Math.abs(recovery.angle) > 0.1 && Math.abs(recovery.angle) < Math.abs(after.angle));
    const ready = keeperMotion(keeper, land.time + 1.3);
    assert.equal(ready.stage, 'ready');
    assert.equal(ready.angle, 0);
    assert.equal(ready.z, 0.98);
});
