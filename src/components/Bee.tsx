import { useEffect, useRef, useState } from 'react';
import BeeGraphic from './BeeGraphic';

export interface BeeLaunchOrigin { x: number; y: number }

interface BeeProps {
    onLaunch: (origin: BeeLaunchOrigin) => void;
}

// Elliptical shell slices keep the body rounded through the entire turn,
// including edge-on, rather than flipping a pair of flat SVG cards.
const bodySlices = Array.from({ length: 33 }, (_, i) => {
    const z = (i - 16) * 0.5;
    return { transform: `translateZ(${z}px) scale(${Math.sqrt(1 - (z / 10) ** 2)})` };
});

/**
 * Electronic bee companion.
 * - Perches on the active section header while it's on screen
 * - Wanders around the viewport when no header is visible
 * Replaces the 3D shadow character.
 */
const Bee = ({ onLaunch }: BeeProps) => {
    const beeRef = useRef<HTMLButtonElement>(null);
    const visualRef = useRef<HTMLSpanElement>(null);
    const interaction = useRef({ pressed: false, launching: false, lastTap: 0, taps: 0, buzzUntil: 0 });
    const holdTimer = useRef<number>();
    const resetTimer = useRef<number>();
    const buzzTimer = useRef<number>();
    const pulse = useRef<Animation | null>(null);
    const [buzzing, setBuzzing] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [taps, setTaps] = useState(0);
    const sim = useRef({
        x: -200,
        y: -200,
        init: false,
        dir: 1,
        vx: 0,
        vy: 0,
        tilt: 0,
        yaw: 0,
        pitch: -8,
        roamTime: 0,
        roamX: 0,
        roamY: 0,
        roamUntil: 0,
        flying: true,
        targetHeading: null as Element | null,
    });
    const [flying, setFlying] = useState(true);

    const buzz = () => {
        interaction.current.buzzUntil = performance.now() + 700;
        setBuzzing(true);
        clearTimeout(buzzTimer.current);
        buzzTimer.current = window.setTimeout(() => {
            if (!interaction.current.pressed) setBuzzing(false);
        }, 700);
        pulse.current?.cancel();
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && visualRef.current) {
            pulse.current = visualRef.current.animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.3 }, { transform: 'scale(1)' }],
                { duration: 550, easing: 'ease-out' }
            );
        }
    };

    const launch = () => {
        if (interaction.current.launching || !beeRef.current) return;
        interaction.current.launching = true;
        clearTimeout(holdTimer.current);
        clearTimeout(resetTimer.current);
        const rect = beeRef.current.getBoundingClientRect();
        setLaunching(true);
        onLaunch({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };

    const beginPress = () => {
        if (interaction.current.pressed || interaction.current.launching) return;
        interaction.current.pressed = true;
        buzz();
        holdTimer.current = window.setTimeout(launch, 1100);
    };

    const endPress = () => {
        interaction.current.pressed = false;
        clearTimeout(holdTimer.current);
        if (performance.now() >= interaction.current.buzzUntil) setBuzzing(false);
    };

    const handleClick = () => {
        if (interaction.current.launching) return;
        const now = performance.now();
        interaction.current.taps = now - interaction.current.lastTap < 1000 ? interaction.current.taps + 1 : 1;
        interaction.current.lastTap = now;
        setTaps(interaction.current.taps);
        clearTimeout(resetTimer.current);
        if (interaction.current.taps >= 3) {
            launch();
            return;
        }
        buzz();
        resetTimer.current = window.setTimeout(() => {
            interaction.current.taps = 0;
            setTaps(0);
        }, 1000);
    };

    useEffect(() => () => {
        clearTimeout(holdTimer.current);
        clearTimeout(resetTimer.current);
        clearTimeout(buzzTimer.current);
        pulse.current?.cancel();
    }, []);

    useEffect(() => {
        let raf = 0;
        let lastTime = 0;
        let lastScrollY = window.scrollY;
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const nav = document.querySelector('header');
        const heads = Array.from(document.querySelectorAll('#hero h1, section h2')).map(h => {
            const range = document.createRange();
            range.selectNodeContents(h);
            return { element: h, range };
        });

        const step = (now: number) => {
            raf = 0;
            const b = beeRef.current;
            if (!b) return;
            const st = sim.current;
            // Keep the hit target still during rapid taps or a long press.
            if (interaction.current.pressed || interaction.current.launching || interaction.current.buzzUntil > now) {
                lastTime = now;
                lastScrollY = window.scrollY;
                st.vx = 0;
                st.vy = 0;
                if (!motion.matches) raf = requestAnimationFrame(step);
                return;
            }
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            if (!st.init) {
                st.x = vw * 0.78;
                st.y = vh * 0.45;
                st.init = true;
            }
            const dt = Math.min((now - (lastTime || now - 16.67)) / 1000, 0.05);
            lastTime = now;
            const scrollDelta = window.scrollY - lastScrollY;
            lastScrollY = window.scrollY;
            const topSafe = (nav?.getBoundingClientRect().bottom ?? 68) + 56;

            // A text range avoids anchoring to the full-width heading block.
            // Use the first text line, so wrapped mobile headings work too.
            type HeadingTarget = { element: Element; x: number; y: number; d: number };
            let best: HeadingTarget | null = null;
            let currentTarget: HeadingTarget | null = null;
            for (const { element, range } of heads) {
                const r = element.getBoundingClientRect();
                if (!r.width || r.top < topSafe || r.top > vh - 24) continue;
                const text = Array.from(range.getClientRects()).find(rect => rect.width > 1 && rect.height > 1);
                if (!text) continue;
                const d = Math.abs(r.top - vh * 0.35);
                const candidate = {
                    element,
                    x: text.right - Math.min(32, text.width * 0.18),
                    y: r.top + Math.min(12, r.height * 0.12),
                    d,
                };
                if (element === st.targetHeading) currentTarget = candidate;
                if (!best || d < best.d) best = candidate;
            }
            // Keep the current heading until another is clearly nearer.
            if (currentTarget && best && currentTarget.d < best.d + 70) best = currentTarget;
            const leavingHeading = !best && st.targetHeading !== null;
            st.targetHeading = best?.element ?? null;

            let tx: number;
            let ty: number;
            if (best) {
                tx = best.x;
                ty = best.y;
            } else {
                // Pick a fresh destination on departure and throughout free
                // flight. A paused, shared orbit always pulls departures back
                // towards the same side of the page.
                if (!motion.matches) st.roamTime += dt;
                const t = st.roamTime;
                const left = Math.min(60, vw / 2);
                const right = Math.max(left, vw - 60);
                const bottom = Math.max(topSafe, vh - 48);
                const minDistance = Math.min(180, Math.hypot(right - left, bottom - topSafe) * 0.35);
                if (!motion.matches && (leavingHeading || now >= st.roamUntil
                    || Math.hypot(st.roamX - st.x, st.roamY - st.y) < 45
                    || st.roamX > right || st.roamY > bottom)) {
                    for (let attempt = 0; attempt < 8; attempt++) {
                        st.roamX = left + Math.random() * (right - left);
                        st.roamY = topSafe + Math.random() * (bottom - topSafe);
                        if (Math.hypot(st.roamX - st.x, st.roamY - st.y) >= minDistance) break;
                    }
                    st.roamUntil = now + 4500 + Math.random() * 2500;
                }
                tx = motion.matches ? st.x : st.roamX + Math.sin(t * 1.3) * 16;
                ty = motion.matches ? st.y : st.roamY + Math.sin(t * 1.7) * 12
                    - Math.max(-16, Math.min(16, scrollDelta * 0.25));
            }

            tx = Math.max(38, Math.min(vw - 38, tx));
            ty = Math.max(topSafe, Math.min(vh - 12, ty));

            const dx = tx - st.x;
            // A shallow lift makes section changes arc into a soft landing.
            const lift = !motion.matches && best ? Math.min(36, Math.abs(dx) * 0.12) : 0;
            const dy = Math.max(topSafe, ty - lift) - st.y;
            if (motion.matches) {
                st.x = tx;
                st.y = ty;
                st.vx = 0;
                st.vy = 0;
            } else {
                // Smooth acceleration and a speed cap prevent long-distance
                // jumps, including when a perched heading suddenly scrolls.
                const distance = Math.hypot(dx, dy);
                const maxSpeed = best ? (vw < 768 ? 210 : 280) : (vw < 768 ? 90 : 130);
                const speed = Math.min(maxSpeed, distance * 2);
                const blend = 1 - Math.exp(-dt * 8);
                st.vx += ((distance ? dx / distance * speed : 0) - st.vx) * blend;
                st.vy += ((distance ? dy / distance * speed : 0) - st.vy) * blend;
                st.x += st.vx * dt;
                st.y += st.vy * dt;
            }
            const seated = !!best && Math.hypot(tx - st.x, ty - st.y) < 1.5 && Math.hypot(st.vx, st.vy) < 8;
            if (seated) {
                st.x = tx;
                st.y = ty;
                st.vx = 0;
                st.vy = 0;
            }

            const facing = motion.matches ? dx : st.vx;
            if (Math.abs(facing) > (motion.matches ? 3 : 18)) st.dir = facing > 0 ? 1 : -1;

            const tilt = seated || motion.matches
                ? 0
                : Math.max(-14, Math.min(14, -st.vy * 0.07));
            const turnBlend = motion.matches ? 1 : 1 - Math.exp(-dt * 6);
            st.tilt += (tilt - st.tilt) * turnBlend;
            st.yaw += ((st.dir === 1 ? 0 : 180) - st.yaw) * turnBlend;
            const pitch = motion.matches ? 0 : -8
                + Math.sin(st.yaw * Math.PI / 180) * 12
                + Math.max(-6, Math.min(6, st.vy * 0.03));
            st.pitch += (pitch - st.pitch) * turnBlend;

            // Bottom of the feet (SVG y=46) is the landing anchor.
            // Keep the hit target flat; rotate only the layered bee artwork.
            b.style.transform = `translate3d(${st.x - 34}px, ${st.y - 46}px, 0) rotate(${st.tilt}deg)`;
            b.style.setProperty('--bee-yaw', `${st.yaw}deg`);
            b.style.setProperty('--bee-pitch', `${st.pitch}deg`);
            b.dataset.mode = seated ? 'perch' : 'fly';
            b.dataset.heading = best?.element.closest('section')?.id ?? '';

            if (st.flying !== !seated) {
                st.flying = !seated;
                setFlying(!seated);
            }
            if (!motion.matches) raf = requestAnimationFrame(step);
        };
        const schedule = () => {
            if (!raf) raf = requestAnimationFrame(step);
        };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        motion.addEventListener('change', schedule);
        const resize = new ResizeObserver(schedule);
        heads.forEach(({ element }) => resize.observe(element));
        raf = requestAnimationFrame(step);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            motion.removeEventListener('change', schedule);
            resize.disconnect();
        };
    }, []);

    return (
        <button
            ref={beeRef}
            type="button"
            aria-label="Electronic bee — click to buzz, click three times or hold to open Play"
            title="Click to buzz · 3 quick clicks or hold to open Play"
            disabled={launching}
            onClick={handleClick}
            onPointerDown={e => {
                if (!e.isPrimary || e.button !== 0) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                beginPress();
            }}
            onPointerUp={endPress}
            onPointerCancel={endPress}
            onLostPointerCapture={endPress}
            onContextMenu={e => e.preventDefault()}
            onKeyDown={e => {
                if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) beginPress();
            }}
            onKeyUp={endPress}
            onBlur={endPress}
            className={`electronic-bee fixed z-[40] top-0 left-0 will-change-transform ${flying ? 'bee-flying' : 'bee-sitting'} ${buzzing ? 'bee-buzzing' : ''} ${launching ? 'bee-launching' : ''}`}
            style={{ width: 68, height: 52, transform: 'translate3d(-200px, -200px, 0)' }}
        >
            <span ref={visualRef} className="bee-interactive-visual">
                <span className="bee-glow" aria-hidden="true" />
                <span className="bee-orientation" aria-hidden="true">
                    {['abdomen', 'thorax', 'head'].map(part => (
                        <span key={part} className={`bee-depth bee-depth-${part}`}>
                            {bodySlices.map((style, i) => <span key={i} className="bee-depth-slice" style={style} />)}
                        </span>
                    ))}
                    <span className="bee-depth-wing bee-depth-wing-near" />
                    <span className="bee-depth-wing bee-depth-wing-far" />
                    <span className="bee-face bee-face-front"><BeeGraphic /></span>
                    <span className="bee-face bee-face-back"><BeeGraphic /></span>
                </span>
            </span>
            <span className="sr-only" aria-live="polite">{taps ? `Charge ${taps} of 3` : ''}</span>
        </button>
    );
};

export default Bee;
