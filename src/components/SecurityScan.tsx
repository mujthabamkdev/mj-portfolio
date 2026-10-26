import { useState, useEffect, useRef } from 'react';

interface SecurityScanProps {
    onProceed: () => void;
}

const EMAIL = 'mujthabamkdev@gmail.com';

type ScanRow = { label: string; value: string };

const fetchWithTimeout = (url: string, ms: number): Promise<Response> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
};

const collectScan = async (): Promise<ScanRow[]> => {
    const rows: ScanRow[] = [];
    const n = navigator as Navigator & {
        userAgentData?: { platform?: string; brands?: { brand: string; version: string }[] };
        deviceMemory?: number;
        connection?: { effectiveType?: string; downlink?: number };
        getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };

    // OS / platform
    const ua = n.userAgent;
    const os =
        /Windows NT 10/.test(ua) ? 'Windows 10/11' :
        /Windows/.test(ua) ? 'Windows' :
        /Mac OS X/.test(ua) ? (ua.match(/Mac OS X ([\d_]+)/)?.[1] ?? 'macOS').replace(/_/g, '.') :
        /Android/.test(ua) ? `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ''}` :
        /iPhone|iPad/.test(ua) ? `iOS ${ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? ''}` :
        /Linux/.test(ua) ? 'Linux' : 'Unknown OS';

    // Browser
    const browser =
        /Edg\//.test(ua) ? `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1]?.split('.')[0] ?? ''}` :
        /OPR\//.test(ua) ? `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1]?.split('.')[0] ?? ''}` :
        /Chrome\//.test(ua) ? `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1]?.split('.')[0] ?? ''}` :
        /Firefox\//.test(ua) ? `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1]?.split('.')[0] ?? ''}` :
        /Safari\//.test(ua) ? `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ''}` : 'Unknown browser';

    rows.push({ label: 'DEVICE/OS', value: `${os} · ${browser} · ${n.platform || '—'}` });
    rows.push({ label: 'USER AGENT', value: ua.replace(/\((.*?)\)/, '').trim().slice(0, 60) });

    // Screen / display
    const gamut = (window.matchMedia('(color-gamut: p3)').matches && 'P3') ||
        (window.matchMedia('(color-gamut: srgb)').matches && 'sRGB') || 'unknown';
    rows.push({
        label: 'DISPLAY',
        value: `${screen.width}×${screen.height} @${window.devicePixelRatio}x · ${screen.colorDepth}-bit · ${gamut}`,
    });

    // Locale / timezone
    let tzOffset = '—';
    try {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const off = -new Date().getTimezoneOffset() / 60;
        tzOffset = `${zone} (GMT${off >= 0 ? '+' : ''}${off})`;
    } catch { /* noop */ }
    rows.push({ label: 'LOCALE/TZ', value: `${n.language || '—'} · ${tzOffset} · ${new Date().toLocaleString()}` });

    // Hardware
    const cores = n.hardwareConcurrency ?? '—';
    const mem = n.deviceMemory ? `~${n.deviceMemory}GB RAM` : '—';
    rows.push({ label: 'HARDWARE', value: `${cores} CPU cores · ${mem}` });

    // Network
    const conn = n.connection;
    rows.push({
        label: 'NETWORK',
        value: conn?.effectiveType ? `${conn.effectiveType.toUpperCase()}${conn.downlink ? ` · ~${conn.downlink}Mbps` : ''}` : 'unknown',
    });

    // GPU
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
        if (gl) {
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : 'masked';
            rows.push({ label: 'GPU', value: renderer.slice(0, 80) });
        }
    } catch { /* noop */ }

    // Battery (best effort)
    if (n.getBattery) {
        try {
            const b = await n.getBattery();
            rows.push({ label: 'BATTERY', value: `${Math.round(b.level * 100)}% · ${b.charging ? 'charging' : 'discharging'}` });
        } catch { /* noop */ }
    }

    // Geo (best effort, graceful fallback)
    let geo = 'unavailable';
    try {
        const res = await fetchWithTimeout('https://ipapi.co/json/', 3000);
        if (res.ok) {
            const j = await res.json();
            geo = `${j.city || '?'}, ${j.country_name || '?'} · ${j.ip || '?'} · ${j.latitude?.toFixed(2) ?? '?'}, ${j.longitude?.toFixed(2) ?? '?'}`;
        }
    } catch { /* offline / blocked */ }
    rows.push({ label: 'LOCATION*IP', value: geo });

    // Input / touch
    rows.push({ label: 'INPUT', value: `touch points: ${n.maxTouchPoints || 0} · cookies: ${n.cookieEnabled ? 'on' : 'off'}` });

    return rows;
};

const SecurityScan = ({ onProceed }: SecurityScanProps) => {
    const [rows, setRows] = useState<ScanRow[]>([]);
    const [typedCount, setTypedCount] = useState(0);
    const [verdictDone, setVerdictDone] = useState(false);
    const [declined, setDeclined] = useState(false);
    const startedRef = useRef(false);

    const VERDICT = '⚠ SECURITY ANALYSIS COMPLETE — seems like you are NOT secured and needs a professional help.';
    const totalChars = rows.reduce((acc, r) => acc + r.label.length + r.value.length + 4, 0);
    const rowsTypedCount = Math.min(typedCount, totalChars);

    // Collect info once (StrictMode-safe)
    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        collectScan().then(setRows).catch(() => setRows([{ label: 'SCAN', value: 'partial — some sensors refused' }]));
    }, []);

    // Typewriter over rows
    useEffect(() => {
        if (rows.length === 0 || verdictDone) return;
        if (typedCount >= totalChars) {
            const verdictDelay = window.setTimeout(() => setVerdictDone(true), 500);
            return () => clearTimeout(verdictDelay);
        }
        const t = window.setTimeout(() => setTypedCount(c => c + 3), 24);
        return () => clearTimeout(t);
    }, [rows, typedCount, totalChars, verdictDone]);

    const verdict = typedCount >= totalChars && rows.length > 0;
    const showButtons = verdictDone;

    if (declined) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
                <div className="relative w-[92%] max-w-lg border border-white/10 bg-[#050505]/95 rounded-xl p-8 text-center overflow-hidden shadow-2xl">
                    <div className="scan-line" />
                    <div className="text-5xl mb-4">👋</div>
                    <h1 className="font-mono text-2xl text-white mb-4 tracking-wider">GOODBYE, VISITOR.</h1>
                    <p className="font-mono text-sm text-muted leading-relaxed mb-6">
                        No hard feelings — the door stays open.<br />
                        <span className="text-white/90">Remember my email in case you are in need:</span>
                    </p>
                    <p className="font-mono text-accent text-base tracking-wide select-text break-all mb-6">{EMAIL}</p>
                    <a
                        href={`mailto:${EMAIL}`}
                        className="inline-block w-full bg-accent hover:bg-accent/80 transition-colors text-dark rounded py-3 font-bold tracking-widest text-sm"
                    >
                        ✉ CONTACT ME
                    </a>
                    <p className="font-mono text-[10px] text-white/30 mt-6">* your scan data stayed on your device. nothing left the browser.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xl px-4">
            <div className="grid-overlay pointer-events-none" />
            <div className="relative w-[94%] max-w-xl border border-accent/20 bg-[#050505]/95 rounded-xl overflow-hidden shadow-2xl">
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/60">
                    <span className="font-mono text-[11px] text-accent tracking-widest">◉ DEEP SCAN — VISITOR PROFILE</span>
                    <span className="font-mono text-[10px] text-white/40 flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500/70 inline-block" />
                        <span className="w-2 h-2 rounded-full bg-yellow-500/70 inline-block" />
                        <span className="w-2 h-2 rounded-full bg-green-500/70 inline-block" />
                    </span>
                </div>

                <div className="scan-line" />

                {/* Scan output */}
                <div className="px-5 py-4 font-mono text-[12px] leading-relaxed text-white/85 min-h-[320px] max-h-[55vh] overflow-y-auto">
                    <p className="text-accent mb-2">&gt; intercepting visitor signals... done.</p>
                    {rows.length > 0 && (
                        <div>
                            {rows.map((r, i) => {
                            const before = rows.slice(0, i).reduce((acc, p) => acc + p.label.length + p.value.length + 4, 0);
                            const budget = rowsTypedCount - before;
                            if (budget <= 0) return null;
                            const label = r.label;
                            const value = r.value.slice(0, Math.max(0, budget));
                            if (!value) return null;
                            return (
                                <p key={r.label} className="whitespace-pre-wrap break-all">
                                    <span className="text-accent">[{label.padEnd(13, ' ')}]</span>{' '}
                                    <span>{value}</span>
                                </p>
                            );
                        })}
                        </div>
                    )}

                    {verdict && (
                        <p className="mt-3 text-amber-400/70">&gt; computing risk profile{rowsTypedCount - totalChars > 0 ? '...' : ''}</p>
                    )}
                </div>

                {/* Verdict + buttons */}
                <div className="px-5 pb-5">
                    {verdict && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-4">
                            <p className="font-mono text-[13px] text-amber-300 leading-snug">
                                {VERDICT.slice(0, Math.min(VERDICT.length, Math.max(0, rowsTypedCount - totalChars) * 3))}
                            </p>
                        </div>
                    )}
                    {showButtons ? (
                        <div className="flex gap-3">
                            <button
                                onClick={onProceed}
                                className="flex-1 bg-accent hover:bg-accent/80 transition-colors text-dark rounded py-3 font-bold tracking-widest text-sm"
                            >
                                YES, HELP ME →
                            </button>
                            <button
                                onClick={() => setDeclined(true)}
                                className="flex-1 border border-white/20 hover:border-accent/60 hover:text-accent hover:bg-accent/5 transition-colors text-white/70 rounded py-3 font-bold tracking-widest text-sm"
                            >
                                NO, BYE
                            </button>
                        </div>
                    ) : (
                        <p className="font-mono text-[11px] text-white/30 animate-pulse text-center py-2">analyzing... stand by<span className="animate-pulse">▌</span></p>
                    )}
                </div>

                <p className="px-5 pb-3 font-mono text-[10px] text-white/25">* all data read locally in your browser. location approximated via public IP lookup.</p>
            </div>
        </div>
    );
};

export default SecurityScan;
