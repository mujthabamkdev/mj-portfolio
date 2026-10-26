import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import BeeGraphic from './BeeGraphic';
import type { BeeLaunchOrigin } from './Bee';

interface BeeLaunchTransitionProps {
    origin: BeeLaunchOrigin;
    onComplete: () => void;
}

const BeeLaunchTransition = ({ origin, onComplete }: BeeLaunchTransitionProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const navigate = useNavigate();
    const navigateRef = useRef(navigate);

    useEffect(() => {
        navigateRef.current = navigate;
    }, [navigate]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        root.focus({ preventScroll: true });
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const context = gsap.context(() => {
            const stage = root.querySelector('.bee-launch-swarm');
            const parts = Array.from(root.querySelectorAll<SVGGElement>('.bee-part'));
            const clock = { progress: 0 };
            const timeline = gsap.timeline();
            gsap.set(stage, { xPercent: -50, yPercent: -50 });

            if (!reducedMotion) {
                timeline.to('.bee-launch-backdrop', { opacity: 1, duration: 0.4 }, 0);
                timeline.to(stage, {
                    left: window.innerWidth / 2,
                    top: window.innerHeight * 0.4,
                    scale: 2.7,
                    duration: 0.7,
                    ease: 'power2.inOut',
                }, 0);
                timeline.call(() => { root.dataset.phase = 'split'; }, [], 0.65);
                const offsets: Record<string, [number, number, number]> = {
                    abdomen: [-42, 18, -35], thorax: [0, 10, 15], head: [38, -8, 30],
                    antenna: [30, -40, 50], legs: [0, 42, -20],
                    'wing-left': [-35, -35, -40], 'wing-right': [16, -48, 45],
                };
                parts.forEach(part => {
                    const [x, y, rotation] = offsets[part.dataset.part ?? ''] ?? [0, 0, 0];
                    timeline.to(part, { x, y, rotation, duration: 0.45, ease: 'power2.out' }, 0.7);
                });
                timeline.to(parts, { opacity: 0, scale: 0.4, duration: 0.35 }, 1.12);
                timeline.call(() => { root.dataset.phase = 'burst'; }, [], 1.15);
                // Defer both effects until the burst; fromTo otherwise shows
                // the shockwave immediately, creating a second visible flash.
                timeline.fromTo('.bee-launch-bloom', { scale: 0.1, opacity: 0 }, {
                    scale: Math.max(window.innerWidth, window.innerHeight) / 120,
                    opacity: 0.95, duration: 0.55, ease: 'power2.out', immediateRender: false,
                }, 1.15);
                timeline.fromTo('.bee-launch-shockwave', { scale: 0.1, opacity: 0.8 }, {
                    scale: 5, opacity: 0, duration: 0.8, ease: 'power2.out', immediateRender: false,
                }, 1.15);
                timeline.to('.bee-launch-bloom', { opacity: 0, duration: 0.55 }, 1.7);
            } else {
                gsap.set(stage, { opacity: 0 });
                gsap.set('.bee-launch-backdrop', { opacity: 1 });
            }

            const loadAt = reducedMotion ? 0.1 : 2.25;
            timeline.call(() => {
                root.dataset.phase = 'loading';
                navigateRef.current('/play');
            }, [], loadAt);
            timeline.to('.bee-launch-loader', { opacity: 1, duration: 0.2 }, loadAt);
            timeline.to(clock, {
                progress: 100,
                duration: reducedMotion ? 0.6 : 1,
                ease: 'power1.inOut',
                onUpdate: () => setProgress(Math.round(clock.progress)),
            }, loadAt);
            timeline.to(root, { opacity: 0, duration: reducedMotion ? 0.15 : 0.35 }, loadAt + (reducedMotion ? 0.8 : 1.25));
            timeline.call(onComplete);
        }, root);

        return () => {
            context.revert();
            document.body.style.overflow = previousOverflow;
        };
    }, [origin, onComplete]);

    return (
        <div ref={rootRef} className="bee-launch-transition" data-phase="charge" role="status" aria-label="Opening Play" tabIndex={-1}>
            <div className="bee-launch-backdrop" />
            <div className="bee-launch-swarm bee-flying bee-buzzing" style={{ left: origin.x, top: origin.y }} aria-hidden="true">
                <BeeGraphic />
            </div>
            <div className="bee-launch-shockwave" aria-hidden="true" />
            <div className="bee-launch-bloom" aria-hidden="true" />
            <div className="bee-launch-loader">
                <svg className="bee-launch-hive" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                    <path d="M60 8 L105 34 V86 L60 112 L15 86 V34Z" stroke="currentColor" strokeOpacity="0.25" />
                    <path d="M60 26 L89 43 V77 L60 94 L31 77 V43Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M60 42 L76 51 V69 L60 78 L44 69 V51Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" />
                </svg>
                <p className="bee-launch-kicker">HIVE LINK ESTABLISHED</p>
                <h2>INITIALIZING PLAY</h2>
                <div className="bee-launch-progress" role="progressbar" aria-label="Play loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                    <span style={{ transform: `scaleX(${progress / 100})` }} />
                </div>
                <p className="bee-launch-percent">{progress}%</p>
                <p className="bee-launch-caption">{progress === 100 ? 'ARENA READY — LET’S PLAY' : 'ASSEMBLING YOUR PLAY ARENA'}</p>
            </div>
        </div>
    );
};

export default BeeLaunchTransition;
