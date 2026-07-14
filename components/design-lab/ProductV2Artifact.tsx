'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import styles from './ProductV2Artifact.module.css'

type V2Screen = 'compose' | 'preview' | 'run' | 'reflect'
type MotionDriver = 'bass' | 'drums' | 'melody' | 'vocal'

const V2_ALBUMS = [
  { title: 'Forward Motion', artist: 'Mira Vale', image: '/design-lab/album-rush.svg', accent: '#c8f05a', field: '#5b2eff' },
  { title: 'Open Weather', artist: 'June Static', image: '/design-lab/album-air.svg', accent: '#ff654d', field: '#55c8ea' },
  { title: 'Afterimage', artist: 'Soft Relay', image: '/design-lab/album-after.svg', accent: '#55c8ea', field: '#17141f' },
]

const SCREEN_LABELS: Array<{ id: V2Screen; label: string }> = [
  { id: 'compose', label: 'Compose' },
  { id: 'preview', label: 'Preview' },
  { id: 'run', label: 'Run' },
  { id: 'reflect', label: 'Reflect' },
]

const DRIVER_LABELS: Array<{ id: MotionDriver; label: string; description: string }> = [
  { id: 'bass', label: 'Bass', description: 'Low, elastic compression' },
  { id: 'drums', label: 'Drums', description: 'Short impact and recovery' },
  { id: 'melody', label: 'Guitar / melody', description: 'Alternating directional wave' },
  { id: 'vocal', label: 'Vocal', description: 'Breath, opening and suspension' },
]

function WoodySignalMark({ driver, intensity, bpm }: { driver: MotionDriver; intensity: number; bpm: number }) {
  const markStyle = {
    '--beat-duration': `${60 / bpm}s`,
    '--motion-intensity': intensity,
  } as React.CSSProperties

  return (
    <div className={`${styles.signalMark} ${styles[`driver_${driver}`]}`} style={markStyle} aria-label={`Woody motion driven by ${driver}`}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <path className={styles.signalShell} d="M80 8c18 0 25 16 40 21 17 6 31 1 34 19 3 17-12 25-14 41-3 17 8 27-4 40-12 13-27 3-43 12-13 8-18 18-34 9-15-9-10-24-23-34-12-9-31-6-30-24 0-17 17-22 21-37 5-17-5-29 9-39C45 3 63 8 80 8Z" />
        <g className={styles.signalBars}>
          <rect x="42" y="54" width="18" height="58" rx="9" transform="rotate(-15 51 83)" />
          <rect x="71" y="45" width="18" height="70" rx="9" />
          <rect x="100" y="54" width="18" height="58" rx="9" transform="rotate(15 109 83)" />
        </g>
        <circle className={styles.signalDot} cx="80" cy="128" r="8" />
      </svg>
    </div>
  )
}

export function ProductV2Artifact({ theme }: { theme: 'dark' | 'light' }) {
  const [screen, setScreen] = useState<V2Screen>('compose')
  const [duration, setDuration] = useState(37)
  const [albumIndex, setAlbumIndex] = useState(0)
  const [driver, setDriver] = useState<MotionDriver>('bass')
  const [intensity, setIntensity] = useState(.72)
  const [bpm, setBpm] = useState(112)
  const activeAlbum = V2_ALBUMS[albumIndex]

  return (
    <section className={`${styles.artifact} ${styles[theme]}`}>
      <header className={styles.artifactIntro}>
        <span>PRODUCT UI V2 / ARTWORK-LED</span>
        <h1>Recognisable first.<br /><em>Reactive second.</em></h1>
        <p>The record stays visible. Woody becomes a compact signal whose behaviour follows one dominant musical gesture rather than becoming a full-screen sculpture.</p>
      </header>

      <nav className={styles.flowNav} aria-label="Product flow">
        {SCREEN_LABELS.map((candidate, index) => <button key={candidate.id} className={screen === candidate.id ? styles.activeFlow : ''} onClick={() => setScreen(candidate.id)}><span>0{index + 1}</span>{candidate.label}</button>)}
      </nav>

      <div className={styles.artifactGrid}>
        <aside className={styles.systemPanel}>
          <span className={styles.systemLabel}>PRODUCT ANATOMY</span>
          <ol>
            <li><i>1</i><span><strong>Artwork</strong><small>Original and recognisable</small></span></li>
            <li><i>2</i><span><strong>Decision</strong><small>One obvious next action</small></span></li>
            <li><i>3</i><span><strong>Woody signal</strong><small>Responsive, never dominant</small></span></li>
            <li><i>4</i><span><strong>Observation</strong><small>Quiet system information</small></span></li>
          </ol>
          <div className={styles.shapeGrammar}><span>SHAPE GRAMMAR</span><div><i /><i /><i /></div><p>Artwork stays square. Actions use rounded blocks. Circles indicate state only.</p></div>
        </aside>

        <div className={styles.v2Phone}>
          <div className={styles.phoneSensor} />
          <AnimatePresence mode="wait">
            {screen === 'compose' && (
              <motion.div key="compose" className={styles.phoneScreen} initial={{ x: -24 }} animate={{ x: 0 }} exit={{ x: 20 }} transition={{ duration: .4, ease: [0.16, 1, 0.3, 1] }}>
                <header className={styles.phoneHeader}><span className={styles.miniMark}>W</span><span><i /> SPOTIFY READY</span></header>
                <main className={styles.composeBody}>
                  <span className={styles.stepLabel}>COMPOSE · 01</span>
                  <h2>Where should this<br />run <em>take you?</em></h2>
                  <button className={styles.intentLine}>Patient at first. Precise when it opens.<i>↻</i></button>

                  <section className={styles.durationRuler}>
                    <div className={styles.durationTop}><span>PLANNED DURATION</span><strong>{duration}<small>min</small></strong></div>
                    <input aria-label="Planned duration" type="range" min="10" max="120" step="1" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
                    <div className={styles.rulerTicks}><span>10</span><span>35</span><span>60</span><span>90</span><span>120</span></div>
                    <div className={styles.durationPresets}>{[20, 35, 50].map((value) => <button key={value} className={duration === value ? styles.activePreset : ''} onClick={() => setDuration(value)}>{value}</button>)}</div>
                  </section>

                  <section className={styles.anchorStrip}>
                    <div className={styles.sectionHeading}><span>ANCHORS · 1/3</span><button onClick={() => setScreen('preview')}>Edit ↗</button></div>
                    <button className={styles.selectedAnchor} onClick={() => setAlbumIndex((albumIndex + 1) % V2_ALBUMS.length)}><span style={{ backgroundImage: `url(${activeAlbum.image})` }} /><strong>{activeAlbum.title}<small>{activeAlbum.artist} · opener</small></strong><i>↻</i></button>
                  </section>
                </main>
                <button className={styles.bottomAction} onClick={() => setScreen('preview')}>Preview the shape <i>→</i></button>
              </motion.div>
            )}

            {screen === 'preview' && (
              <motion.div key="preview" className={styles.phoneScreen} initial={{ clipPath: 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0)' }} exit={{ clipPath: 'inset(0 100% 0 0)' }} transition={{ duration: .5, ease: [0.16, 1, 0.3, 1] }}>
                <header className={styles.phoneHeader}><button onClick={() => setScreen('compose')}>←</button><span>THE SHAPE · 02</span></header>
                <main className={styles.previewBody}>
                  <h2>The arc, not<br /><em>the surprise.</em></h2>
                  <div className={styles.phaseArc}>
                    <svg viewBox="0 0 340 170" aria-hidden="true"><path d="M12 145C45 126 56 73 104 89s55-61 104-37 58 70 120 5" /><circle cx="12" cy="145" r="5" /><circle cx="104" cy="89" r="5" /><circle cx="208" cy="52" r="5" /><circle cx="328" cy="57" r="5" /></svg>
                    <div><span>SETTLE</span><span>BUILD</span><span>HOLD</span><span>RELEASE</span></div>
                  </div>
                  <section className={styles.previewSetting}><span><i className={styles.familiarIcon} />Familiar ground</span><strong>65</strong><input type="range" min="0" max="100" value="65" readOnly /></section>
                  <section className={styles.impactMoment}><span><i className={styles.impactIcon} />IMPACT WINDOW</span><strong>around 24 min</strong><small>Move or remove</small></section>
                  <section className={styles.coverProof}><span style={{ backgroundImage: `url(${activeAlbum.image})` }} /><p><small>OPENER REMAINS INTACT</small><strong>{activeAlbum.title}</strong>The artwork is identity—not disposable texture.</p></section>
                </main>
                <button className={styles.bottomAction} onClick={() => setScreen('run')}>Start this run <i>→</i></button>
              </motion.div>
            )}

            {screen === 'run' && (
              <motion.div key={`run-${albumIndex}`} className={`${styles.phoneScreen} ${styles.runScreen}`} initial={{ clipPath: 'circle(4% at 50% 42%)' }} animate={{ clipPath: 'circle(90% at 50% 42%)' }} exit={{ clipPath: 'circle(4% at 50% 42%)' }} transition={{ duration: .68, ease: [0.16, 1, 0.3, 1] }} style={{ '--album-field': activeAlbum.field, '--album-accent': activeAlbum.accent } as React.CSSProperties}>
                <header className={styles.runHeader}><span><i /> LIVE · ADAPTIVE</span><button onClick={() => setScreen('reflect')}>END</button></header>
                <div className={styles.intactArtwork} style={{ backgroundImage: `url(${activeAlbum.image})` }}>
                  <WoodySignalMark driver={driver} intensity={intensity} bpm={bpm} />
                </div>
                <main className={styles.runDetails}>
                  <span>NOW PLAYING</span>
                  <h2>{activeAlbum.title}</h2>
                  <p>{activeAlbum.artist}</p>
                  <div className={styles.progress}><i /></div>
                  <div className={styles.observation}><i /><span><strong>Woody is listening</strong><small>One decision queued · no rating needed</small></span></div>
                </main>
              </motion.div>
            )}

            {screen === 'reflect' && (
              <motion.div key="reflect" className={`${styles.phoneScreen} ${styles.reflectScreen}`} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }}>
                <header className={styles.phoneHeader}><span className={styles.miniMark}>W</span><span>RUN SAVED LOCALLY</span></header>
                <main className={styles.reflectBody}>
                  <span className={styles.stepLabel}>REFLECT · 04</span>
                  <h2>What actually<br /><em>landed?</em></h2>
                  <section className={styles.ratingBlock}><span>TIMING / SUPPORT</span><div>{[1,2,3,4,5].map((value) => <button key={value} className={value === 4 ? styles.selectedRating : ''}>{value}</button>)}</div></section>
                  <label className={styles.reflectPrompt}>A moment that worked<textarea placeholder="The turn at around 24 minutes…" /></label>
                  <label className={styles.reflectPrompt}>Something that broke it<textarea placeholder="A transition, track, or timing issue…" /></label>
                  <label className={styles.approvalLine}><input type="checkbox" /> I would choose adaptive again</label>
                </main>
                <button className={styles.bottomAction} onClick={() => setScreen('compose')}>Save evidence <i>✓</i></button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className={styles.motionPanel}>
          <span className={styles.systemLabel}>MOTION DRIVER · PROTOTYPE</span>
          <p>One attributed musical feature controls one recognisable mark. These controls simulate future classification; they are not exposed during a run.</p>
          <div className={styles.driverButtons}>{DRIVER_LABELS.map((candidate) => <button key={candidate.id} className={driver === candidate.id ? styles.activeDriver : ''} onClick={() => { setDriver(candidate.id); setScreen('run') }}><span>{candidate.label}</span><small>{candidate.description}</small></button>)}</div>
          <label>Motion intensity <strong>{Math.round(intensity * 100)}%</strong><input type="range" min="0.25" max="1" step="0.01" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label>
          <label>Simulated pulse <strong>{bpm} BPM</strong><input type="range" min="70" max="150" step="1" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} /></label>
          <div className={styles.albumChoices}>{V2_ALBUMS.map((album, index) => <button key={album.title} className={albumIndex === index ? styles.activeAlbum : ''} onClick={() => { setAlbumIndex(index); setScreen('run') }} style={{ backgroundImage: `url(${album.image})` }} aria-label={`Use ${album.title} artwork`} />)}</div>
          <small className={styles.realityNote}>Current V0 has CLAP embeddings but no measured tempo or live Spotify audio stream. A coarse motion driver can be inferred; exact beat synchronisation requires later audio analysis.</small>
        </aside>
      </div>
    </section>
  )
}
