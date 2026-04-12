import { useRef, useState, useEffect, useCallback } from 'react';

const CW = 700;   // canvas width
const CH = 420;   // canvas height

// Goal dimensions — takes up most of upper canvas
const GX = 80;    // goal left x
const GY = 50;    // goal top y
const GW = 540;   // goal width
const GH = 220;   // goal height

const BALL_R = 14;
const GOALIE_W = 80;
const GOALIE_H = 100;
const TOTAL_ROUNDS = 5;

interface Shot {
    aimX: number;
    aimY: number;
    goalieX: number;
    scored: boolean;
}

const PenaltyGame = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState({ player: 0, ai: 0 });
    const [round, setRound] = useState(0);
    const [phase, setPhase] = useState<'aim' | 'result' | 'done'>('aim');
    const [aimX, setAimX] = useState(GW / 2);
    const [aimY, setAimY] = useState(GH / 2);
    const [message, setMessage] = useState('Move mouse into the goal — click to shoot!');
    const [shots, setShots] = useState<Shot[]>([]);
    const [isHovering, setIsHovering] = useState(false);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background — grass
        const grassGrad = ctx.createLinearGradient(0, 0, 0, CH);
        grassGrad.addColorStop(0, '#0c4a0c');
        grassGrad.addColorStop(1, '#082b08');
        ctx.fillStyle = grassGrad;
        ctx.fillRect(0, 0, CW, CH);

        // Grass stripes
        for (let i = 0; i < CW; i += 40) {
            ctx.fillStyle = i % 80 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
            ctx.fillRect(i, 0, 40, CH);
        }

        // ─── Posts: 3D perspective ───
        // Back post (further away, slightly grey)
        const postDepth = 35;
        ctx.fillStyle = 'rgba(200,200,200,0.4)';
        // Top back
        ctx.fillRect(GX + postDepth, GY + postDepth, GW - postDepth * 2, 6);
        // Left back post
        ctx.fillRect(GX + postDepth, GY + postDepth, 6, GH - postDepth);
        // Right back post
        ctx.fillRect(GX + GW - postDepth - 6, GY + postDepth, 6, GH - postDepth);

        // Side connectors (perspective lines)
        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
        ctx.lineWidth = 3;
        // Top-left connector
        ctx.beginPath(); ctx.moveTo(GX, GY); ctx.lineTo(GX + postDepth, GY + postDepth); ctx.stroke();
        // Top-right connector
        ctx.beginPath(); ctx.moveTo(GX + GW, GY); ctx.lineTo(GX + GW - postDepth, GY + postDepth); ctx.stroke();
        // Bottom-left connector
        ctx.beginPath(); ctx.moveTo(GX, GY + GH); ctx.lineTo(GX + postDepth, GY + GH); ctx.stroke();
        // Bottom-right connector
        ctx.beginPath(); ctx.moveTo(GX + GW, GY + GH); ctx.lineTo(GX + GW - postDepth, GY + GH); ctx.stroke();

        // Net
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let x = GX + postDepth; x <= GX + GW - postDepth; x += 25) {
            ctx.beginPath(); ctx.moveTo(x, GY + postDepth); ctx.lineTo(x, GY + GH); ctx.stroke();
        }
        for (let y = GY + postDepth; y <= GY + GH; y += 25) {
            ctx.beginPath(); ctx.moveTo(GX + postDepth, y); ctx.lineTo(GX + GW - postDepth, y); ctx.stroke();
        }

        // Front white posts (main visible frame)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.strokeRect(GX, GY, GW, GH);

        // Goal line at bottom (ground level)
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(GX - 30, GY + GH);
        ctx.lineTo(GX + GW + 30, GY + GH);
        ctx.stroke();

        // ─── Goalie ───
        if (phase === 'result') {
            const lastShot = shots[shots.length - 1];
            if (lastShot) {
                const gx = GX + lastShot.goalieX - GOALIE_W / 2;
                const gy = GY + GH - GOALIE_H;
                // Body
                const goalieGrad = ctx.createLinearGradient(gx, gy, gx + GOALIE_W, gy + GOALIE_H);
                goalieGrad.addColorStop(0, '#7c3aed');
                goalieGrad.addColorStop(1, '#4c1d95');
                ctx.fillStyle = goalieGrad;
                ctx.beginPath();
                ctx.roundRect(gx, gy, GOALIE_W, GOALIE_H, 8);
                ctx.fill();
                // Gloves
                ctx.fillStyle = '#fef3c7';
                ctx.beginPath(); ctx.arc(gx - 8, gy + 30, 12, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(gx + GOALIE_W + 8, gy + 30, 12, 0, Math.PI * 2); ctx.fill();
                // Head
                ctx.fillStyle = '#fcd34d';
                ctx.beginPath(); ctx.arc(gx + GOALIE_W / 2, gy - 18, 20, 0, Math.PI * 2); ctx.fill();
                // Label
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('AI', gx + GOALIE_W / 2, gy + GOALIE_H / 2 + 5);
            }
        }

        // ─── Aim crosshair ───
        if (phase === 'aim' && isHovering) {
            const ax = GX + aimX;
            const ay = GY + aimY;
            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.arc(ax, ay, 20, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
            ctx.strokeStyle = '#c4b5fd';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(ax - 30, ay); ctx.lineTo(ax + 30, ay); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ax, ay - 30); ctx.lineTo(ax, ay + 30); ctx.stroke();
        }

        // ─── Ball ───
        // Always show ball near bottom center
        const ballX = CW / 2;
        const ballY = CH - 45;
        const ballGrad = ctx.createRadialGradient(ballX - 4, ballY - 4, 2, ballX, ballY, BALL_R);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(1, '#aaaaaa');
        ctx.fillStyle = ballGrad;
        ctx.beginPath(); ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();

        // If shot was taken, show ball in goal
        if (phase === 'result') {
            const lastShot = shots[shots.length - 1];
            if (lastShot) {
                ctx.fillStyle = lastShot.scored ? '#4ade80' : '#f87171';
                ctx.beginPath();
                ctx.arc(GX + lastShot.aimX, GY + lastShot.aimY, BALL_R + 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = lastShot.scored ? '#166534' : '#991b1b';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // ─── Score bar ───
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(CW / 2 - 80, CH - 28, 160, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`YOU  ${score.player}  —  ${score.ai}  AI`, CW / 2, CH - 12);
    }, [phase, aimX, aimY, shots, score, isHovering]);

    useEffect(() => { draw(); }, [draw]);

    const getCanvasAim = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const scaleX = CW / rect.width;
        const scaleY = CH / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;
        // Only allow aiming inside goal
        const ax = Math.max(10, Math.min(GW - 10, cx - GX));
        const ay = Math.max(10, Math.min(GH - 10, cy - GY));
        const inside = cx >= GX && cx <= GX + GW && cy >= GY && cy <= GY + GH;
        return { ax, ay, inside };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (phase !== 'aim') return;
        const pos = getCanvasAim(e);
        if (!pos) return;
        setIsHovering(pos.inside);
        if (pos.inside) { setAimX(pos.ax); setAimY(pos.ay); }
    };

    const handleShoot = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (phase !== 'aim') return;
        const pos = getCanvasAim(e);
        if (!pos?.inside) return;

        const goalieX = Math.random() * (GW - GOALIE_W) + GOALIE_W / 2;
        const scored = Math.abs(aimX - goalieX) > GOALIE_W / 2 + BALL_R + 5;
        const shot: Shot = { aimX, aimY, goalieX, scored };

        const newRound = round + 1;
        const newPlayerScore = scored ? score.player + 1 : score.player;
        const newAIScore = !scored ? score.ai + 1 : score.ai;

        setShots(prev => [...prev, shot]);
        setPhase('result');
        setMessage(scored ? '⚽ GOAL! Great shot!' : '🧤 SAVED! The AI keeper got it.');

        if (scored) setScore(prev => ({ ...prev, player: prev.player + 1 }));
        else setScore(prev => ({ ...prev, ai: prev.ai + 1 }));

        setRound(newRound);

        setTimeout(() => {
            if (newRound >= TOTAL_ROUNDS) {
                setPhase('done');
                if (newPlayerScore > newAIScore) setMessage('🏆 You win the shootout!');
                else if (newPlayerScore < newAIScore) setMessage('😔 AI wins the shootout!');
                else setMessage("🤝 It's a draw!");
            } else {
                setPhase('aim');
                setMessage(`Round ${newRound + 1}/${TOTAL_ROUNDS} — Aim and shoot!`);
            }
        }, 1400);
    };

    const resetGame = () => {
        setScore({ player: 0, ai: 0 });
        setRound(0);
        setPhase('aim');
        setShots([]);
        setIsHovering(false);
        setMessage('Move mouse into the goal — click to shoot!');
    };

    return (
        <div className="w-full">
            <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                className="w-full rounded-lg border border-white/10 cursor-crosshair block"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleShoot}
            />
            <div className="flex items-center justify-between mt-3">
                <p className="text-xs font-mono text-muted">{message}</p>
                <span className="text-xs font-mono text-white/30">
                    Round {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
                </span>
            </div>
            {phase === 'done' && (
                <button onClick={resetGame} className="btn-accent mt-3 w-full text-xs">
                    Play Again
                </button>
            )}
        </div>
    );
};

export default PenaltyGame;
