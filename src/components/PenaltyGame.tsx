import { useRef, useState, useEffect } from 'react';
import { advanceShot, createShot, keeperMotion, restingKeeper, planKeeper, projectBall, readSwipe, PITCH, VIEW, type KeeperPlan, type Shot, type ShotOutcome } from '../lib/penaltyPhysics';
import { drawGoalNet, drawKeeper } from '../lib/penaltyRendering';

const { width: CW, height: CH, goalX: GX, goalY: GY, goalWidth: GW, goalHeight: GH } = VIEW;

const BALL_START_X: number = VIEW.ballX;
const BALL_START_Y: number = VIEW.ballY;
const BALL_R = 14;

const TOTAL_ROUNDS = 5;
const KEEPER_HOME_X = GX + GW / 2;

type Phase = 'idle' | 'aiming' | 'shooting' | 'result' | 'done';
type Outcome = '' | ShotOutcome;
const SHOT_HELP = 'Drag up from the ball. Longer swipe = more power; bend gently for spin.';

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
    const [message, setMessage] = useState(SHOT_HELP);
    const [phase, setPhase] = useState<Phase>('idle');

    const state = useRef({
        phase: 'idle' as Phase,

        // Ball
        ballX: BALL_START_X,
        ballY: BALL_START_Y,
        ballScale: 1,
        ballGroundY: BALL_START_Y + 14,
        ballRotation: 0,
        trail: [] as { x: number; y: number; scale: number }[],

        // Aiming
        swipePath: [] as { x: number; y: number }[],
        aimTargetX: 0,
        aimTargetY: 0,

        // Keeper
        keeperX: KEEPER_HOME_X,
        keeperFrame: restingKeeper(0),
        keeperPlan: null as KeeperPlan | null,

        // Flight simulation
        flight: null as Shot | null,
        outcome: '' as Outcome,

        // FX
        shakeStart: -Infinity,
        flashStart: -Infinity,

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
            else if (kind === 'catch') msg = '🧤 CAUGHT! Soft hands — that one stays with me.';
            else if (kind === 'bar') msg = '🔔 ' + pick(MJ_BAR);
            else if (kind === 'post') msg = pick(MJ_POST);
            else if (kind === 'over') msg = '🚀 ' + pick(MJ_OVER);
            else if (kind === 'short') msg = 'Not enough power — put your foot through it!';
            else msg = '❌ ' + pick(MJ_WIDE);

            setMessage(`MJ: "${msg}"`);

            setScore(prev => ({
                player: goal ? prev.player + 1 : prev.player,
                mj: goal ? prev.mj : prev.mj + 1,
            }));

            setRound(prev => prev + 1);
        };
    }, []);

    useEffect(() => {
        if (phase !== 'result') return;
        const timer = window.setTimeout(() => {
            const done = round >= TOTAL_ROUNDS;
            state.current.phase = done ? 'done' : 'idle';
            state.current.flight = null;
            state.current.swipePath = [];
            setPhase(done ? 'done' : 'idle');
            setMessage(done ? 'Full time! Beat MJ for bragging rights.' : `Round ${round + 1}/${TOTAL_ROUNDS} — ${SHOT_HELP}`);
        }, 3000);
        return () => window.clearTimeout(timer);
    }, [phase, round]);

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
            const timeScale = isShooting || s.phase === 'result' ? 0.72 : 1.0;
            s.simTime += deltaReal * timeScale;
            const simTime = s.simTime;

            if (s.phase === 'shooting' || (s.phase === 'result' && s.flight)) {
                const f = s.flight;
                if (f) {
                    const previousOutcome = f.outcome;
                    advanceShot(f, deltaReal * timeScale / 1000, s.keeperPlan ?? undefined);
                    const projected = projectBall(f.ball);
                    s.ballX = projected.x;
                    s.ballY = projected.y;
                    s.ballGroundY = projected.groundY;
                    s.ballScale = projected.scale;
                    s.ballRotation += (f.ball.spin * 0.025 + f.ball.vy * 0.02) * deltaReal / 16.67;
                    if (f.saveContact?.kind === 'catch' || (f.outcome === 'goal' && Math.hypot(f.ball.vx, f.ball.vy, f.ball.vz) < 0.3)) {
                        s.trail.length = 0;
                    } else {
                        s.trail.push({ x: s.ballX, y: s.ballY, scale: s.ballScale });
                        if (s.trail.length > 14) s.trail.shift();
                    }
                    if (s.keeperPlan) s.keeperFrame = keeperMotion(s.keeperPlan, f.ball.elapsed, f.saveContact);
                    canvas.dataset.save = f.saveContact?.kind ?? '';
                    canvas.dataset.netImpacts = String(f.netImpacts.length);

                    if (f.outcome && !previousOutcome) {
                        s.outcome = f.outcome;
                        s.phase = 'result';
                        if (f.outcome === 'goal') {
                            s.shakeStart = simTime;
                            s.flashStart = timestamp;
                        }
                        onShotComplete.current(f.outcome === 'goal', f.saveContact?.kind === 'catch' ? 'catch' : f.outcome);
                    }
                }

            } else if (s.phase === 'idle' || s.phase === 'aiming') {
                const pace = Math.sin(simTime * 0.002) * 46;
                s.keeperX = KEEPER_HOME_X + pace;
                s.keeperFrame = restingKeeper(pace / (GW / PITCH.goalWidth), s.phase === 'aiming' ? 1 : Math.abs(Math.sin(simTime * 0.005)) * 0.3);
                s.ballX = BALL_START_X;
                s.ballY = BALL_START_Y;
                s.ballScale = 1;
                s.ballGroundY = BALL_START_Y + 14;
                s.ballRotation = 0;
                canvas.dataset.save = '';
                canvas.dataset.netImpacts = '0';
                if (s.trail.length) s.trail.length = 0;
            }

            canvas.dataset.keeperStage = s.keeperFrame.stage;

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

            // The mesh bulges where the ball actually hits, not on scoring.
            drawGoalNet(ctx, s.flight);

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
            drawKeeper(ctx, s.keeperFrame);

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
            const distFromGround = Math.max(0, s.ballGroundY - s.ballY);
            const shadowOpacity = Math.max(0.1, 0.45 - distFromGround / 900);
            ctx.fillStyle = `rgba(0,0,0,${shadowOpacity})`;
            ctx.beginPath();
            ctx.ellipse(s.ballX, s.ballGroundY, bR * 1.1, bR * 0.35, 0, 0, Math.PI * 2);
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

        const drawAimingUI = (ctx: CanvasRenderingContext2D, s: typeof state.current) => {
            if (s.phase !== 'aiming') return;
            const path = s.swipePath;
            if (path.length < 1) return;

            const start = path[0];
            const end = path[path.length - 1];
            const dist = Math.hypot(end.x - start.x, end.y - start.y);
            const powerRatio = Math.min(dist / 330, 1);

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

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const scaleX = CW / rect.width;
        const scaleY = CH / rect.height;
        return { cx: (e.clientX - rect.left) * scaleX, cy: (e.clientY - rect.top) * scaleY };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const s = state.current;
        if (s.phase !== 'idle' || !e.isPrimary || e.button !== 0) return;
        const pos = getPos(e);
        if (!pos) return;

        const dist = Math.hypot(pos.cx - s.ballX, pos.cy - s.ballY);
        if (dist > 60) return;

        e.currentTarget.setPointerCapture(e.pointerId);

        s.phase = 'aiming';
        s.swipePath = [{ x: pos.cx, y: pos.cy }];
        s.aimTargetX = 0;
        s.aimTargetY = 0;
        setPhase('aiming');
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const s = state.current;
        if (s.phase !== 'aiming') return;
        const pos = getPos(e);
        if (!pos) return;

        s.swipePath.push({ x: pos.cx, y: pos.cy });
        // Keep the origin when thinning a long gesture.
        if (s.swipePath.length > 300) s.swipePath = s.swipePath.filter((_, i) => i === 0 || i % 2 === 1);
        const aim = readSwipe(s.swipePath);
        s.aimTargetX = aim?.targetX ?? 0;
        s.aimTargetY = aim?.targetY ?? 0;
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const s = state.current;
        if (s.phase !== 'aiming') return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        const pos = getPos(e);
        if (pos) s.swipePath.push({ x: pos.cx, y: pos.cy });
        const shot = createShot(s.swipePath);
        s.aimTargetX = 0;
        s.aimTargetY = 0;
        if (!shot) {
            s.phase = 'idle';
            setPhase('idle');
            setMessage('Swipe up from the ball to shoot.');
            return;
        }
        s.flight = shot;
        s.outcome = '';
        s.trail.length = 0;
        s.keeperPlan = planKeeper(shot, (s.keeperX - KEEPER_HOME_X) / (GW / PITCH.goalWidth));

        s.phase = 'shooting';
        setPhase('shooting');
        s.shootRealStart = performance.now();
    };

    const cancelAim = () => {
        if (state.current.phase !== 'aiming') return;
        state.current.phase = 'idle';
        state.current.swipePath = [];
        state.current.aimTargetX = 0;
        state.current.aimTargetY = 0;
        setPhase('idle');
    };

    const resetGame = () => {
        setScore({ player: 0, mj: 0 });
        setRound(0);
        setPhase('idle');
        state.current.phase = 'idle';
        state.current.swipePath = [];
        state.current.flight = null;
        state.current.outcome = '';
        state.current.keeperFrame = restingKeeper(0);
        state.current.keeperPlan = null;
        setMessage(SHOT_HELP);
    };

    return (
        <div className="penalty-game" data-phase={phase}>
            <div className="penalty-scorebar" aria-label={`Score: you ${score.player}, MJ ${score.mj}`}>
                <span className="whitespace-nowrap">
                    YOU <span className={score.player > score.mj ? 'text-green-400 font-bold' : ''}>{score.player}</span>
                    {' — '}
                    <span className={score.mj > score.player ? 'text-red-400 font-bold' : ''}>{score.mj}</span> MJ
                </span>
                <span className="text-white/50 text-[11px] whitespace-nowrap">
                    ROUND {Math.min(phase === 'result' || phase === 'done' ? round : round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
                </span>
            </div>
            <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                className="w-full rounded-lg border border-white/10 cursor-crosshair block touch-none shadow-2xl relative z-10"
                style={{ touchAction: 'none' }}
                aria-label="Penalty shootout pitch. Drag up from the ball to aim and release to shoot."
                aria-describedby="penalty-help"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={cancelAim}
                onLostPointerCapture={cancelAim}
            >Drag up from the ball to shoot a penalty.</canvas>
            <p id="penalty-help" className="penalty-message" role="status">{message}</p>
            <p className="penalty-hint">Aim inside the posts. Too much power lifts the ball; too much spin bends it wide.</p>
            {phase === 'done' && (
                <button onClick={resetGame} className="w-full bg-accent text-white hover:bg-accent/80 transition-colors rounded py-3 mt-4 font-bold tracking-wider text-sm">
                    {score.player > score.mj ? '🏆 YOU BEAT MJ! PLAY AGAIN' : (score.player < score.mj ? '🧤 MJ WALL! TRY AGAIN' : '🤝 DRAW! PLAY AGAIN')}
                </button>
            )}
        </div>
    );
};

export default PenaltyGame;
