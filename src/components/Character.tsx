import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ──────────────────────────────────────
   Character model with eye + head tracking
   ────────────────────────────────────── */
function CharacterModel({ scrollProgress }: { scrollProgress: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF('/models/character.glb');
    const mouse = useRef({ x: 0, y: 0 });
    const blinkTimer = useRef(0);
    const isBlinking = useRef(false);

    // Clone scene once
    const clonedScene = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const mat = (mesh.material as THREE.MeshStandardMaterial);
                    if (mat.emissive) {
                        mat.emissive = new THREE.Color(0xb4a0e5);
                        mat.emissiveIntensity = 0.02;
                    }
                }
            }
        });
        return clone;
    }, [scene]);

    // Get all skinned meshes for morph targets
    const skinnedMeshes = useMemo(() => {
        const meshes: THREE.SkinnedMesh[] = [];
        clonedScene.traverse((child) => {
            if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
                meshes.push(child as THREE.SkinnedMesh);
            }
        });
        return meshes;
    }, [clonedScene]);

    // Mouse tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Helper to set morph target
    const setMorph = (name: string, value: number) => {
        skinnedMeshes.forEach((mesh) => {
            if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
                const idx = mesh.morphTargetDictionary[name];
                if (idx !== undefined) {
                    mesh.morphTargetInfluences[idx] = value;
                }
            }
        });
    };

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.getElapsedTime();

        // ─── Idle breathing ───
        const baseY = -1.8;
        groupRef.current.position.y = baseY + Math.sin(time * 1.2) * 0.015;

        // ─── Scroll-based transforms ───
        // Hero: centered. Scroll → shift left. Further → zoom out
        const targetX = scrollProgress < 0.3
            ? 0
            : THREE.MathUtils.lerp(0, -1.2, (scrollProgress - 0.3) / 0.3);

        groupRef.current.position.x = THREE.MathUtils.lerp(
            groupRef.current.position.x,
            targetX,
            delta * 3
        );

        // ─── Eye blinking ───
        blinkTimer.current += delta;
        if (!isBlinking.current && blinkTimer.current > 3 + Math.random() * 4) {
            isBlinking.current = true;
            blinkTimer.current = 0;
        }
        if (isBlinking.current) {
            const blinkPhase = blinkTimer.current;
            if (blinkPhase < 0.08) {
                const v = blinkPhase / 0.08;
                setMorph('eyeBlinkLeft', v);
                setMorph('eyeBlinkRight', v);
            } else if (blinkPhase < 0.16) {
                const v = 1 - (blinkPhase - 0.08) / 0.08;
                setMorph('eyeBlinkLeft', v);
                setMorph('eyeBlinkRight', v);
            } else {
                setMorph('eyeBlinkLeft', 0);
                setMorph('eyeBlinkRight', 0);
                isBlinking.current = false;
                blinkTimer.current = 0;
            }
        }

        // ─── Eye gaze tracking ───
        const mx = mouse.current.x;
        const my = mouse.current.y;

        // Horizontal gaze
        if (mx > 0.05) {
            setMorph('eyeLookOutLeft', mx * 0.6);
            setMorph('eyeLookInRight', mx * 0.6);
            setMorph('eyeLookInLeft', 0);
            setMorph('eyeLookOutRight', 0);
        } else if (mx < -0.05) {
            setMorph('eyeLookInLeft', -mx * 0.6);
            setMorph('eyeLookOutRight', -mx * 0.6);
            setMorph('eyeLookOutLeft', 0);
            setMorph('eyeLookInRight', 0);
        } else {
            setMorph('eyeLookOutLeft', 0);
            setMorph('eyeLookInRight', 0);
            setMorph('eyeLookInLeft', 0);
            setMorph('eyeLookOutRight', 0);
        }

        // Vertical gaze
        if (my > 0.05) {
            setMorph('eyeLookUpLeft', my * 0.4);
            setMorph('eyeLookUpRight', my * 0.4);
            setMorph('eyeLookDownLeft', 0);
            setMorph('eyeLookDownRight', 0);
        } else if (my < -0.05) {
            setMorph('eyeLookDownLeft', -my * 0.4);
            setMorph('eyeLookDownRight', -my * 0.4);
            setMorph('eyeLookUpLeft', 0);
            setMorph('eyeLookUpRight', 0);
        } else {
            setMorph('eyeLookUpLeft', 0);
            setMorph('eyeLookUpRight', 0);
            setMorph('eyeLookDownLeft', 0);
            setMorph('eyeLookDownRight', 0);
        }

        // Subtle mouth micro-expression
        setMorph('mouthSmileLeft', 0.15 + Math.sin(time * 0.5) * 0.05);
        setMorph('mouthSmileRight', 0.15 + Math.sin(time * 0.5) * 0.05);

        // ─── Head tracking ───
        const headBone = clonedScene.getObjectByName('Head');
        if (headBone) {
            headBone.rotation.x = THREE.MathUtils.lerp(
                headBone.rotation.x,
                -my * 0.25,
                delta * 3
            );
            headBone.rotation.y = THREE.MathUtils.lerp(
                headBone.rotation.y,
                mx * 0.4,
                delta * 3
            );
            headBone.rotation.z = THREE.MathUtils.lerp(
                headBone.rotation.z,
                -mx * 0.08,
                delta * 3
            );
        }

        // Spine subtle follow
        const spineBone = clonedScene.getObjectByName('Spine1') || clonedScene.getObjectByName('Spine');
        if (spineBone) {
            spineBone.rotation.x = THREE.MathUtils.lerp(spineBone.rotation.x, -my * 0.06, delta * 2);
            spineBone.rotation.y = THREE.MathUtils.lerp(spineBone.rotation.y, mx * 0.08, delta * 2);
        }

        const neckBone = clonedScene.getObjectByName('Neck');
        if (neckBone) {
            neckBone.rotation.x = THREE.MathUtils.lerp(neckBone.rotation.x, -my * 0.12, delta * 2.5);
            neckBone.rotation.y = THREE.MathUtils.lerp(neckBone.rotation.y, mx * 0.15, delta * 2.5);
        }
    });

    // Position/scale based on scroll: bust → full body
    const scale = scrollProgress < 0.5 ? 1.6 : THREE.MathUtils.lerp(1.6, 1.2, (scrollProgress - 0.5) / 0.3);

    return (
        <group ref={groupRef} position={[0, -1.8, 0]} scale={scale}>
            <primitive object={clonedScene} />
        </group>
    );
}

/* ──────────────────────────────────────
   Camera rig: makes camera look at head area
   ────────────────────────────────────── */
function CameraRig() {
    const lookTarget = useRef(new THREE.Vector3(0, 0.9, 0));

    useFrame(({ camera }) => {
        camera.lookAt(lookTarget.current);
    });

    return null;
}

/* ──────────────────────────────────────
   Scene: lights + character
   ────────────────────────────────────── */
function SceneContent({ scrollProgress }: { scrollProgress: number }) {
    return (
        <>
            <CameraRig />
            <ambientLight intensity={0.4} color="#b4a0e5" />
            <directionalLight position={[3, 5, 5]} intensity={1.5} color="#e0d4ff" />
            <directionalLight position={[-2, 3, 3]} intensity={0.6} color="#8b6fd4" />
            <pointLight position={[0, 3, -4]} intensity={2} color="#b4a0e5" distance={10} />
            <pointLight position={[0, 0, 5]} intensity={0.4} color="#ffffff" distance={8} />

            {/* Screen glow from below */}
            <pointLight position={[0, -1, 2]} intensity={0.6} color="#b4a0e5" distance={5} />

            <CharacterModel scrollProgress={scrollProgress} />
        </>
    );
}

/* ──────────────────────────────────────
   Exported wrapper
   ────────────────────────────────────── */
interface CharacterProps {
    scrollProgress: number;
}

const Character = ({ scrollProgress }: CharacterProps) => {
    return (
        <div className="character-canvas-container">
            <Canvas
                camera={{ position: [0, 1.0, 2.8], fov: 35 }}
                gl={{
                    alpha: true,
                    antialias: true,
                    powerPreference: 'high-performance',
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.3,
                }}
                style={{ background: 'transparent' }}
            >
                <SceneContent scrollProgress={scrollProgress} />
            </Canvas>
        </div>
    );
};

// Preload
useGLTF.preload('/models/character.glb');

export default Character;
