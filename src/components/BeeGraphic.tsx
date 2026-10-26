import { useId, type SVGProps } from 'react';

/** Shared articulated artwork for the companion and its launch sequence. */
const BeeGraphic = (props: SVGProps<SVGSVGElement>) => {
    const id = useId();
    const shell = `${id}-shell`;
    const wing = `${id}-wing`;

    return (
        <svg width="68" height="52" viewBox="0 0 68 52" fill="none" aria-hidden="true" {...props}>
            <defs>
                <linearGradient id={shell} x1="12" y1="19" x2="43" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e4d8fc" />
                    <stop offset="0.45" stopColor="#b4a0e5" />
                    <stop offset="1" stopColor="#332443" />
                </linearGradient>
                <linearGradient id={wing} x2="0" y2="1">
                    <stop stopColor="#e4dcff" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#b4a0e5" stopOpacity="0.12" />
                </linearGradient>
            </defs>

            <g className="bee-part" data-part="legs">
                <path className="bee-legs" d="M24 37 L21 43 L17 46 H24 M36 39 L36 44 L32 46 H39 M44 36 L49 43 L46 46 H53" stroke="#b4a0e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* A tapered abdomen with curved segments, not a triangular tail. */}
            <g className="bee-part bee-tail" data-part="abdomen">
                <path d="M32 19 C24 17 16 20 11 25 C8 28 8 31 12 34 C17 39 25 41 33 38 C39 35 40 24 32 19Z" fill={`url(#${shell})`} stroke="#5b466d" strokeWidth="0.8" />
                <path d="M17 21 Q11 29 18 38 M24 19 Q18 29 25 40 M31 19 Q26 29 32 39" stroke="#241c30" strokeWidth="3" />
                <path d="M11 30 Q5 30 2 34 Q7 33 12 32" fill="#c5c9d4" stroke="#969aaa" strokeWidth="0.5" />
                <path d="M18 22 Q24 19 29 21" stroke="#f2eaff" strokeWidth="0.8" strokeLinecap="round" opacity="0.65" />
                <circle cx="24" cy="25" r="1.3" fill="#67e8f9" className="bee-eye" />
                <circle cx="17" cy="31" r="1" fill="#b4a0e5" />
            </g>

            <g className="bee-part" data-part="thorax">
                <ellipse cx="39" cy="29" rx="9.5" ry="10.5" fill={`url(#${shell})`} stroke="#8b6fd4" strokeWidth="0.8" />
                <path d="M38 21 L38 25 L42 28 L42 34" stroke="#655085" strokeWidth="1" />
                <circle cx="39" cy="29" r="2.2" fill="#a78bfa" className="bee-eye" />
            </g>

            <g className="bee-part" data-part="head">
                <circle cx="51" cy="29" r="8" fill="#131022" stroke="#8b6fd4" strokeWidth="0.8" />
                <circle cx="53.5" cy="26.5" r="2" fill="#4ade80" className="bee-eye bee-eye-strong" />
                <circle cx="53.5" cy="31.5" r="2" fill="#4ade80" className="bee-eye bee-eye-strong" />
            </g>
            <g className="bee-part" data-part="antenna">
                <path d="M50 21 Q49 15 44 13.5 M54 22 Q58 17 60 17" stroke="#c8b8ee" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="43.5" cy="13" r="1.6" fill="#f59e0b" className="bee-eye" />
                <circle cx="60" cy="17" r="1.3" fill="#b4a0e5" />
            </g>

            <g className="bee-part" data-part="wing-left">
                <g className="bee-wing bee-wing-l">
                    <ellipse cx="27" cy="13" rx="12" ry="6.5" fill={`url(#${wing})`} stroke="#c7baf0" strokeOpacity="0.5" />
                    <path d="M18 13 L36 13 M24 9 L29 17 M29 9 L33 15" stroke="#eee7ff" strokeOpacity="0.4" strokeWidth="0.6" />
                </g>
            </g>
            <g className="bee-part" data-part="wing-right">
                <g className="bee-wing bee-wing-r">
                    <ellipse cx="29" cy="9" rx="10" ry="5.5" fill={`url(#${wing})`} stroke="#c7baf0" strokeOpacity="0.4" transform="rotate(-14 29 9)" />
                </g>
            </g>
        </svg>
    );
};

export default BeeGraphic;
