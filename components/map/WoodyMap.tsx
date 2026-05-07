'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { MapNodeData } from './useMapNodes'
import { latLngToVec3, nodeSurfaceRadius } from './useMapNodes'
import { MapNode } from './MapNode'
import { GlobeTerrainMesh } from './globeTerrainMaterial'
import type { PersonaLens } from '@/lib/types'
import { enrichmentSummaryLine, type EnrichedTrackData } from '@/lib/enrichment'
import { ZONE_SPECS } from '@/lib/mapZones'

export type SteerDirection = { azimuth: number; polar: number }

interface WoodyMapProps {
  nodes: MapNodeData[]
  trailTrackIds: string[]
  onNodeSelect: (node: MapNodeData) => void
  onNodeRejectRequest?: (node: MapNodeData) => void
  onSteer?: (dir: SteerDirection) => void
  hoveredId: string | null
  onHoverId: (id: string | null) => void
  energyPhase: number
  moodTint: 'amber' | 'violet' | 'moss'
  personaLens?: PersonaLens | null
  enrichmentMap?: Record<string, EnrichedTrackData>
  onZoneSelect?: (zoneId: string) => void
  rejectingTrackIds?: ReadonlySet<string>
  deepenedZoneIds?: string[]
  centroidSampleCount?: number
  tasteAvgEnergy?: number
  listeningContext?: string
  rejectedGhostPositions?: { x: number; y: number; z: number }[]
}

const GHOST_LATLNG: [number, number][] = [
  [0.15, 0.45],
  [0.32, 0.72],
  [-0.1, 0.55],
  [0.05, 0.9],
  [-0.25, 0.65],
  [0.4, 0.5],
  [0.22, 1.0],
  [-0.15, 0.85],
  [0.28, 0.38],
  [-0.05, 0.48],
  [0.12, 1.05],
  [-0.2, 0.95],
]

function hash01(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return (Math.abs(h) % 10000) / 10000
}

function hexToRgba35(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},0.35)`
}

const LABEL_SEP = ' - '

function splitTrackLabel(label: string): { name: string; artist: string } {
  const i = label.indexOf(LABEL_SEP)
  if (i === -1) return { name: label, artist: '' }
  return { name: label.slice(0, i), artist: label.slice(i + LABEL_SEP.length) }
}

export type ViewportRect = { width: number; height: number; left: number; top: number }

function projectWorldToScreen(
  world: THREE.Vector3,
  camera: THREE.Camera,
  vp: ViewportRect
): { x: number; y: number; behind: boolean; off: boolean } {
  const projected = world.clone().project(camera)
  const behind = projected.z > 1
  const off = Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1
  const x = (projected.x * 0.5 + 0.5) * vp.width + vp.left
  const y = (-projected.y * 0.5 + 0.5) * vp.height + vp.top
  return { x, y, behind, off }
}

type LabelEntry = {
  id: string
  x: number
  y: number
  show: boolean
  name: string
  artist: string
  enrichmentLine: string | null
  reason: string | null
}

function NodeLabels({
  nodes,
  hoveredId,
  cameraRef,
  sizeRef,
  enrichmentMap,
}: {
  nodes: MapNodeData[]
  hoveredId: string | null
  cameraRef: React.MutableRefObject<THREE.Camera | null>
  sizeRef: React.MutableRefObject<ViewportRect>
  enrichmentMap?: Record<string, EnrichedTrackData>
}) {
  const [entries, setEntries] = useState<LabelEntry[]>([])
  const anchor = useMemo(() => new THREE.Vector3(), [])
  const bump = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const camera = cameraRef.current
      const vp = sizeRef.current
      if (!camera || vp.width < 8 || vp.height < 8) {
        raf = requestAnimationFrame(tick)
        return
      }
      const next: LabelEntry[] = []
      for (const node of nodes) {
        if (!node.isPlaying && node.id !== hoveredId) continue
        const [lx, ly, lz] = latLngToVec3(
          node.lat,
          node.lng,
          nodeSurfaceRadius(node.isKnown, node.isPlaying)
        )
        anchor.set(lx, ly, lz)
        bump.copy(anchor).normalize().multiplyScalar(0.04)
        anchor.add(bump)
        const { x, y, behind, off } = projectWorldToScreen(anchor, camera, vp)
        const { name, artist } = splitTrackLabel(node.label)
        const enrichmentLine =
          node.isPlaying || node.id === hoveredId
            ? enrichmentSummaryLine(enrichmentMap?.[node.trackId])
            : null
        const showReason =
          node.id === hoveredId &&
          node.reason &&
          node.reason !== 'your map' &&
          node.reason !== 'save point'
        next.push({
          id: node.id,
          x,
          y,
          show: !behind && !off,
          name,
          artist,
          enrichmentLine,
          reason: showReason ? node.reason : null,
        })
      }
      setEntries(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [nodes, hoveredId, cameraRef, sizeRef, anchor, bump, enrichmentMap])

  return (
    <div className="pointer-events-none fixed inset-0 z-[12]" aria-hidden>
      {entries.map((entry) =>
        entry.show ? (
          <div
            key={entry.id}
            className="absolute text-center"
            style={{
              left: entry.x,
              top: entry.y,
              transform: 'translate(-50%, calc(-100% - 6px))',
              fontFamily: 'var(--font-inter), ui-sans-serif, system-ui',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#E8E4DC',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
                textShadow: '0 1px 6px rgba(0,0,0,0.95)',
              }}
            >
              {entry.name}
            </div>
            {entry.artist ? (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 9,
                  color: 'rgba(232,228,220,0.5)',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 6px rgba(0,0,0,0.95)',
                }}
              >
                {entry.artist}
              </div>
            ) : null}
            {entry.reason ? (
              <div
                style={{
                  marginTop: 4,
                  maxWidth: 200,
                  fontSize: 9,
                  fontFamily: 'var(--font-lora), Georgia, serif',
                  fontStyle: 'italic',
                  color: 'rgba(232,228,220,0.65)',
                  whiteSpace: 'normal',
                  lineHeight: 1.4,
                  textAlign: 'center',
                  textShadow: '0 1px 8px rgba(0,0,0,0.98)',
                }}
              >
                {entry.reason}
              </div>
            ) : null}
            {entry.enrichmentLine ? (
              <div
                style={{
                  marginTop: 3,
                  maxWidth: 220,
                  fontSize: 8,
                  color: 'rgba(232,228,220,0.42)',
                  whiteSpace: 'normal',
                  lineHeight: 1.35,
                  textAlign: 'center',
                  textShadow: '0 1px 6px rgba(0,0,0,0.95)',
                }}
                title={entry.enrichmentLine}
              >
                {entry.enrichmentLine}
              </div>
            ) : null}
          </div>
        ) : null
      )}
    </div>
  )
}

function CameraSync({
  cameraRef,
  sizeRef,
}: {
  cameraRef: React.MutableRefObject<THREE.Camera | null>
  sizeRef: React.MutableRefObject<ViewportRect>
}) {
  const { camera, gl } = useThree()
  useFrame(() => {
    cameraRef.current = camera
    const rect = gl.domElement.getBoundingClientRect()
    sizeRef.current = {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    }
    if (camera instanceof THREE.PerspectiveCamera && rect.width > 2 && rect.height > 2) {
      const nextAspect = rect.width / rect.height
      if (Math.abs(camera.aspect - nextAspect) > 0.001) {
        camera.aspect = nextAspect
        camera.updateProjectionMatrix()
      }
    }
  })
  return null
}

function TerritoryZoneMeshes({ deepenedZoneIds }: { deepenedZoneIds: string[] }) {
  const materialRefs = useRef<Record<string, THREE.MeshBasicMaterial | null>>({})
  const deepenTimeRef = useRef<Record<string, number>>({})
  const prevDeepenedRef = useRef<string[]>([])

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime()
    // Track when zones enter/leave deepened state
    for (const zone of ZONE_SPECS) {
      const isDeepened = deepenedZoneIds.includes(zone.id)
      const wasDeepened = prevDeepenedRef.current.includes(zone.id)
      if (isDeepened && !wasDeepened) {
        deepenTimeRef.current[zone.id] = now
      } else if (!isDeepened && wasDeepened) {
        delete deepenTimeRef.current[zone.id]
      }
    }
    prevDeepenedRef.current = deepenedZoneIds.slice()

    for (const zone of ZONE_SPECS) {
      const material = materialRefs.current[zone.id]
      if (!material) continue
      const isDeepened = deepenedZoneIds.includes(zone.id)
      if (!isDeepened) {
        material.opacity += (0.04 - material.opacity) * (1 - Math.exp(-delta / 0.4))
        continue
      }
      const t = deepenTimeRef.current[zone.id] != null ? now - deepenTimeRef.current[zone.id] : 0
      if (t < 0.2) {
        // Phase 1 (200ms): quick snap to 0.09
        material.opacity = 0.04 + 0.05 * Math.min(1, t / 0.2)
      } else {
        // Phase 2 (1200ms): ease to 0.14 with color warmth shift toward zone accent
        const t2 = Math.min(1, (t - 0.2) / 1.2)
        const eased = t2 < 0.5 ? 2 * t2 * t2 : 1 - Math.pow(-2 * t2 + 2, 2) / 2
        material.opacity = 0.09 + 0.05 * eased
        // Warm the color toward the zone's accent as it brightens
        const accent = new THREE.Color(zone.color)
        const cool = accent.clone().lerp(new THREE.Color('#1a1612'), 0.55)
        material.color.lerpColors(cool, accent, eased)
      }
    }
  })

  return (
    <>
      {ZONE_SPECS.map((zone) => (
        <mesh key={zone.id} position={[...zone.position]} scale={[1.6, 1.2, 1.6]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshBasicMaterial
            ref={(material) => {
              materialRefs.current[zone.id] = material
            }}
            color={zone.color}
            transparent
            opacity={0.04}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}

type ZoneLabelEntry = {
  id: string
  label: string
  x: number
  y: number
  show: boolean
  colorHex: string
}

function ZoneLabels({
  cameraRef,
  sizeRef,
  onZoneSelect,
}: {
  cameraRef: React.MutableRefObject<THREE.Camera | null>
  sizeRef: React.MutableRefObject<ViewportRect>
  onZoneSelect?: (zoneId: string) => void
}) {
  const [entries, setEntries] = useState<ZoneLabelEntry[]>([])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const camera = cameraRef.current
      const vp = sizeRef.current
      if (!camera || vp.width < 8 || vp.height < 8) {
        raf = requestAnimationFrame(tick)
        return
      }
      const next: ZoneLabelEntry[] = []
      for (const zone of ZONE_SPECS) {
        const anchor = new THREE.Vector3(...zone.position)
        const toCam = camera.position.clone().sub(anchor).normalize()
        const outward = anchor.clone().normalize()
        const facing = outward.dot(toCam) > 0.02
        const { x, y, behind, off } = projectWorldToScreen(anchor, camera, vp)
        next.push({
          id: zone.id,
          label: zone.label,
          x,
          y,
          show: facing && !behind && !off,
          colorHex: zone.color,
        })
      }
      setEntries(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [cameraRef, sizeRef])

  return (
    <div className="pointer-events-none fixed inset-0 z-[8]">
      {entries.map((entry) =>
        entry.show ? (
          <div
            key={entry.id}
            className="absolute whitespace-nowrap"
            style={{
              left: entry.x,
              top: entry.y,
              transform: 'translate(-50%, -50%)',
              fontFamily: 'var(--font-inter), ui-sans-serif, system-ui',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: onZoneSelect
                ? hexToRgba35(entry.colorHex).replace('0.35', '0.55')
                : hexToRgba35(entry.colorHex),
              pointerEvents: onZoneSelect ? 'auto' : 'none',
              cursor: onZoneSelect ? 'pointer' : 'default',
              padding: '6px 8px',
            }}
            onClick={() => onZoneSelect?.(entry.id)}
            role={onZoneSelect ? 'button' : undefined}
            aria-label={onZoneSelect ? `Deepen into ${entry.label}` : undefined}
          >
            {entry.label}
          </div>
        ) : null
      )}
    </div>
  )
}

function GhostTerritoryNodes() {
  return (
    <>
      {GHOST_LATLNG.map(([lat, lng], i) => (
        <mesh key={i} position={latLngToVec3(lat, lng, 1.012)} raycast={() => null}>
          <sphereGeometry args={[0.008, 10, 10]} />
          <meshBasicMaterial color="#4A4844" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

function NodeConnections({ nodes }: { nodes: MapNodeData[] }) {
  const segments = useMemo(() => {
    const points = nodes.map(
      (node) =>
        new THREE.Vector3(
          ...latLngToVec3(node.lat, node.lng, nodeSurfaceRadius(node.isKnown, node.isPlaying))
        )
    )
    const lines: [THREE.Vector3, THREE.Vector3][] = []
    const maxDistance = 0.55
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].distanceTo(points[j]) < maxDistance) {
          lines.push([points[i], points[j]])
        }
      }
    }
    return lines
  }, [nodes])

  return (
    <>
      {segments.map((pair, i) => (
        <Line
          key={i}
          points={[pair[0].toArray(), pair[1].toArray()]}
          color="#E8E4DC"
          opacity={0.08}
          transparent
          lineWidth={1}
        />
      ))}
    </>
  )
}

function TrailLine({ nodes, trailTrackIds }: { nodes: MapNodeData[]; trailTrackIds: string[] }) {
  const lineRef = useRef<{ material?: { opacity?: number } } | null>(null)
  const pointArrays = useMemo(() => {
    const byTrackId = new Map(nodes.map((node) => [node.trackId, node]))
    const arr: [number, number, number][] = []
    for (const trackId of trailTrackIds) {
      const node = byTrackId.get(trackId)
      if (node) {
        arr.push(latLngToVec3(node.lat, node.lng, nodeSurfaceRadius(node.isKnown, node.isPlaying)))
      }
    }
    return arr
  }, [nodes, trailTrackIds])

  useFrame(({ clock }) => {
    const opacity = 0.15 + 0.12 * Math.sin(clock.getElapsedTime() * 1.5)
    if (lineRef.current?.material && typeof lineRef.current.material.opacity === 'number') {
      lineRef.current.material.opacity = opacity
    }
  })

  if (pointArrays.length < 2) return null

  return (
    <Line
      ref={lineRef as never}
      points={pointArrays}
      color="#C4874A"
      opacity={0.22}
      transparent
      lineWidth={1}
    />
  )
}

function Scene({
  nodes,
  trailTrackIds,
  onNodeSelect,
  onNodeRejectRequest,
  onSteer,
  onHoverId,
  energyPhase,
  moodTint,
  personaLens: _personaLens,
  enrichmentMap,
  rejectingTrackIds,
  deepenedZoneIds,
  centroidSampleCount,
  tasteAvgEnergy,
  listeningContext,
  rejectedGhostPositions,
  cameraRef,
  sizeRef,
}: WoodyMapProps & {
  cameraRef: React.MutableRefObject<THREE.Camera | null>
  sizeRef: React.MutableRefObject<ViewportRect>
}) {
  void _personaLens
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const dragStart = useRef<{ az: number; po: number } | null>(null)

  useFrame(() => {
    controlsRef.current?.update?.()
  })

  return (
    <>
      <CameraSync cameraRef={cameraRef} sizeRef={sizeRef} />
      <color attach="background" args={['#0F0F0D']} />
      <fog attach="fog" args={['#0F0F0D', 3.5, 7.0]} />
      <ambientLight intensity={0.18} />
      <pointLight position={[3, 2, 4]} intensity={0.6} color="#E8E4DC" />
      <pointLight position={[-3, -1, -2]} intensity={0.12} color="#7C6BCE" />
      <pointLight position={[-2, 3, -1]} intensity={0.1} color="#4E6B45" />
      {/* Context tint -- additive ambient, keyed by listening context */}
      {listeningContext && listeningContext !== 'just_listening' && (
        <ambientLight
          color={
            listeningContext === 'running' ? '#5c3010'
            : listeningContext === 'working' ? '#0a1530'
            : /* exploring */ '#0a2015'
          }
          intensity={0.28}
        />
      )}

      <GlobeTerrainMesh
        moodTint={moodTint}
        breathe={{ energy: energyPhase, centroidSampleCount: centroidSampleCount ?? 0 }}
      />
      <TerritoryZoneMeshes deepenedZoneIds={deepenedZoneIds ?? []} />
      <GhostTerritoryNodes />
      {rejectedGhostPositions?.map((pos, i) => (
        <mesh key={`rejected-ghost-${i}`} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.06} depthWrite={false} />
        </mesh>
      ))}
      {nodes.length > 0 && <NodeConnections nodes={nodes} />}
      <TrailLine nodes={nodes} trailTrackIds={trailTrackIds} />

      {nodes.map((node) => (
        <MapNode
          key={node.id}
          data={node}
          onSelect={onNodeSelect}
          onHover={onHoverId}
          onRejectRequest={onNodeRejectRequest}
          isRejecting={rejectingTrackIds?.has(node.trackId) ?? false}
          rejectable={Boolean(onNodeRejectRequest)}
          staggerDelayMs={hash01(node.trackId) * 960}
          energyPhase={energyPhase}
          enrichmentHint={enrichmentSummaryLine(enrichmentMap?.[node.trackId])}
          previewUrl={node.track?.previewUrl}
          resonating={
            tasteAvgEnergy != null &&
            node.energyHint != null &&
            Math.abs(node.energyHint - tasteAvgEnergy) < 0.15
          }
        />
      ))}

      <OrbitControls
        ref={controlsRef as never}
        enablePan={false}
        target={[0, 0, 0]}
        minDistance={1.15}
      maxDistance={3.5}
        minPolarAngle={0.3}
        maxPolarAngle={2.2}
        rotateSpeed={0.45}
        zoomSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
        onStart={() => {
          const controls = controlsRef.current
          if (controls) {
            dragStart.current = {
              az: controls.getAzimuthalAngle(),
              po: controls.getPolarAngle(),
            }
          }
        }}
        onEnd={() => {
          const controls = controlsRef.current
          if (!controls || !onSteer || !dragStart.current) return
          const dAz = controls.getAzimuthalAngle() - dragStart.current.az
          const dPo = controls.getPolarAngle() - dragStart.current.po
          dragStart.current = null
          if (Math.hypot(dAz, dPo) > 0.08) onSteer({ azimuth: dAz, polar: dPo })
        }}
      />
    </>
  )
}

export function WoodyMap(props: WoodyMapProps) {
  const cameraRef = useRef<THREE.Camera | null>(null)
  const sizeRef = useRef<ViewportRect>({ width: 0, height: 0, left: 0, top: 0 })

  return (
    <div className="fixed inset-0 z-0 touch-none">
      <Canvas
        className="absolute inset-0 w-full h-full block"
        camera={{ position: [0, 0.02, 2.48], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene {...props} cameraRef={cameraRef} sizeRef={sizeRef} />
        </Suspense>
      </Canvas>
      <ZoneLabels cameraRef={cameraRef} sizeRef={sizeRef} onZoneSelect={props.onZoneSelect} />
      <NodeLabels
        nodes={props.nodes}
        hoveredId={props.hoveredId}
        cameraRef={cameraRef}
        sizeRef={sizeRef}
        enrichmentMap={props.enrichmentMap}
      />
    </div>
  )
}
