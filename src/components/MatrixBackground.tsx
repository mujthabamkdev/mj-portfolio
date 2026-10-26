import { useEffect, useRef } from 'react';

const CODE_SNIPPETS = [
    'const user = await fetch("/api/auth");',
    'SELECT * FROM users WHERE active=1;',
    'docker build -t app:latest .',
    '@SpringBootApplication',
    'kubectl apply -f deploy.yaml',
    'git commit -m "feat: add AI"',
    'npm run build && vercel --prod',
    'Promise.all([fetchData(), loadConfig()])',
    'public class PaymentService {',
    'interface Repository<T, ID>',
    '@Override public void execute()',
    'return ResponseEntity.ok(result);',
    '> training model... 94.3% accuracy',
    '> SYSTEM :: SCAN COMPLETE',
    '> AI.init() :: READY',
];

interface CodeBlock {
    x: number;
    y: number;
    text: string;
    opacity: number;
    driftY: number;
    size: number;
}

const MatrixBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let frame = 0;

        // ─── Canvas size ───
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        // ─── Floating code snippets ───
        const makeBlock = (): CodeBlock => ({
            x: 80 + Math.random() * (window.innerWidth - 300),
            y: 80 + Math.random() * (window.innerHeight - 100),
            text: CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)],
            opacity: 0.04 + Math.random() * 0.08,
            driftY: (Math.random() - 0.5) * 0.2,
            size: 10 + Math.floor(Math.random() * 4),
        });
        const codeBlocks: CodeBlock[] = Array.from({ length: 4 }, makeBlock);

        // ─── Scan line ───
        let scanY = 0;

        const draw = () => {
            frame++;
            const W = canvas.width;
            const H = canvas.height;

            // Semi-transparent clear (trail effect)
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.fillRect(0, 0, W, H);

            // ─── Floating code snippets ───
            if (frame % 300 === 0) {
                // Refresh a random code block
                const ri = Math.floor(Math.random() * codeBlocks.length);
                Object.assign(codeBlocks[ri], makeBlock());
            }
            codeBlocks.forEach((block) => {
                block.y += block.driftY;
                if (block.y > window.innerHeight + 40) block.y = -20;
                ctx.font = `${block.size}px 'Courier New', monospace`;
                ctx.fillStyle = `rgba(140,120,210,${block.opacity})`;
                ctx.fillText(block.text, block.x, block.y);
            });

            // ─── Scan line ───
            scanY = (scanY + 0.6) % H;
            const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
            scanGrad.addColorStop(0, 'rgba(160,120,255,0)');
            scanGrad.addColorStop(0.5, 'rgba(160,120,255,0.04)');
            scanGrad.addColorStop(1, 'rgba(160,120,255,0)');
            ctx.fillStyle = scanGrad;
            ctx.fillRect(0, scanY - 30, W, 60);

            // ─── Corner HUD elements ───
            if (frame % 60 < 50) { // blink
                ctx.font = '9px monospace';
                ctx.fillStyle = 'rgba(120,200,120,0.25)';
                ctx.textAlign = 'right';
                ctx.fillText(`SYS.ONLINE :: ${new Date().toLocaleTimeString()}`, W - 16, H - 40);
                ctx.fillText(`AI.MONITOR :: ACTIVE`, W - 16, H - 26);
                ctx.fillText(`PKT.TRACK :: 0x${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0')}`, W - 16, H - 12);
                ctx.textAlign = 'left';
                ctx.fillStyle = 'rgba(120,200,120,0.2)';
                ctx.fillText(`> LOADING PROFILE...`, 16, H - 40);
                const performanceMemory = (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize ?? 0;
ctx.fillText(`> MEM: ${performanceMemory > 0 ? Math.round(performanceMemory / 1e6) : '?'} MB`, 16, H - 26);
                ctx.fillText(`> THREADS: ACTIVE`, 16, H - 12);
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="matrix-bg"
            aria-hidden="true"
        />
    );
};

export default MatrixBackground;
