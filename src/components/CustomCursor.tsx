import { useEffect, useRef } from 'react';

const CustomCursor = () => {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const pos = useRef({ x: 0, y: 0 });
    const ringPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Hide default cursor
        document.body.style.cursor = 'none';

        const onMouseMove = (e: MouseEvent) => {
            pos.current = { x: e.clientX, y: e.clientY };
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
            }
        };

        // Trailing ring with spring
        let raf: number;
        const animate = () => {
            ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.15;
            ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.15;
            if (ringRef.current) {
                ringRef.current.style.transform = `translate(${ringPos.current.x - 20}px, ${ringPos.current.y - 20}px)`;
            }
            raf = requestAnimationFrame(animate);
        };
        animate();

        // Hover expand on interactive elements
        const onMouseOver = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.closest('a, button, [role="button"], .interactive')) {
                ringRef.current?.classList.add('cursor-hover');
                dotRef.current?.classList.add('cursor-hover');
            }
        };
        const onMouseOut = () => {
            ringRef.current?.classList.remove('cursor-hover');
            dotRef.current?.classList.remove('cursor-hover');
        };

        window.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseover', onMouseOver);
        document.addEventListener('mouseout', onMouseOut);

        return () => {
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseover', onMouseOver);
            document.removeEventListener('mouseout', onMouseOut);
            cancelAnimationFrame(raf);
        };
    }, []);

    // Don't show on mobile
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return null;

    return (
        <>
            <div ref={dotRef} className="cursor-dot" />
            <div ref={ringRef} className="cursor-ring" />
        </>
    );
};

export default CustomCursor;
