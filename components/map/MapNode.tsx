'use client'

import { Html } from '@react-three/drei'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'
import type { TrackSuggestion } from '@/lib/types'
import type { MapNodeData } from './useMapNodes'
import { latLngToVec3, nodeSurfaceRadius } from './useMapNodes'
import { cancelPreview, startPreview } from '@/lib/preview'

const TONE_HEX: Record<TrackSuggestion['tone'], string> = {
  violet: '#7C6BCE',
  amber: '#C4874A',
  moss: '#4E6B45',
  rose: '#8C5C5C',
}

const TEXT_LO = new THREE.Color('#4A4844')

const CORE_R = {
  unknown: 0.012,
  known: 0.018,
  playing: 0.026,
} as const

interface MapNodeProps {
  data: MapNodeData
  onSelect: (data: MapNodeData) => void
  onHover: (id: string | null) => void
  onRejectRequest?: (data: MapNodeData) => void
  isRejecting?: boolean
  rejectable?: boolean
  staggerDelayMs?: number
  energyPhase: number
  enrichmentHint?: string | null
  previewUrl?: string | null
  resonating?: boolean
}

function noopRaycast(): void {}

function hash01(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return (Math.abs(h) % 10000) / 10000
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function toneColorForNode(data: MapNodeData): THREE.Color {
  const color = new THREE.Color(TONE_HEX[data.tone])
  if (data.reason === 'save point') {
    color.lerp(new THREE.Color(TONE_HEX.amber), 0.38)
  }
  if (data.isKnown && !data.isPlaying) {
    color.lerp(TEXT_LO, 0.3)
  }
  return color
}

function clickEnvelope(ms: number): number {
  if (ms < 0) return 1
  if (ms <= 150) return 1 + (0.3 * ms) / 150
  if (ms <= 400) {
    const u = (ms - 150) / 250
    return 1.3 * (1 - u) + 1.05 * u
  }
  return 1.05
}

export function MapNode({
  data,
  onSelect,
  onHover,
  onRejectRequest,
  isRejecting = false,
  rejectable = false,
  staggerDelayMs = 0,
  energyPhase,
  enrichmentHint,
  previewUrl,
  resonating = false,
}: MapNodeProps) {
  const groupRef = useRef<Group>(null)
  const coreRef = useRef<Mesh>(null)
  const innerRef = useRef<Mesh>(null)
  const outerRef = useRef<Mesh>(null)
  const orbitRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const clickT0 = useRef<number | null>(null)
  const hoverScale = useRef(1)
  const rejectT0 = useRef<number | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)
  const toCam = useRef(new THREE.Vector3())
  const outward = useRef(new THREE.Vector3())
  const { clock, gl, camera } = useThree()

  const r0 = data.isPlaying ? CORE_R.playing : data.isKnown ? CORE_R.known : CORE_R.unknown
  const toneCol = useMemo(
    () => toneColorForNode(data),
    [data.isKnown, data.isPlaying, data.tone, data.reason]
  )

  const [x, y, z] = latLngToVec3(
    data.lat,
    data.lng,
    nodeSurfaceRadius(data.isKnown, data.isPlaying)
  )
  const nodePosition = useMemo(() => new THREE.Vector3(x, y, z), [x, y, z])
  const ringQuat = useMemo(() => {
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nodePosition.clone().normalize())
    return quaternion
  }, [nodePosition])
  const phaseOff = useMemo(() => hash01(data.id) * Math.PI * 2, [data.id])

  const requestReject = useCallback(() => {
    if (!rejectable || isRejecting || !onRejectRequest) return
    suppressClickRef.current = true
    onRejectRequest(data)
  }, [data, isRejecting, onRejectRequest, rejectable])

  function clearLongPress() {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    pointerDownRef.current = null
  }

  useFrame((_, delta) => {
    const group = groupRef.current
    const core = coreRef.current
    const inner = innerRef.current
    const outer = outerRef.current
    const orbit = orbitRef.current
    if (!group || !core) return

    toCam.current.subVectors(camera.position, nodePosition).normalize()
    outward.current.copy(nodePosition).normalize()
    const facing = outward.current.dot(toCam.current) > 0.02
    group.visible = facing

    const nowSeconds = clock.getElapsedTime()
    const nowMs = Date.now()
    const ageMs = data.birthTime != null ? nowMs - data.birthTime : Number.POSITIVE_INFINITY
    const landingT = clamp01((ageMs - staggerDelayMs) / 600)
    const landingEase = 1 - Math.pow(1 - landingT, 3)
    const landingScale = 0.7 + 0.3 * landingEase
    const landingOffset = 0.03 * (1 - landingEase)
    const landingOpacity = landingEase

    if (isRejecting && rejectT0.current == null) {
      rejectT0.current = nowSeconds
      setHovered(false)
    }
    const rejectMs =
      rejectT0.current == null ? 0 : Math.max(0, (nowSeconds - rejectT0.current) * 1000)
    const rejectT = clamp01(rejectMs / 800)
    const rejectEase = Math.pow(rejectT, 3)
    const rejectScale = 1 - 0.3 * rejectEase
    const rejectOffset = 0.08 * rejectEase
    const rejectOpacity = 1 - 0.8 * rejectEase

    const bpmFactor =
      data.bpmHint !== undefined
        ? Math.max(0, Math.min(1, (data.bpmHint - 60) / 120))
        : energyPhase
    const baseSpeed = 0.45 + bpmFactor * 0.55
    const speed = data.isPlaying ? baseSpeed * 1.5 : baseSpeed
    const phase = nowSeconds * speed + phaseOff
    const breatheAmp = data.isPlaying ? 0.06 : 0.035
    const breathe = 1 + Math.sin(phase) * breatheAmp

    const hoverTarget = hovered && !isRejecting ? 1.1 : 1
    hoverScale.current += (hoverTarget - hoverScale.current) * Math.min(1, delta / 0.2)

    let clickMul = 1
    if (clickT0.current != null) {
      const clickMs = (nowSeconds - clickT0.current) * 1000
      clickMul = clickEnvelope(clickMs)
      if (clickMs > 420) clickT0.current = null
    }

    const scale = r0 * breathe * hoverScale.current * clickMul * landingScale * rejectScale
    core.scale.setScalar(scale)
    if (inner) inner.scale.setScalar(scale * 2.2)
    if (outer) outer.scale.setScalar(scale * 4)
    if (orbit) {
      orbit.scale.setScalar(scale / r0)
      orbit.rotation.y += delta * ((2 * Math.PI) / 12)
    }

    group.position.copy(nodePosition).addScaledVector(outward.current, landingOffset + rejectOffset)

    // Resonance pulse -- extra slow glow when node's energy matches user's taste territory
    const resonancePhaseOff = ((data.trackId?.charCodeAt(0) ?? 0) + (data.trackId?.charCodeAt(1) ?? 0)) / 200
    const resonancePulse = resonating && !isRejecting
      ? 0.07 * Math.sin(nowSeconds * 0.7 + resonancePhaseOff)
      : 0

    const baseEmissive = data.isPlaying ? 0.7 : data.isKnown ? 0.35 : 0.22
    const emissive = Math.min(1.2, baseEmissive + (hovered && !isRejecting ? 0.15 : 0) + resonancePulse)
    const coreMat = core.material as THREE.MeshStandardMaterial
    coreMat.emissiveIntensity = emissive * landingOpacity * rejectOpacity

    const innerMat = inner?.material as THREE.MeshBasicMaterial | undefined
    if (innerMat) {
      const baseOpacity = data.isPlaying ? 0.14 : hovered && !isRejecting ? 0.1 : 0.06
      innerMat.opacity = baseOpacity * landingOpacity * rejectOpacity
    }

    const outerMat = outer?.material as THREE.MeshBasicMaterial | undefined
    if (outerMat) {
      const baseOpacity = data.isPlaying ? 0.05 : 0.02
      outerMat.opacity = baseOpacity * landingOpacity * rejectOpacity
    }

    const orbitMat = orbit?.material as THREE.MeshBasicMaterial | undefined
    if (orbitMat) {
      orbitMat.opacity = 0.25 * landingOpacity * rejectOpacity
    }
  })

  const orbitMajor = r0 * 2.8

  return (
    <group ref={groupRef} position={[x, y, z]}>
      <mesh
        ref={coreRef}
        onClick={(e) => {
          e.stopPropagation()
          if (suppressClickRef.current) {
            suppressClickRef.current = false
            return
          }
          if (isRejecting) return
          onSelect(data)
          clickT0.current = clock.getElapsedTime()
        }}
        onPointerDown={(e) => {
          if (!rejectable || isRejecting || e.pointerType === 'mouse') return
          pointerDownRef.current = { x: e.clientX, y: e.clientY }
          longPressTimerRef.current = window.setTimeout(() => {
            requestReject()
            clearLongPress()
          }, 500)
        }}
        onPointerMove={(e) => {
          if (!pointerDownRef.current) return
          const dx = e.clientX - pointerDownRef.current.x
          const dy = e.clientY - pointerDownRef.current.y
          if (Math.hypot(dx, dy) > 5) {
            clearLongPress()
          }
        }}
        onPointerCancel={clearLongPress}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (isRejecting) return
          setHovered(true)
          onHover(data.id)
          gl.domElement.style.cursor = 'pointer'
          document.body.style.cursor = 'pointer'
          if (previewUrl) startPreview(previewUrl)
        }}
        onPointerOut={() => {
          clearLongPress()
          setHovered(false)
          onHover(null)
          gl.domElement.style.cursor = 'auto'
          document.body.style.cursor = 'auto'
          cancelPreview()
        }}
        onPointerUp={clearLongPress}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color="#1E1B18"
          emissive={toneCol}
          emissiveIntensity={data.isPlaying ? 0.7 : data.isKnown ? 0.35 : 0.22}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      <mesh ref={innerRef} raycast={noopRaycast}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={toneCol}
          transparent
          opacity={0.06}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      <mesh ref={outerRef} raycast={noopRaycast}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={toneCol}
          transparent
          opacity={0.02}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {data.isPlaying ? (
        <mesh ref={orbitRef} quaternion={ringQuat} raycast={noopRaycast}>
          <torusGeometry args={[orbitMajor, 0.002, 4, 32]} />
          <meshBasicMaterial color={toneCol} transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ) : null}

      {hovered && rejectable && !isRejecting && onRejectRequest ? (
        <Html position={[0, r0 * 5, 0]} center distanceFactor={8} style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              requestReject()
            }}
            className="rounded-full border border-white/15 bg-bark/95 px-2 py-1 text-[10px] text-text-mid hover:text-rose hover:border-rose/30 transition-colors backdrop-blur-sm"
            >
              not this
            </button>
          </Html>
        ) : null}

        {hovered && enrichmentHint ? (
          <Html
            position={[0, r0 * 3.2, 0]}
            center
            distanceFactor={8}
            style={{ pointerEvents: 'none' }}
          >
            <div className="max-w-[14rem] rounded-lg border border-white/15 bg-bark/95 px-2 py-1.5 text-left font-sans text-[10px] leading-snug text-text-hi shadow-lg backdrop-blur-sm">
              {enrichmentHint}
            </div>
          </Html>
        ) : null}
      </group>
    )
}
