import { useRef, useState, useEffect, useCallback } from 'react';

interface Shot {
    x: number;
    goalieX: number;
    scored: boolean;
}

const GOAL_W = 360;
const GOAL_H = 180;
const BALL_R = 12;
const GOALIE_W = 60;
const GOALIE_H = 80;
const TOTAL_ROUNDS = 5;

const PenaltyGame = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState({ player: 0, ai: 0 });
    const [round, setRound] = useState(0);
    const [phase, setPhase] = useState<'aim' | 'shoot' | 'result' | 'done'>('aim');
    const [aimX, setAimX] = useState(GOAL_W / 2);
    const [aimY, setAimY] = useState(GOAL_H / 2);
    const [message, setMessage] = useState('Click on the goal to shoot!');
    const [shots, setShots] = useState<Shot[]>([]);

    const goalOffsetX = 20;
    const goalOffsetY = 40;

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Grass
        ctx.fillStyle = '#0a3d0a';
        ctx.fillRect(0, 0, w, h);

        // Grass lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < w; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }

        // Goal frame
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(goalOffsetX, goalOffsetY, GOAL_W, GOAL_H);

        // Net
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let x = goalOffsetX; x <= goalOffsetX + GOAL_W; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, goalOffsetY);
            ctx.lineTo(x, goalOffsetY + GOAL_H);
            ctx.stroke();
        }
        for (let y = goalOffsetY; y <= goalOffsetY + GOAL_H; y += 30) {
            ctx.beginPath();
            ctx.moveTo(goalOffsetX, y);
            ctx.lineTo(goalOffsetX + GOAL_W, y);
            ctx.stroke();
        }

        // Goalie (AI)
        if (phase === 'shoot' || phase === 'result') {
            const lastShot = shots[shots.length - 1];
            if (lastShot) {
                const gx = goalOffsetX + lastShot.goalieX - GOALIE_W / 2;
                const gy = goalOffsetY + GOAL_H / 2 - GOALIE_H / 2;
                ctx.fillStyle = '#b4a0e5';
                ctx.fillRect(gx, gy, GOALIE_W, GOALIE_H);
                ctx.fillStyle = '#000';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('AI', gx + GOALIE_W / 2, gy + GOALIE_H / 2 + 4);
            }
        }

        // Ball
        if (phase === 'aim') {
            // Crosshair at aim position
            ctx.strokeStyle = '#b4a0e5';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(goalOffsetX + aimX, goalOffsetY + aimY, 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(goalOffsetX + aimX - 20, goalOffsetY + aimY);
            ctx.lineTo(goalOffsetX + aimX + 20, goalOffsetY + aimY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(goalOffsetX + aimX, goalOffsetY + aimY - 20);
            ctx.lineTo(goalOffsetX + aimX, goalOffsetY + aimY + 20);
            ctx.stroke();

            // Ball at bottom
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(w / 2, h - 30, BALL_R, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (phase === 'result' || phase === 'shoot') {
            const lastShot = shots[shots.length - 1];
            if (lastShot) {
                ctx.fillStyle = lastShot.scored ? '#4ade80' : '#f87171';
                ctx.beginPath();
                ctx.arc(goalOffsetX + lastShot.x, goalOffsetY + aimY, BALL_R, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Score overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(w - 120, 5, 115, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`YOU ${score.player} - ${score.ai} AI`, w - 62, 25);
    }, [phase, aimX, aimY, shots, score, goalOffsetX, goalOffsetY]);

    useEffect(() => { draw(); }, [draw]);

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (phase !== 'aim') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left - goalOffsetX;
        const y = e.clientY - rect.top - goalOffsetY;
        setAimX(Math.max(20, Math.min(GOAL_W - 20, x)));
        setAimY(Math.max(20, Math.min(GOAL_H - 20, y)));
    };

    const handleShoot = () => {
        if (phase !== 'aim') return;

        // AI goalie chooses a position (random)
        const goalieX = Math.random() * (GOAL_W - GOALIE_W) + GOALIE_W / 2;
        const scored = Math.abs(aimX - goalieX) > GOALIE_W / 2 + BALL_R;

        const shot: Shot = { x: aimX, goalieX, scored };
        setShots((prev) => [...prev, shot]);
        setPhase('shoot');

        if (scored) {
            setScore((prev) => ({ ...prev, player: prev.player + 1 }));
            setMessage('⚽ GOAL! You scored!');
        } else {
            setScore((prev) => ({ ...prev, ai: prev.ai + 1 }));
            setMessage('🧤 SAVED! The AI keeper got it.');
        }

        setTimeout(() => {
            const newRound = round + 1;
            setRound(newRound);
            if (newRound >= TOTAL_ROUNDS) {
                setPhase('done');
                const finalPlayerScore = scored ? score.player + 1 : score.player;
                const finalAIScore = scored ? score.ai : score.ai + 1;
                if (finalPlayerScore > finalAIScore) {
                    setMessage('🏆 You win the shootout!');
                } else if (finalPlayerScore < finalAIScore) {
                    setMessage('😔 AI wins the shootout!');
                } else {
                    setMessage("🤝 It's a draw!");
                }
            } else {
                setPhase('result');
                setTimeout(() => {
                    setPhase('aim');
                    setMessage(`Round ${newRound + 1}/${TOTAL_ROUNDS} — Aim and shoot!`);
                }, 1200);
            }
        }, 800);
    };

    const resetGame = () => {
        setScore({ player: 0, ai: 0 });
        setRound(0);
        setPhase('aim');
        setShots([]);
        setMessage('Click on the goal to shoot!');
    };

    return (
        <div className="penalty-game">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-mono tracking-widest text-accent uppercase">⚽ Penalty Shootout</h3>
                <span className="text-xs font-mono text-muted">Round {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
            </div>

            <canvas
                ref={canvasRef}
                width={400}
                height={280}
                className="w-full rounded border border-white/10 cursor-crosshair"
                onMouseMove={handleCanvasMouseMove}
                onClick={handleShoot}
            />

            <p className="text-xs font-mono text-center mt-3 text-muted h-4">{message}</p>

            {phase === 'done' && (
                <button
                    onClick={resetGame}
                    className="btn-accent mt-4 w-full text-xs"
                >
                    Play Again
                </button>
            )}
        </div>
    );
};

export default PenaltyGame;
