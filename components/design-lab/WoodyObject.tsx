'use client'

import { PresentationControls, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export type WoodyMaterial = 'functional' | 'ceramic' | 'gel' | 'plastic' | 'chrome'
export type WoodyMotionState = 'tune' | 'moving' | 'impact'

type Palette = {
  primary: string
  secondary: string
  accent: string
}

type ObjectProps = {
  motionState: WoodyMotionState
  palette: Palette
}

function CeramicObject({ motionState, palette }: ObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const counterweightRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !counterweightRef.current) return
    const time = clock.getElapsedTime()
    const intensity = motionState === 'impact' ? 2.4 : motionState === 'moving' ? 1.35 : 0.7
    groupRef.current.rotation.y += delta * 0.18 * intensity
    groupRef.current.rotation.z = Math.sin(time * 0.75 * intensity) * 0.1
    counterweightRef.current.position.x = Math.sin(time * 0.9 * intensity) * 1.42
    counterweightRef.current.position.y = -0.72 + Math.cos(time * 0.9 * intensity) * 0.18
  })

  return (
    <group ref={groupRef} rotation={[0.18, -0.35, -0.12]}>
      <RoundedBox args={[2.35, 0.72, 0.82]} radius={0.34} smoothness={8} rotation={[0, 0, -0.3]}>
        <meshStandardMaterial color={palette.primary} roughness={0.82} metalness={0.02} />
      </RoundedBox>
      <mesh position={[0.74, 0.68, 0.08]}>
        <sphereGeometry args={[0.62, 64, 64]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.9} />
      </mesh>
      <mesh ref={counterweightRef} position={[-1.1, -0.72, 0.2]}>
        <sphereGeometry args={[0.27, 48, 48]} />
        <meshStandardMaterial color={palette.accent} roughness={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-0.36, 0.08, -0.2]}>
        <torusGeometry args={[0.9, 0.075, 24, 96]} />
        <meshStandardMaterial color="#17141f" roughness={0.72} />
      </mesh>
    </group>
  )
}

function GelObject({ motionState, palette }: ObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const beadRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !bodyRef.current || !beadRef.current) return
    const time = clock.getElapsedTime()
    const pulse = motionState === 'impact' ? 0.18 : motionState === 'moving' ? 0.09 : 0.045
    const speed = motionState === 'impact' ? 3.2 : motionState === 'moving' ? 1.8 : 0.9
    const scale = 1 + Math.sin(time * speed) * pulse
    bodyRef.current.scale.set(1.32 * scale, 0.82 / scale, 0.92 * scale)
    beadRef.current.position.set(Math.cos(time * speed) * 1.28, Math.sin(time * speed * 1.3) * 0.7, Math.sin(time * speed) * 0.45)
    groupRef.current.rotation.y += delta * 0.12
  })

  return (
    <group ref={groupRef} rotation={[0.08, 0.2, 0]}>
      <mesh ref={bodyRef}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhysicalMaterial color={palette.primary} roughness={0.08} transmission={0.78} thickness={1.35} ior={1.2} transparent opacity={0.88} />
      </mesh>
      <mesh rotation={[0.5, 0.25, 0.2]}>
        <torusGeometry args={[1.22, 0.12, 40, 128]} />
        <meshPhysicalMaterial color={palette.secondary} roughness={0.12} transmission={0.45} thickness={0.65} />
      </mesh>
      <mesh ref={beadRef}>
        <sphereGeometry args={[0.22, 48, 48]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.28} roughness={0.18} />
      </mesh>
    </group>
  )
}

function PlasticObject({ motionState, palette }: ObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const topRef = useRef<THREE.Group>(null)
  const middleRef = useRef<THREE.Group>(null)
  const bottomRef = useRef<THREE.Group>(null)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !topRef.current || !middleRef.current || !bottomRef.current) return
    const time = clock.getElapsedTime()
    const speed = motionState === 'impact' ? 3.8 : motionState === 'moving' ? 1.75 : 0.65
    const spread = motionState === 'impact' ? 0.38 : motionState === 'moving' ? 0.16 : 0.08
    topRef.current.position.x = Math.sin(time * speed) * spread
    middleRef.current.rotation.z = Math.sin(time * speed * 0.75) * spread
    bottomRef.current.position.x = -Math.sin(time * speed) * spread
    groupRef.current.rotation.y += delta * (motionState === 'impact' ? 0.62 : 0.22)
  })

  return (
    <group ref={groupRef} rotation={[0.2, -0.42, 0.08]}>
      <group ref={topRef} position={[0.15, 0.82, 0]} rotation={[0, 0.2, 0.12]}>
        <RoundedBox args={[1.9, 0.52, 0.72]} radius={0.26} smoothness={6}>
          <meshPhysicalMaterial color={palette.primary} roughness={0.22} clearcoat={0.8} clearcoatRoughness={0.15} />
        </RoundedBox>
      </group>
      <group ref={middleRef} position={[-0.22, 0.06, 0.08]} rotation={[0.12, -0.15, -0.18]}>
        <RoundedBox args={[2.4, 0.6, 0.8]} radius={0.3} smoothness={6}>
          <meshPhysicalMaterial color={palette.secondary} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />
        </RoundedBox>
      </group>
      <group ref={bottomRef} position={[0.24, -0.78, -0.08]} rotation={[-0.08, 0.2, 0.2]}>
        <RoundedBox args={[1.65, 0.55, 0.74]} radius={0.28} smoothness={6}>
          <meshPhysicalMaterial color={palette.accent} roughness={0.25} clearcoat={0.72} />
        </RoundedBox>
      </group>
      <mesh position={[1.18, -0.25, 0.55]}>
        <sphereGeometry args={[0.3, 48, 48]} />
        <meshStandardMaterial color="#17141f" roughness={0.28} />
      </mesh>
    </group>
  )
}

function ChromeObject({ motionState, palette }: ObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ringOneRef = useRef<THREE.Mesh>(null)
  const ringTwoRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !ringOneRef.current || !ringTwoRef.current || !coreRef.current) return
    const time = clock.getElapsedTime()
    const speed = motionState === 'impact' ? 2.8 : motionState === 'moving' ? 1.25 : 0.45
    ringOneRef.current.rotation.x += delta * speed
    ringOneRef.current.rotation.y += delta * speed * 0.35
    ringTwoRef.current.rotation.y -= delta * speed * 0.8
    ringTwoRef.current.rotation.z += delta * speed * 0.25
    coreRef.current.scale.setScalar(0.84 + Math.sin(time * speed * 1.8) * (motionState === 'impact' ? 0.2 : 0.06))
    groupRef.current.rotation.z = Math.sin(time * 0.35) * 0.18
  })

  return (
    <group ref={groupRef} rotation={[0.22, -0.2, 0.12]}>
      <mesh ref={ringOneRef}>
        <torusGeometry args={[1.25, 0.18, 48, 160]} />
        <meshStandardMaterial color="#dfe4ea" roughness={0.08} metalness={1} />
      </mesh>
      <mesh ref={ringTwoRef} rotation={[Math.PI / 2, 0.5, 0]}>
        <torusGeometry args={[0.9, 0.09, 32, 128]} />
        <meshStandardMaterial color={palette.primary} roughness={0.16} metalness={0.82} />
      </mesh>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.72, 5]} />
        <meshPhysicalMaterial color={palette.secondary} roughness={0.12} metalness={0.48} clearcoat={1} />
      </mesh>
      <mesh position={[0.95, 0.72, 0.3]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function FunctionalStackObject({ motionState, palette }: ObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const anchorOneRef = useRef<THREE.Group>(null)
  const anchorTwoRef = useRef<THREE.Group>(null)
  const currentTrackRef = useRef<THREE.Group>(null)
  const impactRingRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !anchorOneRef.current || !anchorTwoRef.current || !currentTrackRef.current || !impactRingRef.current) return
    const time = clock.getElapsedTime()
    const smoothing = 1 - Math.exp(-delta * 5.5)
    const movingOffset = motionState === 'moving' ? Math.sin(time * 1.4) * 0.08 : 0
    const targets = motionState === 'tune'
      ? [[-0.92, 0.58, -0.2], [0.7, 0.12, 0.08], [-0.28, -0.72, 0.3]]
      : motionState === 'impact'
        ? [[-0.52, 0.78, -0.2], [0.58, 0.36, 0.06], [0, -0.52, 0.56]]
        : [[-0.42, 0.62 + movingOffset, -0.18], [0.35, 0.05, 0.04], [-0.08, -0.6 - movingOffset, 0.34]]
    const groups = [anchorOneRef.current, anchorTwoRef.current, currentTrackRef.current]
    groups.forEach((group, index) => {
      const [targetX, targetY, targetZ] = targets[index]
      group.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), smoothing)
    })
    anchorOneRef.current.rotation.z = THREE.MathUtils.lerp(anchorOneRef.current.rotation.z, motionState === 'impact' ? -0.24 : -0.08, smoothing)
    anchorTwoRef.current.rotation.z = THREE.MathUtils.lerp(anchorTwoRef.current.rotation.z, motionState === 'impact' ? 0.3 : 0.1, smoothing)
    currentTrackRef.current.rotation.z = THREE.MathUtils.lerp(currentTrackRef.current.rotation.z, motionState === 'impact' ? -0.08 : 0.02, smoothing)
    const ringTarget = motionState === 'impact' ? 1.25 + Math.sin(time * 4) * 0.05 : 0.72
    impactRingRef.current.scale.lerp(new THREE.Vector3(ringTarget, ringTarget, ringTarget), smoothing)
    const impactMaterial = impactRingRef.current.material as THREE.MeshStandardMaterial
    impactMaterial.opacity = THREE.MathUtils.lerp(impactMaterial.opacity, motionState === 'impact' ? 0.92 : 0.18, smoothing)
    groupRef.current.rotation.y = Math.sin(time * 0.34) * 0.16
  })

  return (
    <group ref={groupRef} rotation={[0.16, -0.28, 0]}>
      <group ref={anchorOneRef}>
        <RoundedBox args={[1.48, 0.66, 0.42]} radius={0.16} smoothness={6}>
          <meshStandardMaterial color={palette.primary} roughness={0.68} />
        </RoundedBox>
        <mesh position={[-0.45, 0, 0.24]}>
          <circleGeometry args={[0.12, 32]} />
          <meshStandardMaterial color="#f3efe6" roughness={0.8} />
        </mesh>
      </group>
      <group ref={anchorTwoRef}>
        <RoundedBox args={[1.64, 0.66, 0.42]} radius={0.16} smoothness={6}>
          <meshStandardMaterial color={palette.secondary} roughness={0.72} />
        </RoundedBox>
        <mesh position={[0.48, 0, 0.24]}>
          <ringGeometry args={[0.07, 0.14, 32]} />
          <meshStandardMaterial color="#17141f" roughness={0.8} />
        </mesh>
      </group>
      <group ref={currentTrackRef}>
        <RoundedBox args={[2.05, 0.76, 0.5]} radius={0.19} smoothness={6}>
          <meshPhysicalMaterial color={palette.accent} roughness={0.3} clearcoat={0.48} />
        </RoundedBox>
        <mesh position={[0, 0, 0.28]}>
          <planeGeometry args={[1.34, 0.055]} />
          <meshBasicMaterial color="#17141f" />
        </mesh>
      </group>
      <mesh ref={impactRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.28, 0.055, 20, 128]} />
        <meshStandardMaterial color="#e8edf2" roughness={0.06} metalness={1} transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

function ObjectScene({ material, motionState, palette }: { material: WoodyMaterial; motionState: WoodyMotionState; palette: Palette }) {
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[4, 5, 5]} intensity={3.2} color="#fff5e8" />
      <pointLight position={[-4, -2, 3]} intensity={5} color={palette.secondary} />
      <pointLight position={[3, 1, -2]} intensity={4} color={palette.accent} />
      <PresentationControls global snap speed={1.2} damping={0.18} polar={[-0.45, 0.45]} azimuth={[-0.8, 0.8]}>
        {material === 'functional' && <FunctionalStackObject motionState={motionState} palette={palette} />}
        {material === 'ceramic' && <CeramicObject motionState={motionState} palette={palette} />}
        {material === 'gel' && <GelObject motionState={motionState} palette={palette} />}
        {material === 'plastic' && <PlasticObject motionState={motionState} palette={palette} />}
        {material === 'chrome' && <ChromeObject motionState={motionState} palette={palette} />}
      </PresentationControls>
    </>
  )
}

export function WoodyObject({ material, motionState, palette }: { material: WoodyMaterial; motionState: WoodyMotionState; palette: Palette }) {
  return (
    <Canvas camera={{ position: [0, 0, 4.6], fov: 42 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
      <ObjectScene material={material} motionState={motionState} palette={palette} />
    </Canvas>
  )
}
