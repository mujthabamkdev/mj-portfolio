import { useRef, useState, useEffect } from 'react';

const CW = 700;
const CH = 420;
const GX = 80;
const GY = 60;
const GW = 540;
const GH = 200;

const BALL_START_X = CW / 2;
const BALL_START_Y = CH - 45;
const BALL_R = 14;

const TOTAL_ROUNDS = 5;
const KEEPER_HOME_X = GX + GW / 2;
const KEEPER_HOME_Y = GY + GH;

type Phase = 'idle' | 'aiming' | 'shooting' | 'result' | 'done';
type KeeperPose = 'idle' | 'crouch' | 'dive' | 'catch' | 'concede';
type Outcome = '' | 'goal' | 'save' | 'bar' | 'post' | 'over' | 'wide';

interface Flight {
    sx: number; // start x
    sy: number; // start y
    tx: number; // target x
    ty: number; // target y
    dur: number; // duration in sim ms
    arc: number; // arc height px
    curve: number; // lateral bend px
    dir: 'shot' | 'parry' | 'deflect';
    t: number; // elapsed sim ms
}

const MJ_GOAL_CONCEDED = [
    "Clean strike — my net doesn't agree with physics.",
    "Nothing in the multiverse I could reach on that one!",
    "That bend was criminal. Calling the refs!",
    "Fine. One to you. Don't get comfortable.",
];

const MJ_SAVED = [
    "Golden gloves! My zone, my ball!",
    "Read that like a git diff!",
    "HUGE save — I saw in my logs you'd go there!",
    "Not today. MJ keeps his sheets clean.",
];

const MJ_WIDE = [
    "Your aim is on another call, maybe?",
    "That's a throw-in, not a shot!",
    "The crowd behind the goal appreciated that anyway.",
];

const MJ_OVER = [
    "Over the bar! Were you aiming for the moon?",
    "Top bins... of the STAND! Into the crowd!",
];

const MJ_BAR = [
    "Crossbar! Millimetres! I heard it ring.",
];

const MJ_POST = [
    "Off the post! That clang was personal.",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const PenaltyGame = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState({ player: 0, mj: 0 });
    const [round, setRound] = useState(0);
    const [message, setMessage] = useState('Drag from the ball and release to shoot. Curve your swipe to bend it!');
    const [phase, setPhase] = useState<Phase>('idle');

    const state = useRef({
        phase: 'idle' as Phase,

        // Ball
        ballX: BALL_START_X,
        ballY: BALL_START_Y,
        ballScale: 1,
        ballRotation: 0,
        trail: [] as { x: number; y: number; scale: number }[],

        // Aiming
        swipePath: [] as { x: number; y: number }[],
        aimTargetX: 0,
        aimTargetY: 0,

        // Keeper
        keeperX: KEEPER_HOME_X,
        keeperY: KEEPER_HOME_Y,
        keeperPose: 'idle' as KeeperPose,
        keeperTargetX: KEEPER_HOME_X,
        keeperTargetY: KEEPER_HOME_Y,
        keeperDiveStart: 0,
        keeperDiveDur: 480,

        // Flight simulation
        flight: null as Flight | null,
        outcome: '' as Outcome,

        // FX
        netRippleStart: 0,
        shakeStart: 0,
        flashStart: 0,

        // Ticking
        simTime: 0,
        lastRealTime: 0,
        shootRealStart: 0,

        // Crowd
        crowd: [] as { x: number; y: number; c: string; speed: number; offset: number; size: number }[],
    });

    const onShotComplete = useRef((_goal: boolean, _kind: string) => {
        void _goal; void _kind;
    });

    useEffect(() => {
        onShotComplete.current = (goal, kind) => {
            setPhase('result');

            let msg = '';
            if (goal) msg = '⚽ GOAL! ' + pick(MJ_GOAL_CONCEDED);
            else if (kind === 'save') msg = '🧤 SAVE! ' + pick(MJ_SAVED);
            else if (kind === 'bar') msg = '🔔 ' + pick(MJ_BAR);
            else if (kind === 'post') msg = pick(MJ_POST);
            else if (kind === 'over') msg = '🚀 ' + pick(MJ_OVER);
            else msg = '❌ ' + pick(MJ_WIDE);

            setMessage(`MJ: "${msg}"`);

            setScore(prev => ({
                player: goal ? prev.player + 1 : prev.player,
                mj: goal ? prev.mj : prev.mj + 1,
            }));

            setRound(prev => {
                const next = prev + 1;
                setTimeout(() => {
                    if (next >= TOTAL_ROUNDS) {
                        setPhase('done');
                        state.current.phase = 'done';
                        setMessage('⏱️ Full time! Verify the scoreboard — beat MJ for bragging rights.');
                    } else {
                        setPhase('idle');
                        state.current.phase = 'idle';
                        setMessage(`Round ${next + 1}/${TOTAL_ROUNDS} — jump takes your shot! Drag from ball, curve to bend.`);
                    }
                }, 2600);
                return next;
            });
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animId: number;

        // Crowd (built once per mount)
        if (state.current.crowd.length === 0) {
            state.current.crowd = Array.from({ length: 450 }, () => ({
                x: Math.random() * CW,
                y: Math.random() * (GY + 30),
                c: ['#7c5cff', '#3b82f6', '#f59e0b', '#10b981', '#f472b6', '#cbd5e1', '#0ea5e9'][Math.floor(Math.random() * 7)],
                speed: 0.002 + Math.random() * 0.008,
                offset: Math.random() * Math.PI * 2,
                size: 1.5 + Math.random() * 2.5,
            }));
        }

        const draw = (timestamp: number) => {
            const s = state.current;
            if (s.lastRealTime === 0) s.lastRealTime = timestamp;
            const deltaReal = Math.min(timestamp - s.lastRealTime, 50);
            s.lastRealTime = timestamp;

            const isShooting = s.phase === 'shooting';
            const timeScale = isShooting || s.phase === 'result' ? 0.55 : 1.0;
            s.simTime += deltaReal * timeScale;
            const simTime = s.simTime;

            if (s.phase === 'shooting' || (s.phase === 'result' && s.flight)) {
                const f = s.flight;
                if (f) {
                    const wasP = f.t / f.dur;
                    const t0 = f.t + deltaReal * timeScale;
                    f.t = Math.min(t0, f.dur);
                    const p = f.t / f.dur;

                    s.ballX = f.sx + (f.tx - f.sx) * p + Math.sin(Math.PI * p) * (s.flight?.curve ?? 0);
                    s.ballY = f.sy + (f.ty - f.sy) * p - Math.sin(Math.PI * p) * f.arc;
                    s.ballScale = Math.max(0.7, 1 - 0.32 * p);
                    s.ballRotation += 0.1 + (1 - p) * 0.06;
                    if (wasP < 1) { // don't trail after landing
                        s.trail.push({ x: s.ballX, y: s.ballY, scale: s.ballScale });
                        if (s.trail.length > 14) s.trail.shift();
                    }

                    // Keeper dive animation
                    const diveElapsed = simTime - s.keeperDiveStart;
                    if (diveElapsed > 0) {
                        const diveP = Math.min(diveElapsed / Math.max(s.keeperDiveDur, 1), 1);
                        const diveEase = 1 - Math.pow(1 - diveP, 3);
                        s.keeperX = KEEPER_HOME_X + (s.keeperTargetX - KEEPER_HOME_X) * diveEase;
                        s.keeperY = KEEPER_HOME_Y + (s.keeperTargetY - KEEPER_HOME_Y) * diveEase;
                        if (s.keeperPose !== 'catch') s.keeperPose = diveP > 0.12 ? 'dive' : 'crouch';
                    } else {
                        s.keeperPose = 'crouch';
                    }

                    // Real-time save collision (only on the shot toward the goal)
                    if (p < 0.94 && !s.outcome && f.dir === 'shot') {
                        const handX = s.keeperX;
                        const handY = s.keeperY - 80;
                        const dist = Math.hypot(s.ballX - handX, s.ballY - handY);
                        const hardShot = f.dur < 520;
                        const reach = (hardShot ? 40 : 54) + BALL_R;
                        if (dist < reach) {
                            s.keeperPose = 'catch';
                            s.outcome = 'save';
                            // parry: new flight away from goal
                            s.flight = {
                                sx: s.ballX, sy: s.ballY,
                                tx: s.ballX + (s.ballX - KEEPER_HOME_X) * 0.4 + (Math.random() - 0.5) * 90,
                                ty: s.ballY + 180 + Math.random() * 80,
                                dur: 420, arc: 25, curve: 0, dir: 'parry', t: 0,
                            } as Flight;
                            setTimeout(() => { onShotComplete.current(false, 'save'); }, 520);
                        }
                    }

                    // Flight complete: resolve or deflect
                    if (p >= 1 && !s.outcome && f.dir === 'shot') {
                        const insideGoal = s.ballX > GX + 8 && s.ballX < GX + GW - 8 && s.ballY > GY + 8 && s.ballY < GY + GH;
                        if (insideGoal) {
                            s.keeperPose = 'concede';
                            s.outcome = 'goal';
                            s.netRippleStart = simTime;
                            s.shakeStart = simTime;
                            s.flashStart = timestamp;
                            s.flight = null; // ball rests in net
                            setTimeout(() => { onShotComplete.current(true, 'goal'); }, 700);
                        } else {
                            const nearBar = s.ballY > GY - 40 && s.ballY < GY + 18;
                            const nearLeftPost = Math.abs(s.ballX - (GX + 6)) < 30 && s.ballY > GY + 10;
                            const nearRightPost = Math.abs(s.ballX - (GX + GW - 6)) < 30 && s.ballY > GY + 10;
                            if (nearBar) {
                                s.flight = {
                                    sx: s.ballX, sy: s.ballY,
                                    tx: s.ballX + (Math.random() - 0.5) * 120,
                                    ty: s.ballY + 260,
                                    dur: 420, arc: 20, curve: 0, dir: 'deflect', t: 0,
                                } as Flight;
                                s.outcome = 'bar'; 
                                setTimeout(() => { onShotComplete.current(false, 'bar'); }, 480);
                            } else if (nearLeftPost || nearRightPost) {
                                const side = nearLeftPost ? -1 : 1;
                                s.flight = {
                                    sx: s.ballX, sy: s.ballY,
                                    tx: s.ballX + side * 200,
                                    ty: s.ballY + 160,
                                    dur: 400, arc: 15, curve: 0, dir: 'deflect', t: 0,
                                } as Flight;
                                s.outcome = 'post';
                                setTimeout(() => { onShotComplete.current(false, 'post'); }, 460);
                            } else {
                                s.flight = {
                                    sx: s.ballX, sy: s.ballY,
                                    tx: s.ballX + (s.ballX - KEEPER_HOME_X) * 0.25,
                                    ty: s.ballY + 220,
                                    dur: 380, arc: 12, curve: 0, dir: 'deflect', t: 0,
                                } as Flight;
                                s.outcome = s.ballY < GY ? 'over' : 'wide';
                                setTimeout(() => { onShotComplete.current(false, s.outcome); }, 320);
                            }
                        }
                    }
                }

            } else if (s.phase === 'idle' || s.phase === 'aiming') {
                const pace = Math.sin(simTime * 0.002) * 46;
                s.keeperX = KEEPER_HOME_X + pace;
                s.keeperY = KEEPER_HOME_Y;
                s.keeperPose = s.phase === 'aiming' ? 'crouch' : 'idle';
                s.ballX = BALL_START_X;
                s.ballY = BALL_START_Y;
                s.ballScale = 1;
                s.ballRotation = 0;
                if (s.trail.length) s.trail.length = 0;
            }

            // ── Screen shake on goal ──
            ctx.save();
            const shakeAge = simTime - s.shakeStart;
            if (shakeAge > 0 && shakeAge < 400) {
                const mag = (1 - shakeAge / 400) * 7;
                ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
            }

            // ── Sky + crowd ──
            const skyGrad = ctx.createLinearGradient(0, 0, 0, GY + 30);
            skyGrad.addColorStop(0, '#131a2e');
            skyGrad.addColorStop(1, '#1c2340');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(-10, 0, CW + 20, GY + 30);

            const flashAge = timestamp - s.flashStart;
            if (flashAge > 0 && flashAge < 180) {
                ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - flashAge / 180)})`;
                ctx.fillRect(0, 0, CW, GY + 30);
            }

            const isExcited = s.phase === 'shooting' || s.phase === 'result';
            s.crowd.forEach(pt => {
                const jumpMult = isExcited ? 10 : 3;
                const jumpOffset = isExcited ? 0.01 : 0;
                const jumpY = Math.abs(Math.sin(simTime * (pt.speed + jumpOffset) * (isExcited ? 3 : 1) + pt.offset)) * jumpMult;
                ctx.fillStyle = pt.c;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y - jumpY, pt.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // ── Pitch ──
            const grassGrad = ctx.createLinearGradient(0, GY + 30, 0, CH);
            grassGrad.addColorStop(0, '#0b4a12');
            grassGrad.addColorStop(1, '#042207');
            ctx.fillStyle = grassGrad;
            ctx.fillRect(0, GY + 30, CW, CH - (GY + 30));

            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.moveTo(CW / 2 - 100, GY + 30);
            ctx.lineTo(CW / 2 + 100, GY + 30);
            ctx.lineTo(CW / 2 + 350, CH);
            ctx.lineTo(CW / 2 - 350, CH);
            ctx.fill();

            // Penalty spot
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.beginPath(); ctx.arc(BALL_START_X, BALL_START_Y + 28, 4, 0, Math.PI * 2); ctx.fill();

            // ── Net (ripples on goal) ──
            const rippleAge = simTime - s.netRippleStart;
            const ripple = rippleAge > 0 && rippleAge < 900
                ? Math.sin(rippleAge * 0.02) * (1 - rippleAge / 900) * 6 : 0;

            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1.5;
            for (let x = GX + 40; x <= GX + GW - 40; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, GY + 40);
                if (x > s.ballX - 80 && x < s.ballX + 80 && ripple > 0) {
                    for (let y = GY + 40; y <= GY + GH; y += 15) {
                        const depth = (y - (GY + 40)) / (GH - 40);
                        ctx.lineTo(x + ripple * Math.sin(depth * Math.PI), y);
                    }
                } else {
                    ctx.lineTo(x, GY + GH);
                }
                ctx.stroke();
            }
            for (let y = GY + 40; y <= GY + GH; y += 30) {
                ctx.beginPath();
                ctx.moveTo(GX + 40, y);
                ctx.lineTo(GX + GW - 40, y);
                ctx.stroke();
            }

            // ── Posts ──
            const topBarGrad = ctx.createLinearGradient(0, GY - 4, 0, GY + 10);
            topBarGrad.addColorStop(0, '#ffffff');
            topBarGrad.addColorStop(0.5, '#d1d5db');
            topBarGrad.addColorStop(1, '#9ca3af');
            ctx.fillStyle = topBarGrad;
            ctx.beginPath(); ctx.roundRect(GX - 6, GY - 4, GW + 12, 14, 4); ctx.fill();

            const leftPostGrad = ctx.createLinearGradient(GX - 4, 0, GX + 8, 0);
            leftPostGrad.addColorStop(0, '#ffffff');
            leftPostGrad.addColorStop(0.5, '#d1d5db');
            leftPostGrad.addColorStop(1, '#9ca3af');
            ctx.fillStyle = leftPostGrad;
            ctx.beginPath(); ctx.roundRect(GX - 4, GY - 4, 12, GH + 8, 4); ctx.fill();

            const rightPostGrad = ctx.createLinearGradient(GX + GW - 8, 0, GX + GW + 4, 0);
            rightPostGrad.addColorStop(0, '#ffffff');
            rightPostGrad.addColorStop(0.5, '#d1d5db');
            rightPostGrad.addColorStop(1, '#9ca3af');
            ctx.fillStyle = rightPostGrad;
            ctx.beginPath(); ctx.roundRect(GX + GW - 8, GY - 4, 12, GH + 8, 4); ctx.fill();

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(GX - 30, GY + GH + 2); ctx.lineTo(GX + GW + 30, GY + GH + 2); ctx.stroke();

            // ── MJ the keeper ──
            drawKeeper(ctx, s, simTime);

            // ── Aim reticle ──
            if (s.phase === 'aiming' && s.swipePath.length >= 2 && (s.aimTargetX || s.aimTargetY)) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,0.55)';
                ctx.setLineDash([6, 6]);
                ctx.lineWidth = 2;
                ctx.beginPath();
                const aid = 13;
                ctx.arc(s.aimTargetX, s.aimTargetY, aid, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(s.aimTargetX - 20, s.aimTargetY); ctx.lineTo(s.aimTargetX - 6, s.aimTargetY);
                ctx.moveTo(s.aimTargetX + 6, s.aimTargetY); ctx.lineTo(s.aimTargetX + 20, s.aimTargetY);
                ctx.moveTo(s.aimTargetX, s.aimTargetY - 20); ctx.lineTo(s.aimTargetX, s.aimTargetY - 6);
                ctx.moveTo(s.aimTargetX, s.aimTargetY + 6); ctx.lineTo(s.aimTargetX, s.aimTargetY + 20);
                ctx.stroke();
                ctx.restore();
            }

            // ── Swipe trail + power meter ──
            drawAimingUI(ctx, s);

            // ── Ball trail ──
            s.trail.forEach((tp, i) => {
                const alpha = (i / Math.max(s.trail.length, 1)) * 0.5;
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.beginPath();
                ctx.arc(tp.x, tp.y, BALL_R * tp.scale * (0.45 + (i / Math.max(s.trail.length, 1)) * 0.5), 0, Math.PI * 2);
                ctx.fill();
            });

            // ── Ball shadow + ball ──
            const bR = BALL_R * s.ballScale;
            const distFromGround = Math.max(0, BALL_START_Y - s.ballY);
            const shadowOpacity = Math.max(0.1, 0.45 - distFromGround / 900);
            ctx.fillStyle = `rgba(0,0,0,${shadowOpacity})`;
            ctx.beginPath();
            ctx.ellipse(s.ballX, Math.min(BALL_START_Y + 24, s.ballY + 26), bR * 1.1, bR * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.translate(s.ballX, s.ballY);
            ctx.rotate(s.ballRotation);
            const ballGrad = ctx.createRadialGradient(-bR * 0.3, -bR * 0.3, bR * 0.2, 0, 0, bR);
            ballGrad.addColorStop(0, '#ffffff');
            ballGrad.addColorStop(1, '#a3a3a3');
            ctx.fillStyle = ballGrad;
            ctx.beginPath(); ctx.arc(0, 0, bR, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#171717';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const d2 = bR * 0.35;
                if (i === 0) ctx.moveTo(Math.cos(a) * d2, Math.sin(a) * d2);
                else ctx.lineTo(Math.cos(a) * d2, Math.sin(a) * d2);
            }
            ctx.closePath(); ctx.fill();

            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5 - Math.PI / 2 + Math.PI / 5;
                const dCenter = bR * 0.85;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * dCenter, Math.sin(a) * dCenter, bR * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#171717';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a - Math.PI / 5) * bR * 0.35, Math.sin(a - Math.PI / 5) * bR * 0.35);
                ctx.lineTo(Math.cos(a) * dCenter * 0.7, Math.sin(a) * dCenter * 0.7);
                ctx.stroke();
            }

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5 * s.ballScale;
            ctx.beginPath(); ctx.arc(0, 0, bR, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // ── Cinematic bars ──
            if (isShooting || s.phase === 'result') {
                const shootElapsedReal = timestamp - s.shootRealStart;
                const barHeight = Math.min(32, shootElapsedReal * 0.12);
                if (barHeight > 0) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, CW, barHeight);
                    ctx.fillRect(0, CH - barHeight, CW, barHeight);
                }
                if (isShooting) {
                    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.75, shootElapsedReal * 0.002)})`;
                    ctx.font = 'italic bold 20px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('⚽ SURGE', CW - 20, CH - barHeight - 14);
                }
            }

            ctx.restore();
            animId = requestAnimationFrame(draw);
        };

        const drawKeeper = (ctx: CanvasRenderingContext2D, s: typeof state.current, simTime: number) => {
            const gx = s.keeperX;
            const gy = s.keeperY;
            const pose = s.keeperPose;

            const mjPurple = '#7c3aed';
            const mjDark = '#111827';
            const skin = '#fca5a5';
            const boots = '#fbbf24';

            ctx.save();
            ctx.translate(gx, gy);

            if (pose === 'dive' || pose === 'catch' || pose === 'concede') {
                if (pose !== 'concede') {
                    const divingRight = s.keeperTargetX > KEEPER_HOME_X;
                    const angle = divingRight ? 1.15 : -1.15;
                    ctx.rotate(angle);
                    ctx.translate(0, -6);

                    // torso
                    ctx.fillStyle = mjPurple;
                    ctx.fillRect(-15, -60, 30, 45);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('MJ', 0, -38);

                    // arms up
                    ctx.lineWidth = 8; ctx.lineCap = 'round';
                    ctx.strokeStyle = skin;
                    ctx.beginPath(); ctx.moveTo(-10, -55); ctx.lineTo(-14, -93); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(10, -55); ctx.lineTo(14, -93); ctx.stroke();
                    ctx.fillStyle = '#e2e8f0';
                    ctx.beginPath(); ctx.arc(-14, -93, 7, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(14, -93, 7, 0, Math.PI * 2); ctx.fill();

                    // legs split
                    ctx.strokeStyle = mjDark; ctx.lineWidth = 10;
                    ctx.beginPath(); ctx.moveTo(-8, -15); ctx.lineTo(-16, 2); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(8, -15); ctx.lineTo(16, 6); ctx.stroke();
                    ctx.strokeStyle = skin; ctx.lineWidth = 8;
                    ctx.beginPath(); ctx.moveTo(-16, 2); ctx.lineTo(-17, 20); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(16, 6); ctx.lineTo(18, 26); ctx.stroke();

                    ctx.fillStyle = boots;
                    ctx.beginPath(); ctx.roundRect(-22, 20, 11, 8, 3); ctx.fill();
                    ctx.beginPath(); ctx.roundRect(12, 26, 11, 8, 3); ctx.fill();
                } else {
                    // concede: standing slump, arms down, head bob
                    const slump = Math.sin(simTime * 0.006) * 2;
                    ctx.translate(0, slump);

                    ctx.fillStyle = mjPurple;
                    ctx.fillRect(-16, -65, 32, 40);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('MJ', 0, -46);

                    ctx.lineWidth = 10; ctx.lineCap = 'round';
                    ctx.strokeStyle = skin;
                    ctx.beginPath(); ctx.moveTo(-16, -58); ctx.lineTo(-26, -40); ctx.lineTo(-28, -14); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(16, -58); ctx.lineTo(26, -40); ctx.lineTo(28, -14); ctx.stroke();
                    ctx.fillStyle = '#e2e8f0';
                    ctx.beginPath(); ctx.arc(-28, -14, 8, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(28, -14, 8, 0, Math.PI * 2); ctx.fill();

                    ctx.strokeStyle = mjDark; ctx.lineWidth = 14;
                    ctx.beginPath(); ctx.moveTo(-10, -25); ctx.lineTo(-14, 0); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(10, -25); ctx.lineTo(14, 0); ctx.stroke();
                    ctx.strokeStyle = skin; ctx.lineWidth = 10;
                    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, 20); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(14, 20); ctx.stroke();

                    ctx.fillStyle = boots;
                    ctx.beginPath(); ctx.roundRect(-19, 20, 10, 8, 3); ctx.fill();
                    ctx.beginPath(); ctx.roundRect(9, 20, 10, 8, 3); ctx.fill();

                    ctx.fillStyle = skin;
                    ctx.beginPath(); ctx.arc(0, -80, 16, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = mjDark;
                    ctx.beginPath(); ctx.arc(0, -84, 16, Math.PI * 1.1, Math.PI * -0.1); ctx.fill();
                    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
                    ctx.beginPath(); ctx.arc(-6, -81, 4.4, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(6, -81, 4.4, 0, Math.PI * 2); ctx.stroke();
                }

                if (pose === 'catch') {
                    // ball held in gloves
                    ctx.save();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(0, -40, 13, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                }
            } else {
                const isCrouch = pose === 'crouch';
                const bounce = pose === 'idle' ? Math.abs(Math.sin(simTime * 0.005)) * 5 : 1;
                ctx.translate(0, -bounce - (isCrouch ? 8 : 0));

                ctx.fillStyle = mjPurple;
                ctx.fillRect(-16, isCrouch ? -58 : -65, 32, isCrouch ? 33 : 40);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('MJ', 0, isCrouch ? -40 : -46);

                ctx.lineWidth = 10; ctx.lineCap = 'round';
                ctx.strokeStyle = skin;
                ctx.beginPath(); ctx.moveTo(-16, -60); ctx.lineTo(-30, -45); ctx.lineTo(-25, -20); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(16, -60); ctx.lineTo(30, -45); ctx.lineTo(25, -20); ctx.stroke();
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath(); ctx.arc(-25, -20, 8, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(25, -20, 8, 0, Math.PI * 2); ctx.fill();

                ctx.strokeStyle = mjDark; ctx.lineWidth = 14;
                ctx.beginPath(); ctx.moveTo(-10, -25); ctx.lineTo(-14, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(10, -25); ctx.lineTo(14, 0); ctx.stroke();
                ctx.strokeStyle = skin; ctx.lineWidth = 10;
                ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, 20); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(14, 20); ctx.stroke();

                ctx.fillStyle = boots;
                ctx.beginPath(); ctx.roundRect(-19, 20, 10, 8, 3); ctx.fill();
                ctx.beginPath(); ctx.roundRect(9, 20, 10, 8, 3); ctx.fill();

                ctx.fillStyle = skin;
                ctx.beginPath(); ctx.arc(0, -80, 16, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = mjDark;
                ctx.beginPath(); ctx.arc(0, -84, 16, Math.PI * 1.1, Math.PI * -0.1); ctx.fill();
                ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.4;
                ctx.beginPath(); ctx.arc(-6, -81, 4.4, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(6, -81, 4.4, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-1.6, -81); ctx.lineTo(1.6, -81); ctx.stroke();
            }
            ctx.restore();
        };

        const drawAimingUI = (ctx: CanvasRenderingContext2D, s: typeof state.current) => {
            if (s.phase !== 'aiming') return;
            const path = s.swipePath;
            if (path.length < 1) return;

            const start = path[0];
            const end = path[path.length - 1];
            const dist = Math.hypot(end.x - start.x, end.y - start.y);
            const powerRatio = Math.min((dist * 1.2) / 350, 1);

            let pColor = '#4ade80';
            if (powerRatio > 0.6) pColor = '#facc15';
            if (powerRatio > 0.9) pColor = '#ef4444';

            const meterWidth = 150;
            const meterX = 20;
            const meterY = CH - 40;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath(); ctx.roundRect(meterX, meterY, meterWidth, 16, 4); ctx.fill();
            const meterGrad = ctx.createLinearGradient(meterX, 0, meterX + meterWidth, 0);
            meterGrad.addColorStop(0, '#4ade80');
            meterGrad.addColorStop(0.65, '#facc15');
            meterGrad.addColorStop(1, '#ef4444');
            ctx.fillStyle = meterGrad;
            ctx.beginPath(); ctx.roundRect(meterX, meterY, meterWidth * powerRatio, 16, 4); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(meterX, meterY, meterWidth, 16, 4); ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('SHOT POWER', meterX, meterY - 6);

            ctx.strokeStyle = pColor;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = pColor;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            for (let i = 0; i < path.length; i++) {
                const pt2 = path[i];
                if (i === 0) ctx.moveTo(pt2.x, pt2.y);
                else ctx.lineTo(pt2.x, pt2.y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        };

        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, []);

    // Keeper AI: chooser at shot release (component scope so pointer handler can call it)
    const planKeeperDive = (targetX: number, targetY: number, curveAmp: number, arc: number, shotDur: number) => {
        const s = state.current;
        const distanceFromCenter = Math.abs(targetX - KEEPER_HOME_X);
        const centred = distanceFromCenter < 90;
        const curveMag = Math.min(1, Math.abs(curveAmp) / 70);
        const hardShot = shotDur < 520;
        const readChance = centred
            ? 0.68 - (hardShot ? 0.08 : 0)
            : 0.52 - curveMag * 0.18 - (hardShot ? 0.08 : 0);
        const guessesRight = Math.random() < readChance;

        // Predict where the ball crosses the save plane (p ≈ 0.72), including
        // curve/arc offsets, so a correct read puts the hands ON the ball.
        const pStar = 0.72;
        const sinP = Math.sin(Math.PI * pStar);
        const interceptX = BALL_START_X + (targetX - BALL_START_X) * pStar + sinP * curveAmp;
        const interceptY = BALL_START_Y + (targetY - BALL_START_Y) * pStar - sinP * arc;

        let diveX: number;
        let diveY: number;
        if (guessesRight) {
            // commits to the ball's path, tiny keeper error
            diveX = interceptX + (Math.random() - 0.5) * 34;
            diveY = interceptY + 80 + (Math.random() - 0.5) * 30; // hands (keeperY-80) meet the ball
        } else {
            const wrongSide = targetX > KEEPER_HOME_X ? -1 : 1;
            const spread = 90 + Math.random() * 140;
            diveX = Math.random() < 0.75
                ? KEEPER_HOME_X + wrongSide * spread
                : KEEPER_HOME_X + (Math.random() - 0.5) * 70;
            diveY = KEEPER_HOME_Y - 15 - Math.random() * 55;
        }
        diveX = Math.max(GX + 30, Math.min(GX + GW - 30, diveX));
        diveY = Math.max(GY + 40, Math.min(KEEPER_HOME_Y, diveY));

        s.keeperTargetX = diveX;
        s.keeperTargetY = diveY;
        // Network reaction delay, then a dive timed to arrive at the save plane
        const reaction = 40 + Math.random() * 60;
        s.keeperDiveStart = s.simTime + reaction;
        s.keeperDiveDur = Math.max(260, pStar * shotDur - reaction);
    };

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const scaleX = CW / rect.width;
        const scaleY = CH / rect.height;
        return { cx: (e.clientX - rect.left) * scaleX, cy: (e.clientY - rect.top) * scaleY };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const s = state.current;
        if (s.phase !== 'idle') return;
        const pos = getPos(e);
        if (!pos) return;

        const dist = Math.hypot(pos.cx - s.ballX, pos.cy - s.ballY);
        if (dist > 60) return;

        e.currentTarget.setPointerCapture(e.pointerId);

        s.phase = 'aiming';
        s.swipePath = [{ x: pos.cx, y: pos.cy }];
        setPhase('aiming');
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const s = state.current;
        if (s.phase !== 'aiming') return;
        const pos = getPos(e);
        if (!pos) return;

        s.swipePath.push({ x: pos.cx, y: pos.cy });
        if (s.swipePath.length > 300) s.swipePath.splice(0, s.swipePath.length - 300);

        // Live aim reticle: project the shot target
        const start = s.swipePath[0];
        const last = s.swipePath[s.swipePath.length - 1];
        const dx = last.x - start.x;
        const dy = last.y - start.y;
        if (dy < -10) {
            let tx = last.x;
            let ty = last.y;
            if (last.y > GY + GH + 20) {
                tx = start.x + dx * 1.7;
                ty = start.y + dy * 1.7;
            }
            s.aimTargetX = Math.max(GX - 40, Math.min(GX + GW + 40, tx));
            s.aimTargetY = Math.max(GY - 45, ty);
        } else {
            s.aimTargetX = 0;
            s.aimTargetY = 0;
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        const s = state.current;
        if (s.phase !== 'aiming') return;

        const path = s.swipePath;
        if (path.length < 2) {
            s.phase = 'idle';
            setPhase('idle');
            return;
        }

        const start = path[0];
        const end = path[path.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        if (dy > -10) {
            s.phase = 'idle';
            setPhase('idle');
            setMessage('Swipe UP from the ball to shoot ⬆️');
            return;
        }

        const dist = Math.hypot(dx, dy);
        const power = Math.min(350, dist * 1.2);
        if (power < 30) {
            s.phase = 'idle';
            setPhase('idle');
            return;
        }

        // Project the target
        let targetX = end.x;
        let targetY = end.y;
        if (end.y > GY + GH + 20) {
            targetX = start.x + dx * 1.7;
            targetY = start.y + dy * 1.7;
        }
        targetY = Math.max(GY - 45, targetY);
        targetX = Math.max(GX - 40, Math.min(GX + GW + 40, targetX));

        // Curve: offset of real path from a straight line
        const midPt = path[Math.floor(path.length / 2)];
        const straightMidX = (start.x + end.x) / 2;
        const curveAmp = (midPt.x - straightMidX) * 2.2;

        // Flight time: fast for power, floaty for finesse
        const shotDur = Math.max(420, Math.min(900, 950 - power));
        const arc = Math.max(30, 110 - power * 0.22);

        state.current.aimTargetX = 0;
        state.current.aimTargetY = 0;

        // Begin the shot
        s.flight = {
            sx: s.ballX,
            sy: s.ballY,
            tx: targetX,
            ty: targetY,
            dur: shotDur,
            arc,
            curve: curveAmp,
            dir: 'shot',
            t: 0,
        };
        s.outcome = '';
        s.trail.length = 0;
        s.keeperPose = 'crouch';
        planKeeperDive(targetX, targetY, curveAmp, arc, shotDur);

        s.phase = 'shooting';
        setPhase('shooting');
        s.shootRealStart = performance.now();
    };

    const resetGame = () => {
        setScore({ player: 0, mj: 0 });
        setRound(0);
        setPhase('idle');
        state.current.phase = 'idle';
        state.current.swipePath = [];
        state.current.flight = null;
        state.current.outcome = '';
        state.current.keeperPose = 'idle';
        setMessage('Drag from the ball and release to shoot. Curve your swipe to bend it!');
    };

    return (
        <div className="w-full relative">
            <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                className="w-full rounded-lg border border-white/10 cursor-crosshair block touch-none shadow-2xl relative z-10"
                style={{ touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />

            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-5 py-2 rounded-full text-white font-mono text-sm tracking-wider shadow border border-white/10 z-20 backdrop-blur-sm">
                YOU <span className={score.player > score.mj ? 'text-green-400 font-bold' : ''}>{score.player}</span>
                {' — '}
                <span className={score.mj > score.player ? 'text-red-400 font-bold' : ''}>{score.mj}</span> MJ
            </div>

            <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-[11px] font-mono text-accent/90">{message}</p>
                <span className="text-[11px] font-mono text-white/50 whitespace-nowrap ml-4">
                    ROUND {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
                </span>
            </div>
            {phase === 'done' && (
                <button onClick={resetGame} className="w-full bg-accent text-white hover:bg-accent/80 transition-colors rounded py-3 mt-4 font-bold tracking-wider text-sm">
                    {score.player > score.mj ? '🏆 YOU BEAT MJ! PLAY AGAIN' : (score.player < score.mj ? '🧤 MJ WALL! TRY AGAIN' : '🤝 DRAW! PLAY AGAIN')}
                </button>
            )}
        </div>
    );
};

export default PenaltyGame;
