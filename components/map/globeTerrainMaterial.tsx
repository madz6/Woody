'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'

const vertexShader = /* glsl */ `
uniform float uTime;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying float vElevation;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n =
    mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  return n * 2.0 - 1.0;
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  mat3 m = mat3(0.8, 0.6, 0.0, -0.6, 0.8, 0.0, 0.0, 0.0, 1.0);
  for (int i = 0; i < 4; i++) {
    v += a * noise3(p);
    p = m * p * 2.1 + uTime * 0.012;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 npos = normalize(position);
  vec3 p = npos * 2.4 + uTime * 0.018;
  float coarse = fbm(p);
  float fine = fbm(npos * 6.2 + coarse * 0.8) * 0.35;
  float elev = coarse * 0.72 + fine;
  vElevation = elev * 0.5 + 0.5;
  float disp = elev * 0.034;
  vec3 newPos = position + normal * disp;
  vWorldNormal = normalize(normalMatrix * normal);
  vWorldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uCameraPos;
uniform vec3 uMoodTint;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying float vElevation;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);
  float ndv = max(dot(N, V), 0.0);

  vec3 soil = vec3(0.118, 0.106, 0.095);
  vec3 uplift = vec3(0.14, 0.125, 0.11) * (0.15 + vElevation * 0.2);
  vec3 base = soil + uplift;

  float h = vElevation * 18.0;
  float band = abs(fract(h) - 0.5);
  float contour = (1.0 - smoothstep(0.0, 0.085, band)) * 0.11;

  vec3 contourCol = vec3(0.93, 0.90, 0.84) * contour;

  float rim = pow(1.0 - ndv, 3.2);
  vec3 spaceRim = vec3(0.18, 0.16, 0.28) * rim * 0.35;
  vec3 coolLift = vec3(0.12, 0.14, 0.22) * rim * 0.12;

  vec3 mood = uMoodTint * 0.06 * (0.4 + vElevation * 0.6);
  vec3 col = base + contourCol + spaceRim + coolLift + mood;

  gl_FragColor = vec4(col, 1.0);
}
`

const TerrainGlobeMaterial = shaderMaterial(
  {
    uTime: 0,
    uCameraPos: new THREE.Vector3(0, 0, 3),
    uMoodTint: new THREE.Vector3(0.49, 0.42, 0.81),
  },
  vertexShader,
  fragmentShader
)

const MOOD_VEC: Record<'amber' | 'violet' | 'moss', THREE.Vector3> = {
  amber: new THREE.Vector3(0.77, 0.53, 0.29),
  violet: new THREE.Vector3(0.49, 0.42, 0.81),
  moss: new THREE.Vector3(0.31, 0.42, 0.27),
}

interface GlobeTerrainMeshProps {
  moodTint: 'amber' | 'violet' | 'moss'
  breathe?: {
    energy: number
    centroidSampleCount: number
  }
}

export function GlobeTerrainMesh({ moodTint, breathe }: GlobeTerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const material = useMemo(() => new TerrainGlobeMaterial(), [])
  useEffect(() => () => material.dispose(), [material])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.02
    material.uTime = clock.getElapsedTime()
    material.uCameraPos.copy(camera.position)
    material.uMoodTint.copy(MOOD_VEC[moodTint])

    if (breathe) {
      const confidence = Math.min(1, breathe.centroidSampleCount / 10)
      const breathHz = 0.5 + breathe.energy
      const phase = clock.getElapsedTime() * Math.PI * 2 * breathHz
      const amplitude = breathe.energy * 0.008 * confidence
      meshRef.current.scale.setScalar(1 + amplitude * Math.sin(phase))
    } else {
      meshRef.current.scale.setScalar(1)
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.965, 128, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
