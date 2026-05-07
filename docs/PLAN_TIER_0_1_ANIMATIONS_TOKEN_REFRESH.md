# Woody Build Plan: Tier 0 + Tier 1 + Animations + Token Refresh

**Scope**: Build the learning foundation + high-impact animations + session persistence.

**Timeline**: ~3-5 days of focused implementation.

**Goal**: Transform Woody from a static suggestion tool into a system that learns from rejection, personalises future suggestions, and feels alive through animation.

---

## Context

Woody's core loop is broken: when a track is wrong, the system doesn't know. Without rejection signal, personalisation cannot learn. This plan builds:

1. **Tier 0** — Rejection foundation (track limit, rejection data model, rejection UI)
2. **Tier 1** — Learning foundation (IntentMemory: store what was played/rejected, retrieve on next intent)
3. **Animations** — Tier I high-impact elements (node landing, zone awakening, rejection animation, trail glow)
4. **Token Refresh** — Session persistence (no more 401s after 1 hour)

Together these unlock the possibility of personalisation and make the globe feel responsive.

---

## Scope: What We Build

| # | Feature | Tier | Files Touched | Lines Changed |
|---|---------|------|---------------|---------------|
| 1 | Track limit 4→8 | 0 | `lib/intent.ts` | 10 |
| 2 | Rejection data model + storage | 0 | `lib/types.ts`, `lib/memory.ts` | 40 |
| 3 | "Not this" UI (player + map) | 0 | `MiniPlayer.tsx`, `MapNode.tsx`, `WoodyMap.tsx`, `HomeScreen.tsx` | 150 |
| 4 | IntentMemory model + localStorage | 1 | `lib/types.ts`, `lib/memory.ts` | 80 |
| 5 | Intent memory read at parse time | 1 | `lib/intent.ts`, `app/api/intent/route.ts` | 60 |
| 6 | Intent memory write after session | 1 | `lib/memory.ts`, `HomeScreen.tsx` | 70 |
| 7 | Node landing animation | I | `MapNode.tsx`, `WoodyMap.tsx` | 80 |
| 8 | Zone awakening | I | `WoodyMap.tsx`, `HomeScreen.tsx` | 50 |
| 9 | Rejection animation | I | `MapNode.tsx` | 60 |
| 10 | Trail glow pulse | I | `WoodyMap.tsx` | 30 |
| 11 | Token auto-refresh (45min) | — | `lib/player.ts`, `HomeScreen.tsx` | 40 |

**Total**: ~660 lines of new/modified code across 11 changes.

---

## Deferred (not in this session)

- **Tier 2**: Context modes (data model, switcher UI, scoped memory)
- **Tier 3**: "Woody knows you" signal, per-context taste summary
- **Playback**: volume control, device selector, repeat/shuffle
- **HomeScreen extraction**: usePlayback, useWoodySession, useMapState hooks
- **Settings panel**: full user settings surface
- **Multi-user**: user identity namespace, Supabase sync
- **Constellation mode**, taste fingerprint, harmonic web, 30s preview

---

## Design Decisions

### D1. Rejection scope — dual-layered

**Per-session (immediate)**:
- `rejectedIds: Set<string>` in HomeScreen state
- Filters out of `suggestions` and `sessionQueue` client-side
- Persisted in `Session.rejectedTrackIds` for the session record
- No API call needed for immediate feedback

**Persistent (learning)**:
- Accumulated into `IntentMemoryEntry.rejectedIds` at session end
- Fed as `excludeTrackIds` on next similar intent
- Applied as post-search filter on `/api/intent` route
- Never re-suggests rejected tracks under the same intent context

**Rationale**: Immediate response (client filter) + long-term learning (IntentMemory).

### D2. IntentMemory key — canonical tuple from PersonaLens

Exact string match won't work ("slow run" ≠ "a slow run"). Key by a normalized tuple derived from the AI-parsed PersonaLens:

```
key = `${energy}:${moods.sort().join(',')}:${tempo}`
```

Example:
```
"low:contemplative,introspective,nocturnal:slow"
```

**Rationale**: Naturally groups semantically similar intents without over-merging. Under-merging is better than over-merging — if two intents map to the same key, they should have similar taste profiles.

### D3. Track limit — 8

Doubles suggestion density without globe clutter. `useMapNodes` placement jitters by hash, so 8 nodes spread naturally without overlap.

**Rationale**: Felt difference between 4 and 8 is meaningful ("thin" → "territory-like"). 12+ causes visual clutter.

### D4. Rejection feedback path — client-side filter + API exclusion

**Immediate**: Client filters `suggestions` and `sessionQueue` (no API call). Instant visual feedback.

**Persistent**: `excludeTrackIds` sent to `/api/intent` on next parse. Applied post-Spotify-search before final top-8 selection.

**Rationale**: Dual approach avoids network round-trip for immediate feedback while ensuring permanent learning.

### D5. Intent memory injection — prompt bias + post-search filter

**Prompt bias**: Learned `avgEnergy` and `dominantTones` injected into the AI prompt as a note. Influences how searchQueries are generated.

**Post-search filter**: `rejectedIds` applied as a hard filter on the server after Spotify search and deduplication, before top-8 slice.

**Rationale**: The prompt bias gently nudges the AI toward the user's territory. The post-search filter ensures we never surface a previously rejected track.

### D6. Animations — all useFrame-based, no springs

Consistent with existing codebase pattern (BPM breathing, click pulse, hover scale). No framer-motion in Three.js layer.

Birth-time tracking per MapNode instance for landing animation: `mount = new node`, no parent coordination needed.

**Rationale**: Performance + consistency + simplicity.

---

## New Types

### `lib/types.ts` — additions

```typescript
// Add to PersonaLens (formalise what AI returns):
searchQueries?: string[]    // Spotify search queries
spotifyGenres?: string[]    // Spotify genre seeds

// Extend SessionTrack signal union:
signal?: 'kept' | 'skipped' | 'shifted' | 'rejected'

// Add to Session:
rejectedTrackIds?: string[]

// New interfaces:
export interface IntentMemoryEntry {
  intentKey: string                     // "energy:mood1,mood2:tempo"
  playedEnergies: number[]              // 0-1 floats from audioAttributes
  playedTones: TrackSuggestion['tone'][]
  rejectedIds: string[]                 // Spotify track IDs
  sessionIds: string[]                  // Session IDs this entry appears in
  updatedAt: string                     // ISO date, for FIFO pruning
}

export interface IntentMemory {
  v: 1
  entries: IntentMemoryEntry[]
}
```

---

## Changes by File — Implementation Order

### Phase A — Types + track limit + rejection model (no dependencies)

#### 1. `lib/types.ts`

```typescript
// ADD to PersonaLens:
searchQueries?: string[]
spotifyGenres?: string[]

// CHANGE SessionTrack signal union:
signal?: 'kept' | 'skipped' | 'shifted' | 'rejected'

// ADD to Session:
rejectedTrackIds?: string[]

// ADD new interfaces:
export interface IntentMemoryEntry {
  intentKey: string
  playedEnergies: number[]
  playedTones: TrackSuggestion['tone'][]
  rejectedIds: string[]
  sessionIds: string[]
  updatedAt: string
}

export interface IntentMemory {
  v: 1
  entries: IntentMemoryEntry[]
}
```

#### 2. `lib/intent.ts` — track limit + exclude filter

```typescript
// CHANGE: intentToSuggestions signature
export async function intentToSuggestions(
  intentText: string,
  tasteProfile?: TasteProfile | null,
  previousLens?: PersonaLens | null,
  zoneId?: string | null,
  excludeTrackIds?: string[]      // NEW param
): Promise<{ suggestions: TrackSuggestion[]; personaLens: PersonaLens }>

// CHANGE: increase limits
const [search1, search2, recos, zoneSearch] = await Promise.all([
  searchQueries[0] ? searchTracks(searchQueries[0], 5).catch(() => []) : Promise.resolve([]),
  searchQueries[1] ? searchTracks(searchQueries[1], 5).catch(() => []) : Promise.resolve([]),
  getRecommendations({
    seedGenres: spotifyGenres,
    targetEnergy:  lens.energy === 'high' ? 0.8 : lens.energy === 'low' ? 0.3 : 0.5,
    targetValence: lens.mood.some(m => ['sad','melancholy','dark'].includes(m)) ? 0.25
                 : lens.mood.some(m => ['happy','euphoric','bright'].includes(m)) ? 0.8 : 0.5,
    limit: zoneQuery ? 8 : 10,
  }).catch(() => []),
  zoneQuery ? searchTracks(zoneQuery, 6).catch(() => []) : Promise.resolve([]),
])

// CHANGE: dedup + filter
const seen = new Set<string>()
const pool = zoneQuery
  ? [...zoneSearch, ...recos, ...search1, ...search2]
  : [...recos, ...search1, ...search2]
const unique = pool.filter(t => {
  if (seen.has(t.id)) return false
  if (excludeTrackIds?.includes(t.id)) return false  // NEW: filter excluded
  seen.add(t.id)
  return true
})

const selected = unique.slice(0, 8)  // CHANGE: 4 → 8
```

### Phase B — Rejection storage + IntentMemory (depends on A)

#### 3. `lib/memory.ts` — rejection + intent memory storage

```typescript
// NEW constants
const STORAGE_INTENT_MEMORY = 'woody_intent_memory_v1'

// NEW: build intent key from PersonaLens
export function buildIntentKey(lens: PersonaLens): string {
  const moods = lens.mood.sort().join(',')
  return `${lens.energy}:${moods}:${lens.tempo}`
}

// NEW: read IntentMemory from localStorage
export function getIntentMemory(): IntentMemory {
  try {
    const raw = localStorage.getItem(STORAGE_INTENT_MEMORY)
    if (!raw) return { v: 1, entries: [] }
    return JSON.parse(raw) as IntentMemory
  } catch {
    return { v: 1, entries: [] }
  }
}

// NEW: get specific entry
export function getIntentMemoryEntry(intentKey: string): IntentMemoryEntry | null {
  const memory = getIntentMemory()
  return memory.entries.find(e => e.intentKey === intentKey) ?? null
}

// NEW: record rejection in current session
export function recordRejection(sessionId: string, trackId: string): void {
  const sessions = getSessions()
  const session = sessions.find(s => s.id === sessionId)
  if (!session) return
  if (!session.rejectedTrackIds) session.rejectedTrackIds = []
  if (!session.rejectedTrackIds.includes(trackId)) {
    session.rejectedTrackIds.push(trackId)
    saveSession(session)
  }
}

// NEW: write IntentMemory from a completed session
export function writeIntentMemoryFromSession(session: Session): void {
  const lens = session.personaLens
  const intentKey = buildIntentKey(lens)
  
  const memory = getIntentMemory()
  let entry = memory.entries.find(e => e.intentKey === intentKey)
  
  if (!entry) {
    entry = {
      intentKey,
      playedEnergies: [],
      playedTones: [],
      rejectedIds: [],
      sessionIds: [],
      updatedAt: new Date().toISOString(),
    }
    memory.entries.push(entry)
  }
  
  // Append played energies and tones from session
  for (const track of session.suggestions) {
    if (track.audioAttributes?.energy) {
      entry.playedEnergies.push(track.audioAttributes.energy)
    }
    entry.playedTones.push(track.tone)
  }
  
  // Append rejected IDs from session
  if (session.rejectedTrackIds) {
    entry.rejectedIds.push(...session.rejectedTrackIds)
  }
  
  entry.sessionIds.push(session.id)
  entry.updatedAt = new Date().toISOString()
  
  // Cap arrays (FIFO)
  entry.playedEnergies = entry.playedEnergies.slice(-50)
  entry.playedTones = entry.playedTones.slice(-50)
  entry.rejectedIds = entry.rejectedIds.slice(-100)
  
  localStorage.setItem(STORAGE_INTENT_MEMORY, JSON.stringify(memory))
}

// NEW: get learned bias for an intent
export function getLearnedBiasForIntent(lens: PersonaLens): { 
  avgEnergy?: number
  dominantTones?: string[] 
  excludeTrackIds: string[] 
} {
  const entry = getIntentMemoryEntry(buildIntentKey(lens))
  if (!entry) return { excludeTrackIds: [] }
  
  const avgEnergy = entry.playedEnergies.length > 0
    ? entry.playedEnergies.reduce((a, b) => a + b, 0) / entry.playedEnergies.length
    : undefined
  
  const toneCounts = new Map<string, number>()
  for (const tone of entry.playedTones) {
    toneCounts.set(tone, (toneCounts.get(tone) ?? 0) + 1)
  }
  const dominantTones = Array.from(toneCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tone]) => tone)
  
  return {
    avgEnergy,
    dominantTones: dominantTones.length > 0 ? dominantTones : undefined,
    excludeTrackIds: entry.rejectedIds,
  }
}

// UPDATE: serializeSession to include rejectedTrackIds
export function serializeSession(session: Session): string {
  return JSON.stringify({
    ...session,
    rejectedTrackIds: session.rejectedTrackIds || [],
  })
}

// UPDATE: deserializeSession
export function deserializeSession(json: string): Session {
  const parsed = JSON.parse(json) as Session
  return {
    ...parsed,
    rejectedTrackIds: parsed.rejectedTrackIds || [],
  }
}
```

#### 4. `app/api/intent/route.ts` — accept new fields

```typescript
// CHANGE: destructure new fields from body
const { 
  intent, 
  tasteProfile, 
  previousIntent, 
  previousLens: previousLensRaw, 
  zoneId,
  excludeTrackIds,     // NEW
  learnedBias,         // NEW
} = body

// CHANGE: pass to intentToSuggestions
const zoneIdSafe = typeof zoneId === 'string' && zoneId.length > 0 ? zoneId : null
const excludeTrackIdsSafe = Array.isArray(excludeTrackIds) ? excludeTrackIds : []

const { suggestions, personaLens } = await intentToSuggestions(
  trimmed,
  tasteProfile ?? null,
  lensForParse,
  zoneIdSafe,
  excludeTrackIdsSafe  // NEW param
)
```

### Phase C — Rejection UI + animations (depends on B)

#### 5. `components/player/MiniPlayer.tsx` — "Not this" button

```typescript
// CHANGE: add onReject prop
interface MiniPlayerProps {
  onSaveClick: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
  onReject?: () => void  // NEW
}

// ADD: reject button before save button (in the control row)
{onReject && (
  <button
    type="button"
    onClick={onReject}
    className="rounded-full border border-white/[0.08] p-2.5 text-text-mid hover:text-rose hover:border-rose/30 transition-colors"
    title="Not this"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="8" x2="16" y2="16" />
      <line x1="16" y1="8" x2="8" y2="16" />
    </svg>
  </button>
)}
```

#### 6. `components/map/MapNode.tsx` — landing + rejection animations

```typescript
// CHANGE: add new props and refs
interface MapNodeProps {
  data: MapNodeData
  onSelect: (data: MapNodeData) => void
  onHover: (id: string | null) => void
  energyPhase: number
  enrichmentHint?: string | null
  onReject?: (data: MapNodeData) => void  // NEW
  staggerDelay?: number                    // NEW
}

// ADD: birth-time tracking for landing animation
const birthTimeRef = useRef(-1)
const rejectT0Ref = useRef<number | null>(null)

// IN useFrame, after breathing calculations:
// Landing animation
if (birthTimeRef.current < 0) {
  birthTimeRef.current = t
}
const age = t - birthTimeRef.current - (staggerDelay ?? 0)
let landingProgress = Math.max(0, Math.min(1, age / 0.6))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
landingProgress = easeOutCubic(landingProgress)

// Apply landing: opacity fade-in + position drift
const landingOpacity = landingProgress
const landingDrift = (1 - landingProgress) * 0.03

// Rejection animation
let rejectProgress = 0
if (rejectT0Ref.current != null) {
  rejectProgress = Math.max(0, Math.min(1, (t - rejectT0Ref.current) / 0.8))
  if (rejectProgress >= 1) {
    onReject?.(data)
    return // Don't render
  }
}
const easeInCubic = (t: number) => t * t * t
const rejectEased = easeInCubic(rejectProgress)

// Combine animations
const finalOpacity = Math.max(0, landingOpacity * (1 - rejectProgress * 0.8))
const finalDrift = landingDrift + (rejectEased * 0.08)

// Apply to core material
const mat = core.material as THREE.MeshStandardMaterial
mat.opacity = finalOpacity
if (landingProgress < 1 || rejectProgress > 0) {
  mat.transparent = true
} else {
  mat.transparent = false
}

// Apply position adjustment (add to existing group positioning)
const driftVec = nodePosition.clone().normalize().multiplyScalar(finalDrift)
g.position.copy(new THREE.Vector3(x, y, z).add(driftVec))

// ADD: "Not this" hover button
{hovered && onReject ? (
  <Html position={[0, r0 * 3.8, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
    <button
      onClick={() => { 
        rejectT0Ref.current = clock.getElapsedTime()
      }}
      style={{
        pointerEvents: 'auto',
        padding: '4px 10px',
        fontSize: '10px',
        fontWeight: 500,
        borderRadius: '12px',
        border: '1px solid rgba(140,92,92,0.3)',
        backgroundColor: 'rgba(15,15,13,0.95)',
        color: 'rgba(232,228,220,0.65)',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all 150ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(140,92,92,0.6)'
        e.currentTarget.style.color = 'rgba(232,228,220,0.9)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(140,92,92,0.3)'
        e.currentTarget.style.color = 'rgba(232,228,220,0.65)'
      }}
    >
      not this
    </button>
  </Html>
) : null}
```

#### 7. `components/map/WoodyMap.tsx` — prop threading + zone awakening + trail glow

```typescript
// CHANGE: add props to WoodyMapProps
interface WoodyMapProps {
  // ...existing props...
  onNodeReject?: (node: MapNodeData) => void     // NEW
  deepenedZoneIds?: string[]                     // NEW
}

// CHANGE: thread to MapNode
{nodes.map((n, i) => (
  <MapNode
    key={n.id}
    data={n}
    onSelect={onNodeSelect}
    onHover={onHover}
    energyPhase={energyPhase}
    enrichmentHint={enrichmentSummaryLine(enrichmentMap?.[n.trackId])}
    onReject={onNodeReject}  // NEW
    staggerDelay={i * 0.12}  // NEW
  />
))}

// CHANGE: update TerritoryZoneMeshes to accept deepenedZoneIds
function TerritoryZoneMeshes({ deepenedZoneIds = [] }: { deepenedZoneIds?: string[] }) {
  const opacityRefs = useRef<Map<string, number>>(new Map())
  
  useFrame((_, delta) => {
    const refs = opacityRefs.current
    for (const z of ZONE_SPECS) {
      const target = deepenedZoneIds.includes(z.id) ? 0.14 : 0.04
      const current = refs.get(z.id) ?? 0.04
      const next = current + (target - current) * (1 - Math.exp(-delta / 0.5))
      refs.set(z.id, next)
    }
  })
  
  return (
    <>
      {ZONE_SPECS.map((z) => (
        <mesh key={z.id} position={[...z.position]} scale={[1.6, 1.2, 1.6]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshBasicMaterial 
            color={z.color} 
            transparent 
            opacity={opacityRefs.current.get(z.id) ?? 0.04} 
            depthWrite={false} 
          />
        </mesh>
      ))}
    </>
  )
}

// PASS deepenedZoneIds to TerritoryZoneMeshes in Scene:
<TerritoryZoneMeshes deepenedZoneIds={props.deepenedZoneIds} />

// CHANGE: update TrailLine for glow pulse
function TrailLine({ nodes, trailTrackIds }: { nodes: MapNodeData[]; trailTrackIds: string[] }) {
  const pointArrays = useMemo(() => {
    const byTrackId = new Map(nodes.map((n) => [n.trackId, n]))
    const arr: [number, number, number][] = []
    for (const tid of trailTrackIds) {
      const n = byTrackId.get(tid)
      if (n) arr.push(latLngToVec3(n.lat, n.lng, nodeSurfaceRadius(n.isKnown, n.isPlaying)))
    }
    return arr
  }, [nodes, trailTrackIds])

  const opacityRef = useRef(0.22)
  
  useFrame((_, delta) => {
    const baseOpacity = 0.22
    const variation = 0.12
    const cycle = Math.sin(Date.now() * 0.001 * 1.5) // 1.5 cycles/sec
    opacityRef.current = baseOpacity + cycle * variation
  })

  if (pointArrays.length < 2) return null

  return (
    <Line
      points={pointArrays}
      color="#C4874A"
      opacity={opacityRef.current}
      transparent
      lineWidth={1}
    />
  )
}
```

### Phase D — Learning pipeline wiring (depends on B+C)

#### 8. `components/screens/HomeScreen.tsx` — orchestration

```typescript
// ADD: new state for rejection
const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set())
const [deepenedZoneIds, setDeepenedZoneIds] = useState<string[]>([])

// NEW: handle track rejection
const handleRejectTrack = useCallback((trackId: string) => {
  setRejectedIds((prev) => {
    const next = new Set(prev)
    next.add(trackId)
    return next
  })
  
  setSuggestions((prev) => prev.filter((s) => s.track.id !== trackId))
  setSessionQueue((prev) => {
    const filtered = prev.filter((n) => n.trackId !== trackId)
    if (filtered.length < prev.length) {
      // Adjust queueIndex if needed
      const newIdx = Math.max(-1, Math.min(queueIndexRef.current, filtered.length - 1))
      setQueueIndex(newIdx)
      queueIndexRef.current = newIdx
    }
    sessionQueueRef.current = filtered
    return filtered
  })
  
  recordRejection(currentSessionId ?? '', trackId)
  
  if (currentTrackId === trackId) {
    void handleQueueNextRef.current()
  }
  
  logEvent('track_rejected', { trackId, sessionId: currentSessionId })
}, [currentSessionId, currentTrackId])

// CHANGE: handleIntent to write IntentMemory and read learned bias
const handleIntent = useCallback(async (intent: string) => {
  clearPersistedSessionPlayback()
  setLoading(true)
  setError(null)
  setRejectedIds(new Set())         // NEW: clear rejections
  setDeepenedZoneIds([])            // NEW: clear zone deepening
  logEvent('intent_submitted', { intentLen: intent.length })
  
  const previousIntent = lastIntent.trim() || undefined
  const previousLens = lastLens ?? undefined
  
  setLastIntent(intent)
  setRecentIntent(intent)
  
  try {
    // NEW: write previous session's learning
    if (currentSessionId && suggestions.length > 0) {
      const session = getSessionById(currentSessionId)
      if (session) {
        session.rejectedTrackIds = Array.from(rejectedIds)
        writeIntentMemoryFromSession(session)
      }
    }
    
    // NEW: get learned bias
    const learnedBias = lastLens 
      ? getLearnedBiasForIntent(lastLens)
      : undefined
    
    const tasteProfile = buildTasteProfile()
    const res = await fetch('/api/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent,
        tasteProfile: tasteProfile.sessionCount > 0 ? tasteProfile : undefined,
        previousIntent,
        previousLens,
        learnedBias,  // NEW
      }),
    })
    
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'nothing in range — try shifting the vibe')
      return
    }
    
    logEvent('intent_succeeded', { suggestionCount: (data.suggestions ?? []).length })
    setSuggestions(data.suggestions ?? [])
    if (data.mode) setIntentMode(data.mode as 'layer' | 'redirect')
    if (data.personaLens) setLastLens(data.personaLens as PersonaLens)
    
    // ... rest of handleIntent ...
  } catch (err) {
    console.error(err)
    setError('could not reach the server')
  } finally {
    setLoading(false)
  }
}, [lastIntent, lastLens, currentSessionId, suggestions, rejectedIds])

// UPDATE: handleZoneDeepen to track deepened zones
const handleZoneDeepen = useCallback(async (zoneId: string) => {
  if (!lastIntent.trim()) return
  logEvent('zone_deepen', { zoneId })
  setDeepenedZoneIds((prev) => [...new Set([...prev, zoneId])])  // NEW: track
  
  setLoading(true)
  setError(null)
  try {
    const tasteProfile = buildTasteProfile()
    const res = await fetch('/api/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: lastIntent,
        tasteProfile: tasteProfile.sessionCount > 0 ? tasteProfile : undefined,
        previousLens: lastLens ?? undefined,
        zoneId,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'nothing in range — try shifting the vibe')
      return
    }
    const newSuggestions: TrackSuggestion[] = data.suggestions ?? []
    const existingIds = new Set(suggestions.map((s) => s.track.id))
    const fresh = newSuggestions.filter((s) => !existingIds.has(s.track.id))
    if (fresh.length > 0) {
      setSuggestions((prev) => [...prev, ...fresh])
      logEvent('zone_deepen_succeeded', { zoneId, freshCount: fresh.length })
    } else {
      setError('already deep in this zone — try steering instead')
    }
  } catch (err) {
    console.error(err)
    setError('could not reach the server')
  } finally {
    setLoading(false)
  }
}, [lastIntent, lastLens, suggestions])

// CHANGE: pass new props to WoodyMap
<WoodyMap
  nodes={mapNodes}
  trailTrackIds={trailTrackIds}
  onNodeSelect={(n) => void handleNodeSelect(n)}
  onSteer={handleSteer}
  hoveredId={hoveredId}
  onHoverId={setHoveredId}
  energyPhase={energyPhase}
  moodTint={moodTint}
  personaLens={lastLens}
  enrichmentMap={enrichmentMap}
  onZoneSelect={suggestions.length > 0 ? (id) => void handleZoneDeepen(id) : undefined}
  onNodeReject={handleRejectTrack}  // NEW
  deepenedZoneIds={deepenedZoneIds}  // NEW
/>

// CHANGE: pass onReject to MiniPlayer
<MiniPlayer
  onSaveClick={() => setSaveOpen(true)}
  onNext={sessionQueue.length > 0 ? () => void handleQueueNext() : undefined}
  onPrev={sessionQueue.length > 0 ? () => void handleQueuePrev() : undefined}
  hasNext={hasQueueNext}
  hasPrev={hasQueuePrev}
  onReject={currentTrackId ? () => handleRejectTrack(currentTrackId) : undefined}  // NEW
/>
```

### Phase E — Token refresh (independent)

#### 9. `lib/player.ts` — add refresh method

```typescript
// ADD: refresh method to woodyPlayer object
refreshAccessToken: async function (): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/token', { credentials: 'include' })
    const data = await res.json()
    if (!data.token) return false
    
    const tokenChanged = data.token !== accessToken
    accessToken = data.token
    
    if (tokenChanged && isSDKReady) {
      try {
        await this.init(data.token)
      } catch (e) {
        console.error('Failed to reinit Spotify SDK with new token:', e)
        return false
      }
    }
    return true
  } catch (e) {
    console.error('Token refresh failed:', e)
    return false
  }
}
```

#### 10. `components/screens/HomeScreen.tsx` — refresh interval

```typescript
// ADD: token refresh effect (after Spotify init effect)
useEffect(() => {
  if (!hasSpotify || !woodyPlayer.isReady()) return
  
  const refreshInterval = setInterval(async () => {
    if (document.visibilityState !== 'visible') return  // Skip if tab hidden
    
    const success = await woodyPlayer.refreshAccessToken()
    if (!success) {
      setHasSpotify(false)
      setPlayerError('Session expired — reconnect Spotify')
    }
  }, 45 * 60 * 1000)  // Every 45 minutes
  
  return () => clearInterval(refreshInterval)
}, [hasSpotify])
```

---

## Data Flows

### Rejection Flow

```
User taps "not this" (MiniPlayer or MapNode hover)
  ↓
HomeScreen.handleRejectTrack(trackId)
  ├→ setRejectedIds(add)              // UI filters immediately
  ├→ setSuggestions(filter out)       // Node begins rejection animation
  ├→ setSessionQueue(filter out)      // Skip in queue
  ├→ recordRejection(sessionId, trackId)  // Persist to session localStorage
  ├→ if playing, handleQueueNext()    // Auto-advance
  └→ logEvent('track_rejected')
```

### Intent Memory Write (Session End)

```
User submits new intent
  ↓
handleIntent called
  ├→ if currentSessionId && suggestions.length > 0:
  │   └→ writeIntentMemoryFromSession(session)
  │       ├→ buildIntentKey(session.personaLens)
  │       ├→ upsert IntentMemoryEntry
  │       ├→ append playedEnergies from audioAttributes
  │       ├→ append playedTones from suggestions
  │       ├→ append rejectedTrackIds from session
  │       ├→ cap arrays (FIFO)
  │       └→ save to localStorage
  │
  └→ POST /api/intent { intent, ... }
```

### Intent Memory Read (New Session)

```
User submits intent
  ↓
handleIntent calls /api/intent
  ├→ getLearnedBiasForIntent(lastLens)
  │   ├→ buildIntentKey → lookup entry
  │   └→ compute { avgEnergy, dominantTones, excludeTrackIds }
  │
  └→ POST /api/intent { 
      intent, 
      learnedBias,        // NEW: { avgEnergy, dominantTones }
      excludeTrackIds,    // NEW: from previous rejections
      ...
    }
      ↓
    /api/intent route
      ├→ parseIntent(text, taste, prevLens, learnedBias)
      │   └→ AI prompt includes: "Learned: this listener plays ~0.45 energy, violet/moss"
      │
      ├→ Spotify search (10+5+5 ≈ 20 raw)
      ├→ dedup
      ├→ filter excludeTrackIds
      ├→ top 8
      ├→ generateReasonsWithAudio
      └→ return suggestions
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Reject currently playing + only track in queue | `handleQueueNext` hits end, player stops (guard handles) |
| Reject all suggestions | `suggestions` empties → UI returns to intent input |
| Same intent key from different intents | Intentional — same sonic territory, same preferences |
| localStorage quota | IntentMemory caps: 50 energies, 50 tones, 100 rejectedIds per entry |
| Token refresh returns different user | Accepted for now — SDK would fail later |
| Landing animation on memory nodes | Memory nodes mount aged → animation complete, no visual effect |
| Zone awakened then new intent | `deepenedZoneIds` resets → opacity animates back to 0.04 |
| Rejection during async enrichment | Enrichment updates enrichmentMap harmlessly — track already filtered |
| Tap "not this" while rejection animating | Animation guards against clicks (disabled during animation) |

---

## Verification Checklist

- [ ] 1. **Track limit**: Submit intent → see 8 suggestion nodes on globe (was 4)
- [ ] 2. **Rejection (MiniPlayer)**: Play track → tap ⊗ → track dims + drifts away → auto-advances → rejected track doesn't reappear
- [ ] 3. **Rejection (map node)**: Hover node → "not this" pill appears → click → rejection animation plays → node removed
- [ ] 4. **IntentMemory write**: Submit intent → play some tracks → reject some → submit new intent → check `localStorage` for `woody_intent_memory_v1` entry with played energies + rejected IDs
- [ ] 5. **IntentMemory read**: Submit similar intent again → previously rejected tracks should not appear in suggestions
- [ ] 6. **Node landing**: Submit intent → nodes fade in with downward drift, staggered by 120ms
- [ ] 7. **Zone awakening**: Tap zone label → zone mesh opacity animates 0.04→0.14
- [ ] 8. **Trail glow**: Play 2+ tracks → amber trail line gently pulses
- [ ] 9. **Token refresh**: Wait 45 min (or mock interval) → no 401 errors, playback continues
- [ ] 10. **Regression**: Save points work, queue reorder works, steering works, enrichment tooltips show

---

## Decision Checkpoints

### [DECISION 1: IntentMemory key sorting]
Should moods in the intent key be sorted alphabetically or by frequency in the parsed entry?

**Decision**: Alphabetically (deterministic, cross-session consistency).

### [DECISION 2: LearnedBias prompt injection location]
Where in the AI prompt does the learned bias note appear?

**Decision**: In `parseIntent` before AI call — inject into the layerContext or as a separate note after the taste profile note.

### [DECISION 3: Exclude filter timing]
Should `excludeTrackIds` be applied before or after the `slice(0, 8)`?

**Decision**: Before slice (ensure we return 8 non-excluded, not "up to 8"). Increase pool size to `slice(0, 15)` before filtering.

### [DECISION 4: Memory node rejection]
Should users be able to reject historical played tracks?

**Decision**: Yes, guard with `if (n.reason !== 'your map')` — if they reject a historical track, exclude it from future learning.

---

**Status**: Ready to build. All phases have explicit implementation code above. Start with Phase A (types + track limit), then B (rejection + IntentMemory), then C (UI), then D (orchestration), then E (token refresh).
