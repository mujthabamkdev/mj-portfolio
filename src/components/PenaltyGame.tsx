import { useRef, useState, useEffect } from 'react';

const CW = 700;
const CH = 420;
const GX = 80;
const GY = 50;
const GW = 540;
const GH = 220;

const BALL_START_X = CW / 2;
const BALL_START_Y = CH - 45;
const BALL_R = 14;

const GOALIE_W = 80;
const GOALIE_H = 100;
const TOTAL_ROUNDS = 5;

type Phase = 'idle' | 'aiming' | 'shooting' | 'result' | 'done';

const PenaltyGame = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState({ player: 0, ai: 0 });
    const [round, setRound] = useState(0);
    const [message, setMessage] = useState('Drag from the ball to aim, then release to shoot!');
    const [phase, setPhase] = useState<Phase>('idle');

    const state = useRef({
        phase: 'idle' as Phase,
        ballX: BALL_START_X,
        ballY: BALL_START_Y,
        ballScale: 1,
        goalieX: GX + GW / 2 - GOALIE_W / 2,
        goalieY: GY + GH - GOALIE_H,
        aimX: CW / 2,
        aimY: GY + GH / 2,
        targetX: 0,
        targetY: 0,
        goalieTargetX: 0,
        goalieTargetY: 0,
        animStartTime: 0,
        scored: false,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animId: number;

        const draw = (timestamp: number) => {
            const s = state.current;

            // ─── Animations ───
            if (s.phase === 'shooting') {
                const elapsed = timestamp - s.animStartTime;
                const duration = 500;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 2);
                
                s.ballX = BALL_START_X + (s.targetX - BALL_START_X) * easeOut;
                s.ballY = BALL_START_Y + (s.targetY - BALL_START_Y) * easeOut;
                s.ballScale = 1 - (0.45 * Math.pow(easeOut, 2));

                const gStartX = GX + GW / 2 - GOALIE_W / 2;
                const gStartY = GY + GH - GOALIE_H;
                s.goalieX = gStartX + (s.goalieTargetX - gStartX) * easeOut;
                s.goalieY = gStartY + (s.goalieTargetY - gStartY) * easeOut;
            } else if (s.phase === 'idle' || s.phase === 'aiming') {
                const pace = Math.sin(timestamp * 0.003) * 40;
                s.goalieX = GX + GW / 2 - GOALIE_W / 2 + pace;
                s.goalieY = GY + GH - GOALIE_H;
                s.ballX = BALL_START_X;
                s.ballY = BALL_START_Y;
                s.ballScale = 1;
            }

            // ─── Draw Background ───
            const grassGrad = ctx.createLinearGradient(0, 0, 0, CH);
            grassGrad.addColorStop(0, '#0c4a0c');
            grassGrad.addColorStop(1, '#082b08');
            ctx.fillStyle = grassGrad;
            ctx.fillRect(0, 0, CW, CH);
            for (let i = 0; i < CW; i += 40) {
                ctx.fillStyle = i % 80 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
                ctx.fillRect(i, 0, 40, CH);
            }

            // ─── Goal Posts ───
            const postDepth = 35;
            ctx.fillStyle = 'rgba(200,200,200,0.4)';
            ctx.fillRect(GX + postDepth, GY + postDepth, GW - postDepth * 2, 6);
            ctx.fillRect(GX + postDepth, GY + postDepth, 6, GH - postDepth);
            ctx.fillRect(GX + GW - postDepth - 6, GY + postDepth, 6, GH - postDepth);

            ctx.strokeStyle = 'rgba(200,200,200,0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(GX, GY); ctx.lineTo(GX + postDepth, GY + postDepth); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(GX + GW, GY); ctx.lineTo(GX + GW - postDepth, GY + postDepth); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(GX, GY + GH); ctx.lineTo(GX + postDepth, GY + GH); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(GX + GW, GY + GH); ctx.lineTo(GX + GW - postDepth, GY + GH); ctx.stroke();

            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            for (let x = GX + postDepth; x <= GX + GW - postDepth; x += 30) {
                ctx.beginPath(); ctx.moveTo(x, GY + postDepth); ctx.lineTo(x, GY + GH); ctx.stroke();
            }
            for (let y = GY + postDepth; y <= GY + GH; y += 30) {
                ctx.beginPath(); ctx.moveTo(GX + postDepth, y); ctx.lineTo(GX + GW - postDepth, y); ctx.stroke();
            }

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 7;
            ctx.lineJoin = 'round';
            ctx.strokeRect(GX, GY, GW, GH);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(GX - 30, GY + GH); ctx.lineTo(GX + GW + 30, GY + GH); ctx.stroke();

            // ─── Goalie ───
            const gx = s.goalieX;
            const gy = s.goalieY;
            const goalieGrad = ctx.createLinearGradient(gx, gy, gx + GOALIE_W, gy + GOALIE_H);
            goalieGrad.addColorStop(0, '#7c3aed');
            goalieGrad.addColorStop(1, '#4c1d95');
            ctx.fillStyle = goalieGrad;
            ctx.beginPath();
            ctx.roundRect(gx, gy, GOALIE_W, GOALIE_H, 8);
            ctx.fill();

            const isDiving = s.phase === 'shooting' && Math.abs(s.goalieTargetX - (GX + GW / 2 - GOALIE_W / 2)) > 20;
            ctx.fillStyle = '#fef3c7'; 
            if (isDiving) {
                ctx.beginPath(); ctx.arc(gx - 10, gy + 15, 12, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(gx + GOALIE_W + 10, gy + 15, 12, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.beginPath(); ctx.arc(gx - 8, gy + 40, 12, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(gx + GOALIE_W + 8, gy + 40, 12, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = '#fcd34d';
            ctx.beginPath(); ctx.arc(gx + GOALIE_W / 2, gy - 20, 22, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('AI', gx + GOALIE_W / 2, gy + GOALIE_H / 2 + 5);

            // ─── Aiming indicator ───
            if (s.phase === 'aiming') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(BALL_START_X, BALL_START_Y);
                ctx.lineTo(s.aimX, s.aimY);
                ctx.stroke();
                
                ctx.setLineDash([]);
                ctx.strokeStyle = '#a78bfa';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(s.aimX, s.aimY, 15, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(s.aimX - 20, s.aimY); ctx.lineTo(s.aimX + 20, s.aimY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(s.aimX, s.aimY - 20); ctx.lineTo(s.aimX, s.aimY + 20); ctx.stroke();
            }

            // ─── Ball ───
            const bR = BALL_R * s.ballScale;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath(); ctx.ellipse(s.ballX, s.ballY + bR + 4*s.ballScale, bR*1.2, bR*0.4, 0, 0, Math.PI*2); ctx.fill();
            
            const ballGrad = ctx.createRadialGradient(s.ballX - bR*0.3, s.ballY - bR*0.3, bR*0.2, s.ballX, s.ballY, bR);
            ballGrad.addColorStop(0, '#ffffff');
            ballGrad.addColorStop(1, '#aaaaaa');
            ctx.fillStyle = ballGrad;
            ctx.beginPath(); ctx.arc(s.ballX, s.ballY, bR, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1 * s.ballScale;
            ctx.stroke();

            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(s.ballX, s.ballY, bR * 0.4, 0, Math.PI * 2); ctx.fill();

            animId = requestAnimationFrame(draw);
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
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const s = state.current;
        if (s.phase !== 'idle') return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const pos = getPos(e);
        if (pos) {
            s.phase = 'aiming';
            s.aimX = Math.max(GX, Math.min(GX + GW, pos.cx));
            s.aimY = Math.max(GY, Math.min(GY + GH, pos.cy));
            setPhase('aiming');
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const s = state.current;
        if (s.phase !== 'aiming') return;
        const pos = getPos(e);
        if (pos) {
            s.aimX = Math.max(GX - 40, Math.min(GX + GW + 40, pos.cx));
            s.aimY = Math.max(GY - 40, Math.min(GY + GH + 40, pos.cy));
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        const s = state.current;
        if (s.phase !== 'aiming') return;
        
        s.phase = 'shooting';
        setPhase('shooting');
        s.animStartTime = performance.now();
        s.targetX = s.aimX;
        s.targetY = s.aimY;

        const isLeft = s.targetX < GX + GW / 2;
        const aiGuessesRight = Math.random() > 0.4; // 60% chance to read the direction
        
        let aiTargetX = GX + GW / 2; 
        if (aiGuessesRight) {
            aiTargetX = s.targetX - GOALIE_W/2 + (Math.random()-0.5)*40;
        } else {
            aiTargetX = GX + GW / 2 + (isLeft ? 1 : -1) * (100 + Math.random()*150);
        }
        aiTargetX = Math.max(GX, Math.min(GX + GW - GOALIE_W, aiTargetX));

        let aiTargetY = GY + GH - GOALIE_H; 
        if (aiGuessesRight && s.targetY < GY + GH - 40) {
            aiTargetY = s.targetY - GOALIE_H/2 + (Math.random()-0.5)*30;
        }
        s.goalieTargetX = aiTargetX;
        s.goalieTargetY = Math.max(GY, Math.min(GY + GH - GOALIE_H, aiTargetY));

        const insideGoal = s.targetX > GX + 10 && s.targetX < GX + GW - 10 && s.targetY > GY + 10 && s.targetY < GY + GH - 10;
        
        const gcX = s.goalieTargetX + GOALIE_W/2;
        const gcY = s.goalieTargetY + GOALIE_H/2;
        const dist = Math.hypot(s.targetX - gcX, s.targetY - gcY);

        const saved = dist < 75; // Dive reach
        const scored = insideGoal && !saved;
        s.scored = scored;

        setTimeout(() => {
            s.phase = 'result';
            setPhase('result');
            
            setMessage(scored ? '⚽ GOAL! Unstoppable shot!' : (!insideGoal ? '❌ MISSED THE GOAL!' : '🧤 SAVED! Great dive by AI!'));
            
            const newRnd = round + 1;
            setScore(prev => ({ 
                player: scored ? prev.player + 1 : prev.player,
                ai: !scored ? prev.ai + 1 : prev.ai
            }));
            setRound(newRnd);

            setTimeout(() => {
                if (newRnd >= TOTAL_ROUNDS) {
                    s.phase = 'done';
                    setPhase('done');
                } else {
                    s.phase = 'idle';
                    setPhase('idle');
                    setMessage(`Round ${newRnd + 1}/${TOTAL_ROUNDS} — Drag from ball to aim!`);
                }
            }, 1800);
        }, 550);
    };

    const resetGame = () => {
        setScore({ player: 0, ai: 0 });
        setRound(0);
        setPhase('idle');
        state.current.phase = 'idle';
        setMessage('Drag from the ball to aim, then release to shoot!');
    };

    return (
        <div className="w-full relative">
            <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                className="w-full rounded-lg border border-white/10 cursor-crosshair block touch-none shadow-xl"
                style={{ touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />
            
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-5 py-2 rounded-full text-white font-mono text-sm tracking-wider shadow border border-white/10 z-10 backdrop-blur-sm">
                YOU <span className={score.player > score.ai ? 'text-green-400' : ''}>{score.player}</span> 
                {' — '}
                <span className={score.ai > score.player ? 'text-red-400' : ''}>{score.ai}</span> AI
            </div>

            <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs font-mono text-accent">{message}</p>
                <span className="text-xs font-mono text-white/30 whitespace-nowrap ml-4">
                    Round {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
                </span>
            </div>
            {phase === 'done' && (
                <button onClick={resetGame} className="w-full bg-accent text-white hover:bg-accent/80 transition-colors rounded py-3 mt-4 font-bold tracking-wider text-sm">
                    {score.player > score.ai ? '🏆 YOU WON! PLAY AGAIN' : (score.ai > score.player ? '😩 AI WON! TRY AGAIN' : '🤝 DRAW! PLAY AGAIN')}
                </button>
            )}
        </div>
    );
};

export default PenaltyGame;
