'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { WoodyObject, type WoodyMotionState } from './WoodyObject'
import styles from './SequenceProductPrototype.module.css'

type ProductScreen = 'setup' | 'anchors' | 'active'

const PRODUCT_ALBUMS = [
  { title: 'Forward Motion', artist: 'Mira Vale', image: '/design-lab/album-rush.svg', palette: { primary: '#5b2eff', secondary: '#ff654d', accent: '#c8f05a' } },
  { title: 'Open Weather', artist: 'June Static', image: '/design-lab/album-air.svg', palette: { primary: '#55c8ea', secondary: '#f3efe6', accent: '#ff654d' } },
  { title: 'Afterimage', artist: 'Soft Relay', image: '/design-lab/album-after.svg', palette: { primary: '#c8f05a', secondary: '#5b2eff', accent: '#55c8ea' } },
]

const INTENTIONS = [
  'Start patient. Build without forcing it.',
  'Light feet, clear head, one proper release.',
  'Keep momentum strange enough to stay awake.',
]

export function SequenceProductPrototype({ theme }: { theme: 'dark' | 'light' }) {
  const [screen, setScreen] = useState<ProductScreen>('setup')
  const [duration, setDuration] = useState(35)
  const [intentionIndex, setIntentionIndex] = useState(0)
  const [albumIndex, setAlbumIndex] = useState(0)
  const [selectedAlbums, setSelectedAlbums] = useState([0])
  const [motionState, setMotionState] = useState<WoodyMotionState>('tune')

  const activeAlbum = PRODUCT_ALBUMS[albumIndex]

  const chooseAlbum = (index: number) => {
    setAlbumIndex(index)
    setSelectedAlbums((current) => current.includes(index) ? current : [...current, index].slice(0, 3))
    setScreen('setup')
  }

  const advanceTrack = () => {
    const nextIndex = (albumIndex + 1) % PRODUCT_ALBUMS.length
    setMotionState('impact')
    window.setTimeout(() => {
      setAlbumIndex(nextIndex)
      setMotionState('moving')
    }, 620)
  }

  return (
    <section className={`${styles.translation} ${styles[theme]}`}>
      <div className={styles.translationIntro}>
        <span>SEQUENCE / PRODUCT TRANSLATION</span>
        <h1>The identity now<br /><em>does a job.</em></h1>
        <p>This is the same visual language translated into an actual run flow. The object is smaller, stateful and subordinate to the next decision.</p>
        <div className={styles.screenTabs}>
          {(['setup', 'anchors', 'active'] as ProductScreen[]).map((candidate, index) => (
            <button key={candidate} className={screen === candidate ? styles.activeTab : ''} onClick={() => { setScreen(candidate); setMotionState(candidate === 'active' ? 'moving' : 'tune') }}>
              <span>0{index + 1}</span>{candidate === 'setup' ? 'Set the run' : candidate === 'anchors' ? 'Choose anchors' : 'During movement'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.prototypeArea}>
        <div className={styles.annotationLeft}>
          <span>FUNCTION BEFORE FORM</span>
          <p>The structure assembles from real choices. No choice, no shape.</p>
          <i />
        </div>

        <div className={styles.phoneFrame}>
          <div className={styles.phoneSensor} />
          <AnimatePresence mode="wait">
            {screen === 'setup' && (
              <motion.div key="setup" className={styles.phoneScreen} initial={{ x: -26, clipPath: 'inset(0 18% 0 0)' }} animate={{ x: 0, clipPath: 'inset(0 0 0 0)' }} exit={{ x: -18, clipPath: 'inset(0 0 0 16%)' }} transition={{ duration: .42, ease: [0.16, 1, 0.3, 1] }}>
                <header className={styles.productHeader}><span className={styles.productMark}>W</span><span className={styles.readySignal}><i /> Spotify ready</span></header>
                <section className={styles.setupHero}>
                  <div className={styles.setupObject}><WoodyObject material="functional" motionState="tune" palette={activeAlbum.palette} /></div>
                  <span className={styles.stepLabel}>SET THE DIRECTION · 01</span>
                  <button className={styles.intentionButton} onClick={() => setIntentionIndex((intentionIndex + 1) % INTENTIONS.length)}>
                    <strong>{INTENTIONS[intentionIndex]}</strong><small>tap to try another phrasing ↻</small>
                  </button>
                </section>
                <section className={styles.durationControl}>
                  <button aria-label="Reduce duration" onClick={() => setDuration(Math.max(10, duration - 5))}>−</button>
                  <div><span>PLANNED TIME</span><strong>{duration}<small>min</small></strong></div>
                  <button aria-label="Increase duration" onClick={() => setDuration(Math.min(120, duration + 5))}>+</button>
                </section>
                <button className={styles.anchorEntry} onClick={() => setScreen('anchors')}>
                  <span className={styles.anchorCovers}>{selectedAlbums.map((index) => <i key={index} style={{ backgroundImage: `url(${PRODUCT_ALBUMS[index].image})` }} />)}</span>
                  <span><small>ANCHORS</small><strong>{selectedAlbums.length === 1 ? 'Add another point of reference' : `${selectedAlbums.length} tracks shape this run`}</strong></span>
                  <b>↗</b>
                </button>
                <button className={styles.primaryAction} onClick={() => { setScreen('active'); setMotionState('moving') }}><span>Shape this journey</span><i>→</i></button>
              </motion.div>
            )}

            {screen === 'anchors' && (
              <motion.div key="anchors" className={`${styles.phoneScreen} ${styles.anchorScreen}`} initial={{ y: '100%', rotate: 1 }} animate={{ y: 0, rotate: 0 }} exit={{ y: '100%', rotate: -1 }} transition={{ type: 'spring', damping: 25, stiffness: 235 }}>
                <header className={styles.anchorHeader}><button onClick={() => setScreen('setup')}>←</button><span><small>DIRECTION · 02</small><strong>What points the way?</strong></span><i>{selectedAlbums.length}/3</i></header>
                <label className={styles.productSearch}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg><input placeholder="Track or artist" /></label>
                <div className={styles.artGrid}>
                  {PRODUCT_ALBUMS.map((album, index) => (
                    <button key={album.title} onClick={() => chooseAlbum(index)}>
                      <span style={{ backgroundImage: `url(${album.image})` }}><i>{selectedAlbums.includes(index) ? '✓' : '+'}</i></span>
                      <strong>{album.title}<small>{album.artist}</small></strong>
                    </button>
                  ))}
                </div>
                <div className={styles.anchorPrompt}><span>One opener.</span><span>Two references.</span><em>No mood-board homework.</em></div>
                <svg className={styles.drawnRoute} viewBox="0 0 320 90" aria-hidden="true"><path d="M4 66c48-44 67 26 111-14s61 27 102-13 64 12 97-28" /></svg>
              </motion.div>
            )}

            {screen === 'active' && (
              <motion.div key={`active-${albumIndex}`} className={`${styles.phoneScreen} ${styles.activeScreen}`} initial={{ clipPath: 'circle(8% at 50% 52%)' }} animate={{ clipPath: 'circle(84% at 50% 52%)' }} exit={{ clipPath: 'circle(4% at 50% 52%)' }} transition={{ duration: .72, ease: [0.16, 1, 0.3, 1] }} style={{ '--active-art': `url(${activeAlbum.image})`, '--active-accent': activeAlbum.palette.accent } as React.CSSProperties}>
                <div className={styles.activeArt} />
                <header className={styles.activeHeader}><span><i /> LIVE · ADAPTIVE</span><button onClick={() => setScreen('setup')}>•••</button></header>
                <div className={styles.activeObject}><WoodyObject material="functional" motionState={motionState} palette={activeAlbum.palette} /></div>
                <div className={styles.activeCopy}>
                  <span>NOW PLAYING</span>
                  <h2>{activeAlbum.title}</h2>
                  <p>{activeAlbum.artist}</p>
                  <div className={styles.activeProgress}><i /></div>
                  <div className={styles.activeActions}><button onClick={() => setMotionState(motionState === 'impact' ? 'moving' : 'impact')}>Impact state</button><button onClick={advanceTrack}>Next track →</button></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.annotationRight}>
          <i />
          <span>EXPRESSIVE WHILE WAITING</span>
          <p>Cinematic during movement. Still enough to read when a decision is required.</p>
        </div>
      </div>
    </section>
  )
}
