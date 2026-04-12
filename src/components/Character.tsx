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

            // Material quality
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                (mesh.material as THREE.MeshStandardMaterial).roughness = 0.55;
                mesh.castShadow = true;
            }
        });

        // ─── Straight arms close to body ───
        // VRM rest pose has arms up. Rotating Z negative on left arm brings it down.
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
    }, []);

    // Target X: character is on the OPPOSITE side of content
    // content=left  → character right → targetX = +0.9
    // content=right → character left  → targetX = -0.9
    const targetXRef = useRef(contentSide === 'left' ? 0.9 : -0.9);

    // Target head look: toward content
    // content=left  → look left  → negative Y rotation
    // content=right → look right → positive Y rotation
    const targetHeadYRef = useRef(contentSide === 'left' ? -0.45 : 0.45);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.getElapsedTime();

        // ─── Enforce arm pose every frame (prevents model animation overriding) ───
        if (lUpperArm.current) { lUpperArm.current.rotation.set(0, 0.12, -1.3); }
        if (rUpperArm.current) { rUpperArm.current.rotation.set(0, -0.12, 1.3); }
        if (lLowerArm.current) { lLowerArm.current.rotation.set(0, 0, 0); }
        if (rLowerArm.current) { rLowerArm.current.rotation.set(0, 0, 0); }

        // Update targets when prop changes
        const newTargetX = contentSide === 'left' ? 0.9 : -0.9;
        const newHeadY = contentSide === 'left' ? -0.45 : 0.45;
        targetXRef.current = THREE.MathUtils.lerp(targetXRef.current, newTargetX, delta * 2.5);
        targetHeadYRef.current = THREE.MathUtils.lerp(targetHeadYRef.current, newHeadY, delta * 2.5);

        // ─── Position: smooth slide to opposite side ───
        const baseY = -0.85;
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetXRef.current, delta * 3);
        groupRef.current.position.y = baseY + Math.sin(time * 1.0) * 0.01;

        // ─── Body slight turn toward content ───
        const targetBodyY = contentSide === 'left' ? -0.2 : 0.2;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetBodyY, delta * 2);

        // ─── Head: section-based look direction + subtle mouse blend ───
        if (headBone.current) {
            // Primary: look toward content side; secondary: slight mouse tracking
            const headTargetY = targetHeadYRef.current + mouse.x * 0.12;
            const headTargetX = mouse.y * 0.1;
            headBone.current.rotation.y = THREE.MathUtils.lerp(headBone.current.rotation.y, headTargetY, delta * 3);
            headBone.current.rotation.x = THREE.MathUtils.lerp(headBone.current.rotation.x, headTargetX, delta * 3);
        }
        if (neckBone.current) {
            neckBone.current.rotation.y = THREE.MathUtils.lerp(neckBone.current.rotation.y, targetHeadYRef.current * 0.3, delta * 2);
        }
        if (spineBone.current) {
            spineBone.current.rotation.y = THREE.MathUtils.lerp(spineBone.current.rotation.y, targetHeadYRef.current * 0.1, delta * 1.5);
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
    return (
        <>
            <CameraRig />
            <ambientLight intensity={0.5} color="#c0b0f0" />
            <directionalLight position={[4, 6, 5]} intensity={2.0} color="#e8e0ff" castShadow />
            <directionalLight position={[-3, 4, 3]} intensity={0.8} color="#9b7fe8" />
            <pointLight position={[0, 3, -3]} intensity={1.5} color="#b4a0e5" distance={12} />
            <pointLight position={[0, 1.5, 4]} intensity={0.6} color="#ffffff" distance={8} />
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

useGLTF.preload('/models/mj_profile_porfolio.vrm.glb');

export default Character;
