'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { SequenceProductPrototype } from './SequenceProductPrototype'
import { WoodyObject, type WoodyMaterial, type WoodyMotionState } from './WoodyObject'
import styles from './WoodyDesignLab.module.css'

type Theme = 'dark' | 'light'
type ArtTreatment = 'artwork' | 'fragments' | 'colour'
type LabView = 'product' | 'objects'

const MATERIALS: Array<{ id: WoodyMaterial; name: string; character: string; motion: string }> = [
  { id: 'functional', name: 'Sequence', character: 'Function first, still alive', motion: 'Assembles around the journey' },
  { id: 'ceramic', name: 'Counterweight', character: 'Quiet, weighted, human', motion: 'Balances and swings' },
  { id: 'gel', name: 'Soft Signal', character: 'Fluid, curious, responsive', motion: 'Compresses and rebounds' },
  { id: 'plastic', name: 'Stack', character: 'Graphic, playful, direct', motion: 'Shuffles and snaps' },
  { id: 'chrome', name: 'Relay', character: 'Precise, fast, nocturnal', motion: 'Scans and counter-rotates' },
]

const ALBUMS = [
  { id: 'rush', title: 'Forward Motion', artist: 'Mira Vale', image: '/design-lab/album-rush.svg', palette: { primary: '#5b2eff', secondary: '#ff654d', accent: '#c8f05a' } },
  { id: 'air', title: 'Open Weather', artist: 'June Static', image: '/design-lab/album-air.svg', palette: { primary: '#55c8ea', secondary: '#f3efe6', accent: '#ff654d' } },
  { id: 'after', title: 'Afterimage', artist: 'Soft Relay', image: '/design-lab/album-after.svg', palette: { primary: '#c8f05a', secondary: '#5b2eff', accent: '#55c8ea' } },
]

const MOTION_STATES: Array<{ id: WoodyMotionState; label: string }> = [
  { id: 'tune', label: 'Tuning' },
  { id: 'moving', label: 'Moving' },
  { id: 'impact', label: 'Impact' },
]

function StateGlyph({ state }: { state: WoodyMotionState }) {
  if (state === 'tune') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /></svg>
  if (state === 'moving') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c3-8 6 2 9-6s6 2 9-4" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.2 6.4L21 7l-5 5 5 5-6.8-1.4L12 22l-2.2-6.4L3 17l5-5-5-5 6.8 1.4Z" /></svg>
}

export function WoodyDesignLab() {
  const [material, setMaterial] = useState<WoodyMaterial>('functional')
  const [motionState, setMotionState] = useState<WoodyMotionState>('tune')
  const [theme, setTheme] = useState<Theme>('dark')
  const [artTreatment, setArtTreatment] = useState<ArtTreatment>('artwork')
  const [albumIndex, setAlbumIndex] = useState(0)
  const [anchorSheetOpen, setAnchorSheetOpen] = useState(false)
  const [labView, setLabView] = useState<LabView>('product')

  const activeMaterial = MATERIALS.find((candidate) => candidate.id === material) ?? MATERIALS[0]
  const activeAlbum = ALBUMS[albumIndex]
  const stageStyle = useMemo(() => ({
    '--album-image': `url(${activeAlbum.image})`,
    '--signal-primary': activeAlbum.palette.primary,
    '--signal-secondary': activeAlbum.palette.secondary,
    '--signal-accent': activeAlbum.palette.accent,
  }) as React.CSSProperties, [activeAlbum])

  return (
    <main className={`${styles.lab} ${styles[theme]}`}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}><span>W</span><strong>WOODY</strong><small>DESIGN LAB / 01</small></Link>
        <div className={styles.labControls}>
          <div className={styles.viewSwitch} aria-label="Prototype view">
            <button className={labView === 'product' ? styles.activeView : ''} onClick={() => setLabView('product')}>Product UI</button>
            <button className={labView === 'objects' ? styles.activeView : ''} onClick={() => setLabView('objects')}>Object study</button>
          </div>
          <div className={styles.themeSwitch} aria-label="Canvas theme">
            <button className={theme === 'dark' ? styles.active : ''} onClick={() => setTheme('dark')}>Night</button>
            <button className={theme === 'light' ? styles.active : ''} onClick={() => setTheme('light')}>Day</button>
          </div>
        </div>
      </header>

      {labView === 'product' ? <SequenceProductPrototype theme={theme} /> : <>
        <section className={styles.intro}>
        <span>ONE IDEA · FIVE BEHAVIOURS</span>
        <h1>Not a mascot.<br /><em>A presence.</em></h1>
        <p>Same product, four different physical instincts. Drag the object. Change its state. Judge the behaviour, not a static mockup.</p>
      </section>

      <nav className={styles.materialTabs} aria-label="Material branches">
        {MATERIALS.map((candidate, index) => (
          <button key={candidate.id} className={material === candidate.id ? styles.activeMaterial : ''} onClick={() => setMaterial(candidate.id)}>
            <span>0{index + 1}</span><strong>{candidate.name}</strong><small>{candidate.character}</small>
          </button>
        ))}
      </nav>

      <section className={`${styles.stage} ${styles[artTreatment]}`} style={stageStyle}>
        <div className={styles.albumField} aria-hidden="true" />
        <div className={styles.stageGrid} aria-hidden="true" />
        <div className={styles.rareGesture} aria-hidden="true">
          <svg viewBox="0 0 520 220"><path d="M8 160c72-102 91 54 167-38s99 72 173-18 103 28 165-76" /></svg>
        </div>
        <div className={styles.stageTopline}><span>LIVE OBJECT</span><strong>{activeMaterial.motion}</strong></div>
        <div className={styles.objectWrap}>
          <WoodyObject material={material} motionState={motionState} palette={activeAlbum.palette} />
        </div>
        {material === 'functional' && <div className={styles.functionalLegend}><span>ANCHOR 01</span><span>ANCHOR 02</span><strong>CURRENT TRACK</strong></div>}
        <div className={styles.stateRail}>
          {MOTION_STATES.map((candidate) => (
            <button key={candidate.id} className={motionState === candidate.id ? styles.activeState : ''} onClick={() => setMotionState(candidate.id)}>
              <StateGlyph state={candidate.id} /><span>{candidate.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.nowPlaying}>
          <div className={styles.miniCover} style={{ backgroundImage: `url(${activeAlbum.image})` }} />
          <div><span>NOW PLAYING</span><strong>{activeAlbum.title}</strong><small>{activeAlbum.artist}</small></div>
          <i><b /></i>
        </div>
      </section>

      <section className={styles.controlGrid}>
        <article className={styles.controlPanel}>
          <span className={styles.panelLabel}>ALBUM ART IN THE WORLD</span>
          <div className={styles.artOptions}>
            {(['artwork', 'fragments', 'colour'] as ArtTreatment[]).map((treatment) => <button key={treatment} className={artTreatment === treatment ? styles.activeOption : ''} onClick={() => setArtTreatment(treatment)}>{treatment}</button>)}
          </div>
          <div className={styles.albumRow}>
            {ALBUMS.map((album, index) => <button key={album.id} className={albumIndex === index ? styles.activeAlbum : ''} onClick={() => setAlbumIndex(index)} style={{ backgroundImage: `url(${album.image})` }}><span>{album.title}</span></button>)}
          </div>
        </article>

        <article className={styles.controlPanel}>
          <span className={styles.panelLabel}>TACTILE UI, NOT A FORM</span>
          <button className={styles.anchorTrigger} onClick={() => setAnchorSheetOpen(true)}><span><small>SET THE DIRECTION</small><strong>Choose anchor tracks</strong></span><i>↗</i></button>
          <div className={styles.symbolRow}>
            <span className={styles.orbitSymbol}><i /></span>
            <span className={styles.stepSymbol}><i /><i /><i /></span>
            <span className={styles.splitSymbol}><i /><i /><i /><i /></span>
            <p>Common symbols stay clean. Rare gestures break the system on purpose.</p>
          </div>
        </article>
      </section>

      <section className={styles.typeSpecimen}>
        <span>VOICE SYSTEM</span>
        <p><strong>Build pressure.</strong> <em>Keep some air.</em> <code>34 MIN</code></p>
      </section>

      <AnimatePresence>
        {anchorSheetOpen && (
          <motion.div className={styles.sheetBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAnchorSheetOpen(false)}>
            <motion.section className={styles.anchorSheet} initial={{ y: '100%', rotate: 1.5 }} animate={{ y: 0, rotate: 0 }} exit={{ y: '100%', rotate: -1 }} transition={{ type: 'spring', damping: 26, stiffness: 240 }} onClick={(event) => event.stopPropagation()}>
              <div className={styles.sheetHandle} />
              <div className={styles.sheetHeading}><span><small>DIRECTION / 01</small><strong>What points the way?</strong></span><button onClick={() => setAnchorSheetOpen(false)}>×</button></div>
              <label className={styles.searchField}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg><input autoFocus placeholder="Track or artist" /></label>
              <div className={styles.fakeResults}>
                {ALBUMS.map((album, index) => <button key={album.id} onClick={() => { setAlbumIndex(index); setAnchorSheetOpen(false) }}><span style={{ backgroundImage: `url(${album.image})` }} /><strong>{album.title}<small>{album.artist}</small></strong><i>+</i></button>)}
              </div>
              <div className={styles.sheetScribble} aria-hidden="true"><svg viewBox="0 0 280 70"><path d="M2 51c46-33 52 19 92-9s48 18 83-9 53 16 98-22" /></svg></div>
            </motion.section>
          </motion.div>
        )}
        </AnimatePresence>
      </>}
    </main>
  )
}
