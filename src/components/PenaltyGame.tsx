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

type Phase = 'idle' | 'aiming' | 'shooting' | 'result' | 'done';

const PenaltyGame = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState({ player: 0, ai: 0 });
    const [round, setRound] = useState(0);
    const [message, setMessage] = useState('Swipe forward from the ball to aim & bend your shot!');
    const [phase, setPhase] = useState<Phase>('idle');

    const getCrowdData = () => {
        return Array.from({length: 450}, () => ({
            x: Math.random() * CW,
            y: Math.random() * (GY + 30),
            c: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#f472b6', '#cbd5e1', '#0ea5e9'][Math.floor(Math.random() * 7)],
            speed: 0.002 + Math.random() * 0.008,
            offset: Math.random() * Math.PI * 2,
            size: 1.5 + Math.random() * 2.5
        }));
    };

    const state = useRef({
        phase: 'idle' as Phase,
        ballX: BALL_START_X,
        ballY: BALL_START_Y,
        ballScale: 1,
        goalieX: GX + GW / 2,
        goalieY: GY + GH,
        swipePath: [] as {x: number, y: number}[],
        targetX: 0,
        targetY: 0,
        power: 0,
        curveFactor: 0,
        goalieTargetX: 0,
        goalieTargetY: 0,
        scored: false,
        saved: false,
        tooMuchPower: false,
        ballRotation: 0,
        crowd: getCrowdData(),
        
        // Custom Ticking Loop
        simTime: 0,
        lastRealTime: 0,
        animStartSimTime: 0,
        shootRealTimeStart: 0,
        resultTriggered: false
    });

    const onShotComplete = useRef((_scored: boolean, _tooMuchPower: boolean, _saved: boolean, _curveFactor: number) => {});

    useEffect(() => {
        onShotComplete.current = (scored, tooMuchPower, saved, curveFactor) => {
            setPhase('result');
            
            let resultMsg = '';
            if (scored) {
                if (Math.abs(curveFactor) > 40) resultMsg = '🔥 WHAT A BEND! Perfect Curve!';
                else if (tooMuchPower) resultMsg = '🔥 SCREAMER! Absolute Top Bins!';
                else resultMsg = '⚽ GOAL! Clean Strike!';
            } else if (saved) {
                resultMsg = '🧤 SAVED! Golden gloves!';
            } else {
                if (tooMuchPower) resultMsg = '🚀 OVER THE BAR! Too much power!';
                else resultMsg = '❌ WIDE! Missed the target.';
            }

            setMessage(resultMsg);
            
            setScore(prev => ({ 
                player: scored ? prev.player + 1 : prev.player,
                ai: !scored ? prev.ai + 1 : prev.ai
            }));
            
            setRound(prev => {
                const newRnd = prev + 1;
                setTimeout(() => {
                    if (newRnd >= TOTAL_ROUNDS) {
                        setPhase('done');
                        state.current.phase = 'done';
                    } else {
                        setPhase('idle');
                        state.current.phase = 'idle';
                        state.current.swipePath = [];
                        setMessage(`Round ${newRnd + 1}/${TOTAL_ROUNDS} — Swipe & curl to score!`);
                    }
                }, 2500);
                return newRnd;
            });
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animId: number;

        const draw = (timestamp: number) => {
            const s = state.current;
            if (s.lastRealTime === 0) s.lastRealTime = timestamp;
            const delta = timestamp - s.lastRealTime;
            s.lastRealTime = timestamp;

            const isShooting = s.phase === 'shooting';
            // VITAL MULTIPLIER: 0.25x speed makes it dramatic cinematic slow-motion!
            const timeScale = isShooting ? 0.3 : 1.0; 
            s.simTime += delta * timeScale;
            
            const simTime = s.simTime;

            // ─── Animations & Physics ───
            if (s.phase === 'shooting') {
                const elapsed = simTime - s.animStartSimTime;
                const duration = Math.max(600, 1000 - s.power * 1.5);
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 2);
                
                const horizontalCurve = Math.sin(progress * Math.PI) * s.curveFactor;
                s.ballX = BALL_START_X + (s.targetX - BALL_START_X) * easeOut + horizontalCurve;
                
                const arcHeight = Math.min(120, s.power * 0.4);
                const arc = Math.sin(progress * Math.PI) * arcHeight;
                s.ballY = BALL_START_Y + (s.targetY - BALL_START_Y) * easeOut - arc;
                
                s.ballScale = 1 - (0.28 * easeOut);
                
                s.ballRotation += (s.power * 0.005) + (s.curveFactor * 0.002); 

                const leapDuration = duration * 0.8;
                const diveProgress = Math.min((elapsed - 50) / leapDuration, 1);
                if (diveProgress > 0) {
                    const diveEase = 1 - Math.pow(1 - diveProgress, 3);
                    const gStartX = GX + GW / 2;
                    const gStartY = GY + GH;
                    s.goalieX = gStartX + (s.goalieTargetX - gStartX) * diveEase;
                    s.goalieY = gStartY + (s.goalieTargetY - gStartY) * diveEase;
                }

                if (progress >= 1 && !s.resultTriggered) {
                    s.resultTriggered = true;
                    s.phase = 'result';
                    s.animStartSimTime = simTime;
                    onShotComplete.current(s.scored, s.tooMuchPower, s.saved, s.curveFactor);
                }
            } else if (s.phase === 'idle' || s.phase === 'aiming') {
                const pace = Math.sin(simTime * 0.002) * 50;
                s.goalieX = GX + GW / 2 + pace;
                s.goalieY = GY + GH; 
                s.ballX = BALL_START_X;
                s.ballY = BALL_START_Y;
                s.ballScale = 1;
                s.ballRotation = 0;
            }

            // ─── Crowd & Stadium ───
            const isExcited = s.phase === 'shooting' || s.phase === 'result';
            ctx.fillStyle = '#0f172a'; 
            ctx.fillRect(0, 0, CW, GY + 30);

            s.crowd.forEach(p => {
                const jumpMult = isExcited ? 10 : 3;
                const jumpOffset = isExcited ? 0.01 : 0;
                const jumpY = Math.abs(Math.sin(simTime * (p.speed + jumpOffset) * (isExcited ? 3 : 1) + p.offset)) * jumpMult;
                ctx.fillStyle = p.c;
                ctx.beginPath();
                ctx.arc(p.x, p.y - jumpY, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            const grassGrad = ctx.createLinearGradient(0, GY + 30, 0, CH);
            grassGrad.addColorStop(0, '#0a3d0a');
            grassGrad.addColorStop(1, '#052205');
            ctx.fillStyle = grassGrad;
            ctx.fillRect(0, GY + 30, CW, CH - (GY+30));
            
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.moveTo(CW/2 - 100, GY+30); ctx.lineTo(CW/2 + 100, GY+30);
            ctx.lineTo(CW/2 + 350, CH); ctx.lineTo(CW/2 - 350, CH);
            ctx.fill();

            // ─── Goal Net & Posts ───
            const postDepth = 40;
            ctx.fillStyle = 'rgba(180,180,180,0.6)';
            ctx.fillRect(GX + postDepth, GY + postDepth, GW - postDepth * 2, 6);
            ctx.fillRect(GX + postDepth, GY + postDepth, 6, GH - postDepth);
            ctx.fillRect(GX + GW - postDepth - 6, GY + postDepth, 6, GH - postDepth);

            ctx.strokeStyle = 'rgba(200,200,200,0.9)';
            ctx.lineWidth = 5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(GX+4, GY+4); ctx.lineTo(GX + postDepth+3, GY + postDepth+3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(GX + GW-4, GY+4); ctx.lineTo(GX + GW - postDepth-3, GY + postDepth+3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(GX+4, GY + GH); ctx.lineTo(GX + postDepth+3, GY + GH); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(GX + GW-4, GY + GH); ctx.lineTo(GX + GW - postDepth-3, GY + GH); ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1.5;
            for (let x = GX + postDepth; x <= GX + GW - postDepth; x += 30) {
                ctx.beginPath(); ctx.moveTo(x, GY + postDepth); ctx.lineTo(x, GY + GH); ctx.stroke();
            }
            for (let y = GY + postDepth; y <= GY + GH; y += 30) {
                ctx.beginPath(); ctx.moveTo(GX + postDepth, y); ctx.lineTo(GX + GW - postDepth, y); ctx.stroke();
            }

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

            // ─── Goal Keeper (India Team + Boots) ───
            const gx = s.goalieX;
            const gy = s.goalieY; 
            const isDive = (s.phase === 'shooting' || s.phase === 'result') && Math.abs(s.goalieTargetX - (GX + GW / 2)) > 20;

            ctx.save();
            ctx.translate(gx, gy);

            const indiaBlue = '#183A8C';
            const flagOrange = '#FF9933';
            const flagWhite = '#FFFFFF';
            const flagGreen = '#138808';
            const neonBoots = '#fbbf24'; 

            if (isDive) {
                const divingRight = s.goalieTargetX > GX + GW / 2;
                const angle = divingRight ? 1.2 : -1.2; 
                const airHeight = Math.max(-50, (s.goalieTargetY - gy));
                ctx.translate(0, airHeight);
                ctx.rotate(angle);
                
                ctx.fillStyle = indiaBlue; 
                ctx.fillRect(-15, -60, 30, 45);
                ctx.fillStyle = flagOrange; ctx.fillRect(-15, -45, 30, 4);
                ctx.fillStyle = flagWhite;  ctx.fillRect(-15, -41, 30, 4);
                ctx.fillStyle = flagGreen;  ctx.fillRect(-15, -37, 30, 4);
                
                ctx.lineWidth = 8;
                ctx.strokeStyle = '#fca5a5'; 
                ctx.beginPath(); ctx.moveTo(-10, -55); ctx.lineTo(-10, -90); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(10, -55); ctx.lineTo(10, -90); ctx.stroke();
                ctx.strokeStyle = indiaBlue;
                ctx.beginPath(); ctx.moveTo(-10, -55); ctx.lineTo(-10, -70); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(10, -55); ctx.lineTo(10, -70); ctx.stroke();
                ctx.fillStyle = '#e2e8f0'; 
                ctx.beginPath(); ctx.arc(-10, -90, 7, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(10, -90, 7, 0, Math.PI*2); ctx.fill();
                
                ctx.strokeStyle = indiaBlue; 
                ctx.lineWidth = 10;
                ctx.beginPath(); ctx.moveTo(-8, -15); ctx.lineTo(-15, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(8, -15); ctx.lineTo(15, 5); ctx.stroke();
                ctx.strokeStyle = '#fca5a5';
                ctx.lineWidth = 8;
                ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-15, 20); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(15, 5); ctx.lineTo(15, 25); ctx.stroke();
                ctx.strokeStyle = indiaBlue;
                ctx.beginPath(); ctx.moveTo(-15, 12); ctx.lineTo(-15, 20); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(15, 17); ctx.lineTo(15, 25); ctx.stroke();
                
                ctx.fillStyle = neonBoots;
                ctx.beginPath(); ctx.roundRect(-20, 20, 10, 8, 3); ctx.fill();
                ctx.beginPath(); ctx.roundRect(10, 25, 10, 8, 3); ctx.fill();

                ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -75, 14, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(0, -79, 14, 0, Math.PI); ctx.fill();
            } else {
                const bounce = Math.abs(Math.sin(simTime * 0.005)) * 5;
                ctx.translate(0, -bounce);
                
                ctx.fillStyle = indiaBlue; 
                ctx.fillRect(-16, -65, 32, 40);
                ctx.fillStyle = flagOrange; ctx.fillRect(-16, -48, 32, 4);
                ctx.fillStyle = flagWhite;  ctx.fillRect(-16, -44, 32, 4);
                ctx.fillStyle = flagGreen;  ctx.fillRect(-16, -40, 32, 4);
                
                ctx.lineWidth = 10;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#fca5a5'; 
                ctx.beginPath(); ctx.moveTo(-16, -60); ctx.lineTo(-30, -45); ctx.lineTo(-25, -20); ctx.stroke(); 
                ctx.beginPath(); ctx.moveTo(16, -60); ctx.lineTo(30, -45); ctx.lineTo(25, -20); ctx.stroke(); 
                ctx.strokeStyle = indiaBlue; 
                ctx.beginPath(); ctx.moveTo(-16, -60); ctx.lineTo(-24, -50); ctx.stroke(); 
                ctx.beginPath(); ctx.moveTo(16, -60); ctx.lineTo(24, -50); ctx.stroke(); 

                ctx.fillStyle = '#e2e8f0'; 
                ctx.beginPath(); ctx.arc(-25, -20, 8, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(25, -20, 8, 0, Math.PI*2); ctx.fill();
                
                ctx.strokeStyle = indiaBlue; 
                ctx.lineWidth = 14;
                ctx.beginPath(); ctx.moveTo(-10, -25); ctx.lineTo(-14, 0); ctx.stroke(); 
                ctx.beginPath(); ctx.moveTo(10, -25); ctx.lineTo(14, 0); ctx.stroke(); 
                ctx.strokeStyle = '#fca5a5'; 
                ctx.lineWidth = 10;
                ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, 20); ctx.stroke(); 
                ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(14, 20); ctx.stroke(); 

                ctx.fillStyle = neonBoots;
                ctx.beginPath(); ctx.roundRect(-19, 20, 10, 8, 3); ctx.fill();
                ctx.beginPath(); ctx.roundRect(9, 20, 10, 8, 3); ctx.fill();

                ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -80, 16, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(0, -84, 16, Math.PI*1.1, Math.PI*-0.1); ctx.fill();
                
                ctx.fillStyle = '#333';
                ctx.beginPath(); ctx.arc(-5, -82, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(5, -82, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.fillRect(-4, -77, 8, 1.5); 
            }
            ctx.restore();

            // ─── Swipe Trail (Aim) ───
            if (s.phase === 'aiming' && s.swipePath.length > 0) {
                const start = s.swipePath[0];
                const end = s.swipePath[s.swipePath.length - 1];
                const dist = Math.hypot(end.x - start.x, end.y - start.y);
                const powerRatio = Math.min((dist * 1.2) / 350, 1);

                let pColor = '#4ade80';
                if (powerRatio > 0.6) pColor = '#facc15';
                if (powerRatio > 0.9) pColor = '#ef4444';

                const meterWidth = 150;
                const meterX = 20;
                const meterY = CH - 40;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.roundRect(meterX, meterY, meterWidth, 16, 4);
                ctx.fill();
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
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = pColor;
                ctx.shadowBlur = 8;
                
                ctx.beginPath();
                for (let i = 0; i < s.swipePath.length; i++) {
                    const pt = s.swipePath[i];
                    if (i === 0) ctx.moveTo(pt.x, pt.y);
                    else ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // ─── Ball ───
            const bR = BALL_R * s.ballScale;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath(); ctx.ellipse(s.ballX, BALL_START_Y + 5, bR*1.2, bR*0.4, 0, 0, Math.PI*2); ctx.fill();
            
            ctx.save();
            ctx.translate(s.ballX, s.ballY);
            ctx.rotate(s.ballRotation);
            
            const ballGrad = ctx.createRadialGradient(-bR*0.3, -bR*0.3, bR*0.2, 0, 0, bR);
            ballGrad.addColorStop(0, '#ffffff');
            ballGrad.addColorStop(1, '#a3a3a3');
            ctx.fillStyle = ballGrad;
            ctx.beginPath(); ctx.arc(0, 0, bR, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = '#171717';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const dist = bR * 0.35;
                if (i===0) ctx.moveTo(Math.cos(a)*dist, Math.sin(a)*dist);
                else ctx.lineTo(Math.cos(a)*dist, Math.sin(a)*dist);
            }
            ctx.closePath(); ctx.fill();

            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5 - Math.PI / 2 + Math.PI/5;
                const dCenter = bR * 0.85;
                ctx.beginPath();
                ctx.arc(Math.cos(a)*dCenter, Math.sin(a)*dCenter, bR*0.3, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = '#171717';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a-Math.PI/5)*bR*0.35, Math.sin(a-Math.PI/5)*bR*0.35);
                ctx.lineTo(Math.cos(a)*dCenter * 0.7, Math.sin(a)*dCenter * 0.7);
                ctx.stroke();
            }

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5 * s.ballScale;
            ctx.beginPath(); ctx.arc(0, 0, bR, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // ─── Cinematic Bullet-Time effects ───
            if (isShooting || s.phase === 'result') {
                const shootElapsedReal = timestamp - s.shootRealTimeStart;
                const barHeight = Math.min(50, shootElapsedReal * 0.15); // slide in 50px black bars
                if (barHeight > 0) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, CW, barHeight);
                    ctx.fillRect(0, CH - barHeight, CW, barHeight);
                }
                
                if (isShooting) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.8, shootElapsedReal * 0.002)})`;
                    ctx.font = 'italic bold 22px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('BULLET TIME', CW - 20, CH - barHeight - 15);
                }
            }

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
        
        const pos = getPos(e);
        if (!pos) return;
        
        const dist = Math.hypot(pos.cx - s.ballX, pos.cy - s.ballY);
        if (dist > 60) return;

        e.currentTarget.setPointerCapture(e.pointerId);
        
        s.phase = 'aiming';
        s.swipePath = [{x: pos.cx, y: pos.cy}];
        setPhase('aiming');
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const s = state.current;
        if (s.phase !== 'aiming') return;
        const pos = getPos(e);
        if (pos) {
            if (s.swipePath.length < 50) {
                s.swipePath.push({x: pos.cx, y: pos.cy});
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        const s = state.current;
        if (s.phase !== 'aiming') return;
        
        if (s.swipePath.length < 2) {
            s.phase = 'idle';
            setPhase('idle');
            return;
        }

        const start = s.swipePath[0];
        const end = s.swipePath[s.swipePath.length - 1];
        
        const dx = end.x - start.x;
        const dy = end.y - start.y; 
        
        if (dy > -10) {
            s.phase = 'idle';
            setPhase('idle');
            return;
        }

        const dist = Math.hypot(dx, dy);
        s.power = Math.min(350, dist * 1.2); 
        
        if (s.power < 30) {
            s.phase = 'idle';
            setPhase('idle');
            return;
        }

        let simTargetX = end.x;
        let simTargetY = end.y;
        if (end.y > GY + GH + 20) {
            const multiplier = 1.7; 
            simTargetX = start.x + dx * multiplier;
            simTargetY = start.y + dy * multiplier;
        }

        s.targetX = simTargetX;
        s.targetY = simTargetY;

        const midPt = s.swipePath[Math.floor(s.swipePath.length / 2)];
        const straightMidX = (start.x + end.x) / 2;
        s.curveFactor = (midPt.x - straightMidX) * 2.5; 

        s.tooMuchPower = s.power > 300;
        if (s.tooMuchPower) {
            s.targetY = s.targetY - Math.random() * 80;
            s.targetX = s.targetX + (Math.random() - 0.5) * 80;
        }

        const isLeft = s.targetX < GX + GW / 2;
        const aiGuessesRight = Math.random() > 0.45; 
        
        let aiTargetX = GX + GW / 2; 
        if (aiGuessesRight) {
            aiTargetX = s.targetX + (Math.random()-0.5)*50;
        } else {
            aiTargetX = GX + GW / 2 + (isLeft ? 1 : -1) * (100 + Math.random()*150);
        }
        aiTargetX = Math.max(GX + 20, Math.min(GX + GW - 20, aiTargetX));

        let aiTargetY = GY + GH - 30; 
        if (aiGuessesRight && s.targetY < GY + GH - 40) {
            aiTargetY = s.targetY + (Math.random()-0.5)*40;
        }
        s.goalieTargetX = aiTargetX;
        s.goalieTargetY = Math.max(GY - 20, Math.min(GY + GH, aiTargetY));

        const insideGoal = s.targetX > GX + BALL_R && s.targetX < GX + GW - BALL_R && s.targetY > GY + BALL_R && s.targetY < GY + GH;
        const distToKeeper = Math.hypot(s.targetX - s.goalieTargetX, s.targetY - s.goalieTargetY);
        const savedRadius = s.power < 80 ? 120 : (s.tooMuchPower ? 50 : 80); 
        
        s.saved = distToKeeper < savedRadius; 
        s.scored = insideGoal && !s.saved;

        s.phase = 'shooting';
        setPhase('shooting');
        
        s.animStartSimTime = s.simTime;
        s.shootRealTimeStart = performance.now();
        s.resultTriggered = false;
    };

    const resetGame = () => {
        setScore({ player: 0, ai: 0 });
        setRound(0);
        setPhase('idle');
        state.current.phase = 'idle';
        state.current.swipePath = [];
        setMessage('Swipe forward from the ball to aim & bend your shot!');
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
                YOU <span className={score.player > score.ai ? 'text-green-400 font-bold' : ''}>{score.player}</span> 
                {' — '}
                <span className={score.ai > score.player ? 'text-red-400 font-bold' : ''}>{score.ai}</span> AI 
            </div>

            <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-[11px] font-mono text-accent/90">{message}</p>
                <span className="text-[11px] font-mono text-white/50 whitespace-nowrap ml-4">
                    ROUND {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
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
