import { create } from 'zustand'
import { Track, Session, TrackSuggestion, MapNode } from './types'

interface WoodyStore {
  // Current session
  session: Session | null
  currentTrack: Track | null
  suggestions: TrackSuggestion[]
  isPlaying: boolean
  mode: 'active' | 'ambient'

  // Map
  mapNodes: MapNode[]

  // Actions
  setSession: (session: Session) => void
  setCurrentTrack: (track: Track) => void
  setSuggestions: (suggestions: TrackSuggestion[]) => void
  setIsPlaying: (playing: boolean) => void
  setMode: (mode: 'active' | 'ambient') => void
  setMapNodes: (nodes: MapNode[]) => void
}

export const useWoodyStore = create<WoodyStore>((set) => ({
  session: null,
  currentTrack: null,
  suggestions: [],
  isPlaying: false,
  mode: 'active',
  mapNodes: [],

  setSession: (session) => set({ session }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setMode: (mode) => set({ mode }),
  setMapNodes: (nodes) => set({ mapNodes: nodes }),
}))
