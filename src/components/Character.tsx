import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';


/* ──────────────────────────────────────
   Shared mouse tracker (for subtle gaze blend)
   ────────────────────────────────────── */
const mouse = { x: 0, y: 0 };
if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
}

/* ──────────────────────────────────────
   Footstep audio — module level so it survives Character remounts
   ────────────────────────────────────── */
let audioCtx: AudioContext | null = null;
function ensureAudio() {
    if (typeof window === 'undefined') return;
    if (!audioCtx) {
        const Ctx = window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        try { audioCtx = new Ctx(); } catch { return; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}
if (typeof window !== 'undefined') {
    // Browsers require a user gesture before audio may sound
    window.addEventListener('pointerdown', ensureAudio);
    window.addEventListener('keydown', ensureAudio);
}
window.addEventListener('load', ensureAudio); // attempt eager (may be suspended until gesture)

/* ──────────────────────────────────────
   Character model
   ────────────────────────────────────── */
interface CharacterModelProps {
    contentSide: 'left' | 'right'; // which side the CONTENT is on
}

function CharacterModel({ contentSide }: CharacterModelProps) {
    const { scene } = useGLTF('/models/mj_profile_porfolio.vrm.glb');
    const groupRef = useRef<THREE.Group>(null);
    // Stable clone — useMemo prevents re-creating on every re-render
    // Without this, contentSide prop changes recreate the clone and reset T-pose
    const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

    // Tracked bones
    const headBone = useRef<THREE.Bone | null>(null);
    const neckBone = useRef<THREE.Bone | null>(null);
    const spineBone = useRef<THREE.Bone | null>(null);
    const lUpperArm = useRef<THREE.Bone | null>(null);
    const rUpperArm = useRef<THREE.Bone | null>(null);
    const lLowerArm = useRef<THREE.Bone | null>(null);
    const rLowerArm = useRef<THREE.Bone | null>(null);
    const lUpperLeg = useRef<THREE.Bone | null>(null);
    const rUpperLeg = useRef<THREE.Bone | null>(null);
    const lLowerLeg = useRef<THREE.Bone | null>(null);
    const rLowerLeg = useRef<THREE.Bone | null>(null);

    useEffect(() => {
        clonedScene.traverse((child) => {
            const bone = child as THREE.Bone;
            const n = (bone.name ?? '').toLowerCase();

            if (!headBone.current && (n === 'j_bip_c_head' || (n.includes('head') && !n.includes('headtop')))) headBone.current = bone;
            if (!neckBone.current && (n === 'j_bip_c_neck' || n.includes('neck'))) neckBone.current = bone;
            if (!spineBone.current && (n === 'j_bip_c_chest' || n === 'j_bip_c_spine' || n.includes('spine'))) spineBone.current = bone;

            // Arm bones
            if (!lUpperArm.current && (n === 'j_bip_l_upperarm' || (n.includes('left') && n.includes('arm') && !n.includes('lower') && !n.includes('fore')))) lUpperArm.current = bone;
            if (!rUpperArm.current && (n === 'j_bip_r_upperarm' || (n.includes('right') && n.includes('arm') && !n.includes('lower') && !n.includes('fore')))) rUpperArm.current = bone;
            if (!lLowerArm.current && (n === 'j_bip_l_lowerarm' || (n.includes('left') && (n.includes('lower') || n.includes('fore'))))) lLowerArm.current = bone;
            if (!rLowerArm.current && (n === 'j_bip_r_lowerarm' || (n.includes('right') && (n.includes('lower') || n.includes('fore'))))) rLowerArm.current = bone;

            // Leg bones
            if (!lUpperLeg.current && (n === 'j_bip_l_upperleg' || (n.includes('left') && n.includes('upperleg')))) lUpperLeg.current = bone;
            if (!rUpperLeg.current && (n === 'j_bip_r_upperleg' || (n.includes('right') && n.includes('upperleg')))) rUpperLeg.current = bone;
            if (!lLowerLeg.current && (n === 'j_bip_l_lowerleg' || (n.includes('left') && n.includes('lowerleg')))) lLowerLeg.current = bone;
            if (!rLowerLeg.current && (n === 'j_bip_r_lowerleg' || (n.includes('right') && n.includes('lowerleg')))) rLowerLeg.current = bone;

            // Shadow-style material
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.color.setHex(0x0d0d0d);
                material.roughness = 1;
                material.metalness = 0;
                mesh.castShadow = true;
            }
        });

        // ─── Arms neutral, hands at sides ───
        if (lUpperArm.current) {
            lUpperArm.current.rotation.x = 0;
            lUpperArm.current.rotation.y = 0.12;   // slight inward tuck
            lUpperArm.current.rotation.z = -1.3;   // bring arm DOWN (flipped from T-pose)
        }
        if (rUpperArm.current) {
            rUpperArm.current.rotation.x = 0;
            rUpperArm.current.rotation.y = -0.12;
            rUpperArm.current.rotation.z = 1.3;    // mirror for right arm
        }
        // Lower arms: fully straight down
        if (lLowerArm.current) {
            lLowerArm.current.rotation.x = 0;
            lLowerArm.current.rotation.y = 0;
            lLowerArm.current.rotation.z = 0;
        }
        if (rLowerArm.current) {
            rLowerArm.current.rotation.x = 0;
            rLowerArm.current.rotation.y = 0;
            rLowerArm.current.rotation.z = 0;
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Character keeps walking one direction forever; wraps to the other edge
    const lastStepRef = useRef(0);

    // ─── One soft footstep "thud" per stride ───
    const playFootstep = () => {
        ensureAudio();
        const ctx = audioCtx;
        if (!ctx || ctx.state !== 'running') return; // stays silent until a user gesture unlocks audio
        const now = ctx.currentTime;
        const duration = 0.12;
        const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.6);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 620;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, now);          // audible but soft
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(now);
        src.stop(now + duration + 0.01);
    };

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.getElapsedTime();

        // ─── Slow professional walk: constant direction, wraps to the other side ───
        const edge = state.viewport.width / 2 + 0.6;
        const stepFreq = 1.05;                           // slow, deliberate steps
        const swing = Math.sin(time * stepFreq * Math.PI);
        const speed = (state.viewport.width + 1.2) / 14; // full crossing ~14s
        const dir = 1;                                   // always walks left → right

        let x = groupRef.current.position.x + dir * speed * delta;
        if (x > edge) x = -edge;                         // exits right, re-enters left
        groupRef.current.position.x = x;

        // Footstep exactly when stride crosses stance (swing zero crossing)
        const stepPhase = Math.floor(time * stepFreq);
        if (stepPhase !== lastStepRef.current) {
            lastStepRef.current = stepPhase;
            playFootstep();
        }

        // ─── Legs: slow stride, straight and inline with body ───
        if (lUpperLeg.current) { lUpperLeg.current.rotation.set(swing * 0.38, 0, 0); }
        if (rUpperLeg.current) { rUpperLeg.current.rotation.set(-swing * 0.38, 0, 0); }
        if (lLowerLeg.current) { lLowerLeg.current.rotation.set(Math.max(0, -swing) * 0.35, 0, 0); }
        if (rLowerLeg.current) { rLowerLeg.current.rotation.set(Math.max(0, swing) * 0.35, 0, 0); }

        // ─── Arms: relaxed straight down at sides (neutral, no chest push) ───
        if (lUpperArm.current) { lUpperArm.current.rotation.set(0, 0.12, -1.3); }
        if (rUpperArm.current) { rUpperArm.current.rotation.set(0, -0.12, 1.3); }
        if (lLowerArm.current) { lLowerArm.current.rotation.set(0, 0, 0); }
        if (rLowerArm.current) { rLowerArm.current.rotation.set(0, 0, 0); }

        // ─── Body: upright full side profile ───
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (Math.PI / 2) * 0.98, delta * 2);
        // hip sway — slight roll alternating with each step
        groupRef.current.rotation.z = Math.sin(time * stepFreq * Math.PI) * 0.03;

        // gentle vertical bob: two dips per full stride, peaks at leg pass
        groupRef.current.position.y = -0.85 + 0.02 * Math.sin(time * stepFreq * Math.PI * 2);

        // ─── Upper body counter-sway syncs with legs ───
        if (spineBone.current) {
            spineBone.current.rotation.z = THREE.MathUtils.lerp(spineBone.current.rotation.z || 0, -0.02, delta * 2);
            spineBone.current.rotation.y = THREE.MathUtils.lerp(spineBone.current.rotation.y || 0, -0.03, delta * 2);
        }
        if (neckBone.current) {
            neckBone.current.rotation.y = THREE.MathUtils.lerp(neckBone.current.rotation.y, -0.04, delta * 2);
        }

        // ─── Head: steady forward, whisper of mouse sway ───
        if (headBone.current) {
            headBone.current.rotation.y = THREE.MathUtils.lerp(headBone.current.rotation.y, -0.12 + mouse.x * 0.05, delta * 2);
            headBone.current.rotation.x = THREE.MathUtils.lerp(headBone.current.rotation.x, mouse.y * 0.04, delta * 2);
        }
    });

    return (
        <group ref={groupRef} position={[contentSide === 'left' ? 0.9 : -0.9, -0.85, 0]} scale={1.0}>
            <primitive object={clonedScene} />
        </group>
    );
}

/* ──────────────────────────────────────
   Camera rig
   ────────────────────────────────────── */
function CameraRig() {
    const { camera } = useThree();
    const target = useRef(new THREE.Vector3(0, 0.5, 0));
    useFrame(() => { camera.lookAt(target.current); });
    return null;
}

/* ──────────────────────────────────────
   Scene
   ────────────────────────────────────── */
function SceneContent({ contentSide }: { contentSide: 'left' | 'right' }) {
    const glowTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(180, 160, 229, 0.55)');
        gradient.addColorStop(0.35, 'rgba(139, 111, 212, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }, []);

    return (
        <>
            <CameraRig />
            <ambientLight intensity={0.5} color="#c0b0f0" />
            <directionalLight position={[4, 6, 5]} intensity={2.0} color="#e8e0ff" castShadow />
            <directionalLight position={[-3, 4, 3]} intensity={0.8} color="#9b7fe8" />
            <pointLight position={[0, 3, -3]} intensity={1.5} color="#b4a0e5" distance={12} />
            <pointLight position={[0, 2, -3.5]} intensity={4} color="#c7baf0" distance={14} />
            <pointLight position={[0, 1.5, 4]} intensity={0.6} color="#ffffff" distance={8} />
            <pointLight position={[6, 2, -2]} intensity={2} color="#b4a0e5" distance={10} />
            <pointLight position={[-6, 2, -2]} intensity={2} color="#b4a0e5" distance={10} />
            <directionalLight position={[5, 2, -2]} intensity={1.5} color="#b4a0e5" />
            <directionalLight position={[-5, 2, -2]} intensity={1.5} color="#b4a0e5" />
            {glowTexture && (
                <sprite position={[0, -0.85, -2.5]} scale={[13, 13, 1]}>
                    <spriteMaterial
                        map={glowTexture}
                        color="#c7baf0"
                        transparent
                        opacity={0.55}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </sprite>
            )}
            <CharacterModel contentSide={contentSide} />
        </>
    );
}

/* ──────────────────────────────────────
   Exported wrapper
   ────────────────────────────────────── */
interface CharacterProps {
    contentSide: 'left' | 'right';
}

const Character = ({ contentSide }: CharacterProps) => (
    <div className="character-canvas-container">
        <Canvas
            camera={{ position: [0, 0.6, 2.4], fov: 40 }}
            gl={{
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.4,
            }}
            style={{ background: 'transparent' }}
        >
            <SceneContent contentSide={contentSide} />
        </Canvas>
    </div>
);

export default Character;
