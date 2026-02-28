import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface LoadingProps {
    onComplete: () => void;
}

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

const statusMessages = [
    'INITIALIZING SYSTEM...',
    'LOADING NEURAL NETWORKS...',
    'SCANNING ASSETS...',
    'COMPILING THREAT MATRIX...',
    'ASSET CLASSIFIED',
    'THREAT LEVEL: IRRELEVANT',
    'ACCESS GRANTED',
];

const Loading = ({ onComplete }: LoadingProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [percent, setPercent] = useState(0);
    const [statusIdx, setStatusIdx] = useState(0);
    const [showAccessGranted, setShowAccessGranted] = useState(false);

    // Matrix rain effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops: number[] = new Array(columns).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(180, 160, 229, 0.15)';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 35);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', resize);
        };
    }, []);

    // Loading progress simulation
    useEffect(() => {
        let current = 0;
        const interval = setInterval(() => {
            const increment = Math.random() * 8 + 2;
            current = Math.min(current + increment, 100);
            setPercent(Math.floor(current));

            // Update status messages based on progress
            if (current < 20) setStatusIdx(0);
            else if (current < 40) setStatusIdx(1);
            else if (current < 60) setStatusIdx(2);
            else if (current < 80) setStatusIdx(3);
            else if (current < 95) setStatusIdx(4);
            else setStatusIdx(5);

            if (current >= 100) {
                clearInterval(interval);
                setShowAccessGranted(true);
                setTimeout(() => {
                    // GSAP exit animation
                    if (containerRef.current) {
                        gsap.to(containerRef.current, {
                            opacity: 0,
                            duration: 0.8,
                            ease: 'power2.inOut',
                            onComplete: onComplete,
                        });
                    }
                }, 800);
            }
        }, 80);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
        >
            {/* Matrix rain canvas */}
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Scanning grid lines */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="scan-line" />
                <div className="grid-overlay" />
            </div>

            {/* Corner brackets */}
            <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-accent/40" />
            <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-accent/40" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-accent/40" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-accent/40" />

            {/* Center content */}
            <div className="relative z-10 text-center">
                {/* System label */}
                <div className="mb-8">
                    <p className="text-[10px] tracking-[0.5em] text-accent/60 uppercase mb-2 font-mono">
                        ◈ SYSTEM ACTIVE ◈
                    </p>
                </div>

                {/* Percentage */}
                <div className="relative mb-8">
                    <span className="text-7xl md:text-8xl lg:text-9xl font-black text-white font-mono loading-glitch" data-text={`${percent}`}>
                        {percent}
                    </span>
                    <span className="text-2xl md:text-3xl text-accent/60 font-mono ml-1">%</span>
                </div>

                {/* Progress bar */}
                <div className="w-64 md:w-80 h-px bg-white/10 mx-auto mb-6 relative overflow-hidden">
                    <div
                        className="h-full bg-accent transition-all duration-200 ease-out"
                        style={{ width: `${percent}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-pulse" />
                </div>

                {/* Status message */}
                <p className="text-xs tracking-[0.3em] text-muted font-mono uppercase h-4">
                    {showAccessGranted ? (
                        <span className="text-accent animate-pulse">▶ ACCESS GRANTED</span>
                    ) : (
                        statusMessages[statusIdx]
                    )}
                </p>
            </div>

            {/* Bottom data stream */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <p className="text-[9px] font-mono text-white/10 tracking-widest">
                    SYS.KERNEL.v3.7.1 // NODE.ACTIVE // ENCRYPT.AES256 // UPLINK.STABLE
                </p>
            </div>
        </div>
    );
};

export default Loading;
