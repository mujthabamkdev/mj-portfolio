import { netDisplacement, PITCH, projectBall, type KeeperFrame, type NetImpact, type Shot } from './penaltyPhysics';

type Point3 = { x: number; y: number; z: number };
interface NetFace {
    surface: NetImpact['surface'];
    columns: number;
    rows: number;
    point: (u: number, v: number) => Point3;
}
const half = PITCH.goalWidth / 2;
const back = PITCH.distance + PITCH.netDepth;
const faces: NetFace[] = [
    { surface: 'left', columns: 4, rows: 10, point: (u, v) => ({ x: -half, y: PITCH.distance + u * PITCH.netDepth, z: v * PITCH.goalHeight }) },
    { surface: 'right', columns: 4, rows: 10, point: (u, v) => ({ x: half, y: PITCH.distance + u * PITCH.netDepth, z: v * PITCH.goalHeight }) },
    { surface: 'roof', columns: 20, rows: 4, point: (u, v) => ({ x: (u - 0.5) * PITCH.goalWidth, y: PITCH.distance + v * PITCH.netDepth, z: PITCH.goalHeight }) },
    { surface: 'back', columns: 20, rows: 10, point: (u, v) => ({ x: (u - 0.5) * PITCH.goalWidth, y: back, z: v * PITCH.goalHeight }) },
];

export function drawGoalNet(ctx: CanvasRenderingContext2D, shot: Shot | null) {
    const time = shot?.ball.elapsed ?? 0;
    const impacts = shot?.netImpacts ?? [];
    ctx.save();
    for (const face of faces) {
        const point = (u: number, v: number) => {
            const world = face.point(u, v);
            const pin = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
            let wave = 0;
            for (const impact of impacts) {
                if (impact.surface === face.surface) wave += netDisplacement(impact, world, time) * pin;
            }
            if (face.surface === 'back') {
                world.y += wave;
                world.z += wave * 0.12;
                world.x += wave * 0.1 * (u - 0.5);
            } else if (face.surface === 'roof') world.z += wave;
            else world.x += wave * (face.surface === 'left' ? -1 : 1);
            return projectBall(world);
        };
        ctx.beginPath();
        for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
            const p = point(u, v);
            if (u === 0 && v === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = face.surface === 'back' ? 'rgba(5,12,18,0.2)' : 'rgba(235,240,255,0.025)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(235,240,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = impacts.some(i => i.surface === face.surface && time - i.time < 0.8)
            ? 'rgba(235,240,255,0.34)' : 'rgba(235,240,255,0.17)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let col = 1; col < face.columns; col++) {
            for (let row = 0; row <= face.rows * 3; row++) {
                const p = point(col / face.columns, row / (face.rows * 3));
                if (row === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
        }
        for (let row = 1; row < face.rows; row++) {
            for (let col = 0; col <= face.columns * 3; col++) {
                const p = point(col / (face.columns * 3), row / face.rows);
                if (col === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
        }
        ctx.stroke();
    }
    ctx.restore();
}

interface Point2 { x: number; y: number }

/** Two-bone limb: bending elbows/knees instead of rotating a rigid sprite. */
function jointBetween(start: Point2, end: Point2, length: number, bend: number): Point2 {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const sag = Math.sqrt(Math.max(0, length * length - distance * distance / 4));
    return { x: (start.x + end.x) / 2 - dy / distance * sag * bend, y: (start.y + end.y) / 2 + dx / distance * sag * bend };
}

export function drawKeeper(ctx: CanvasRenderingContext2D, frame: KeeperFrame) {
    const center = projectBall({ x: frame.x, y: PITCH.keeperPlane, z: frame.z });
    const ground = projectBall({ x: frame.x, y: PITCH.keeperPlane, z: 0 });
    const scale = ground.y - projectBall({ x: frame.x, y: PITCH.keeperPlane, z: 1 }).y;
    const cos = Math.cos(frame.angle);
    const sin = Math.sin(frame.angle);
    const localPoint = (worldX: number, worldZ: number): Point2 => {
        const p = projectBall({ x: worldX, y: PITCH.keeperPlane, z: worldZ });
        const dx = (p.x - center.x) / scale;
        const dy = (p.y - center.y) / scale;
        return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
    };
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.12, 0.32 - (frame.z - 0.5) * 0.1)})`;
    ctx.beginPath();
    ctx.ellipse(ground.x, ground.y + 2, 24 + Math.abs(sin) * 24, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (frame.landingImpact > 0.04) {
        ctx.fillStyle = `rgba(182,191,130,${frame.landingImpact * 0.18})`;
        ctx.beginPath();
        ctx.ellipse(ground.x, ground.y, 30 + (1 - frame.landingImpact) * 30, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.translate(center.x, center.y);
    ctx.rotate(frame.angle);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const limb = (points: Point2[], color: string, width: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
    };

    // Feet can trail in the air, but never penetrate the turf on landing.
    for (const side of [-1, 1]) {
        const hip = { x: side * 0.1, y: 0.2 };
        const footLocal = { x: side * (0.13 + frame.kneeBend * 0.12), y: 0.94 - frame.kneeBend * 0.22 };
        const footX = frame.x + footLocal.x * cos - footLocal.y * sin;
        const footZ = Math.max(0.05, frame.z - footLocal.x * sin - footLocal.y * cos);
        const foot = localPoint(footX, footZ);
        const knee = jointBetween(hip, foot, 0.4, -side);
        limb([hip, knee], '#111827', 0.12);
        limb([knee, foot], '#fca5a5', 0.095);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(foot.x - 0.07, foot.y - 0.035, 0.17, 0.095, 0.03);
        ctx.fill();
    }

    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.roundRect(-0.18, -0.24, 0.36, 0.47, 0.065);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 0.13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MJ', 0, -0.04);

    for (const side of [-1, 1]) {
        const shoulder = { x: side * 0.16, y: -0.18 };
        const spread = side * frame.handSpread;
        const hand = localPoint(frame.handX + spread * cos, frame.handZ - spread * sin);
        const elbow = jointBetween(shoulder, hand, 0.35, -side);
        limb([shoulder, elbow, hand], '#fca5a5', 0.09);
        ctx.save();
        ctx.translate(hand.x, hand.y);
        ctx.rotate(Math.atan2(hand.y - elbow.y, hand.x - elbow.x) - Math.PI / 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(-0.075, -0.09, 0.15, 0.18, 0.05);
        ctx.fill();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 0.025;
        ctx.beginPath(); ctx.moveTo(-0.06, 0.05); ctx.lineTo(0.06, 0.05); ctx.stroke();
        ctx.restore();
    }

    // The head follows the torso, with a small counter-rotation during a leap.
    ctx.save();
    ctx.translate(0, -0.41);
    ctx.rotate(-frame.angle * 0.15 * (1 - frame.grip));
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath(); ctx.arc(0, 0, 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.arc(0, -0.035, 0.17, Math.PI * 1.1, Math.PI * -0.1); ctx.fill();
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 0.027;
    ctx.beginPath(); ctx.arc(-0.06, -0.01, 0.046, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0.06, -0.01, 0.046, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.014, -0.01); ctx.lineTo(0.014, -0.01); ctx.stroke();
    ctx.restore();
    ctx.restore();
}
