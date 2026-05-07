# Woody — Music Psychology Foundations
*Research synthesis for product decisions. Last updated: 2026-04-28*

---

## Purpose

This document grounds Woody's product decisions in music psychology research. It is not a literature review — it is a working reference for how human psychology should govern session arc design, the intent model, recommendation logic, and social architecture. Every section ends with direct product implications.

---

## 1. Mood Regulation Theory

### The Science

People use music as an intentional psychological tool, not a passive backdrop. The dominant framework (drawing from James Russell's emotion research, expanded by Gross's process model of emotion regulation) identifies that music regulates mood through six primary strategies:

- **Entertainment** — using music as distraction from a negative state
- **Revival** — using high-energy music to combat low arousal/fatigue
- **Diversion** — shifting attention away from rumination
- **Discharge** — using congruent (sad, angry) music to release emotional tension rather than fight it
- **Mental work** — using music to improve cognitive performance
- **Solace** — using music to feel understood and less alone in a negative state

Two broad regulation goals dominate: **mood maintenance** (sustaining a positive or productive state) and **mood repair** (escaping or transforming a negative state). These require opposite recommendation logics.

The critical finding: **congruent music often outperforms incongruent music for mood repair.** Someone sad reaching for sad music is not self-destructive — it is psychologically adaptive. The discharge strategy is real, and is why "sad playlists" have enormous audiences.

Valence × arousal (Russell's Circumplex, below) defines the 2D emotion space into which all regulation goals map. The regulation *strategy* determines *direction of travel* across that space, not just destination.

### What It Means for Woody

The intent model (Internal State × External Context × Desired State) already captures the three-axis structure that mood regulation research predicts. What the research adds:

1. **Desired state ≠ opposite of current state.** The discharge strategy means someone whose desired state is "release" might need music that *matches* their current negative valence before lifting. A session arc for grief should not start at warmth 0.8 — it should start congruent (warmth 0.3, energy 0.2, organicity high for acoustic texture) and move gradually.

2. **Regulation strategy is a fourth axis of intent.** The system needs to distinguish between a user who wants to escape (diversion) and one who wants to process (discharge). These produce opposite acoustic trajectories from the same internal state input.

3. **Maintenance sessions are underserved.** Most recommendation products optimize for change. A user in a good focused state who needs *no disruption* is asking for something genuinely different: a plateau arc at their current coordinates, not a journey.

### Arc Design Implications

- Add regulation strategy inference to the intent model: repair vs. maintain vs. process
- Discharge arcs start congruent with current state and move toward resolution, not away from it
- Maintenance arcs are plateau-shaped — the goal is acoustic consistency, not journey
- Repair arcs can be gradual (journey shape) or sudden pivot (wave shape with deliberate transition)
- Session duration correlates with regulation strategy: processing arcs should be longer (90+ minutes); revival arcs can be short and high-intensity

---

## 2. Russell's Circumplex Model of Affect

### The Science

Russell (1980) proposed that all emotional states can be mapped onto a two-dimensional space defined by **valence** (pleasant–unpleasant) and **arousal** (activated–deactivated). The four quadrants:

| Quadrant | Valence | Arousal | Example states |
|----------|---------|---------|---------------|
| High V / High A | Positive | High | Excited, elated, energized |
| Low V / High A | Negative | High | Anxious, angry, stressed |
| Low V / Low A | Negative | Low | Sad, depressed, fatigued |
| High V / Low A | Positive | Low | Calm, relaxed, content |

This model is well-replicated. Its acoustic corollary (that music at a given valence/arousal position induces matching emotional states) is supported by strong experimental evidence. The key nuance: **music induces arousal reliably; valence induction is weaker and more context-dependent.**

### Mapping to Woody's 5D Coordinates

The circumplex collapses naturally onto Woody's acoustic dimensions:

| Circumplex axis | Primary Woody dimension | Secondary contributors |
|-----------------|------------------------|----------------------|
| Arousal | Energy | Density (textural mass adds perceived intensity) |
| Valence (positive) | Warmth | Sacred (harmonic resolution lifts perceived valence) |
| Valence (negative) | Low warmth + High density | Dissonance-adjacent — cold, dense, heavy |
| Deactivated-negative | Low energy, Low warmth | High organicity (stripped acoustic textures feel melancholic) |

The circumplex is a 2D projection of a larger acoustic space. Woody's 5D space is a *superset* — it can represent distinctions the circumplex cannot. For example: two tracks at the same valence/arousal position can differ radically in organicity (one synthesized, one acoustic) and feel completely different in context.

**The circumplex tells us where to go. The full 5D space tells us how to get there, and what the journey feels like.**

### Arc Design Implications

- Session arcs should be visualizable on a 2D arousal × valence canvas as a path through emotional space — this is a powerful design tool and user-facing communication layer
- A "journey" arc (session shape SH01) traces a visible path through the circumplex space
- The system should know which quadrant transitions are acoustically smooth (high-energy-positive → low-energy-positive is smooth) vs. difficult (high-arousal-negative → low-arousal-positive requires a transition zone)
- Anxiety states (low-V/high-A) require careful arc design: the natural acoustic path toward calm passes through low arousal before improving valence — skipping straight to "happy music" is acoustically jarring and psychologically ineffective

---

## 3. Ultradian Rhythms and the 90-Minute BRAC

### The Science

The Basic Rest-Activity Cycle (BRAC), documented by Kleitman (who also discovered REM sleep), describes a 90–120 minute oscillation in human alertness and cognitive capacity that persists throughout the day. The cycle has measurable physiological correlates: hormonal oscillations, brainwave patterns, nasal airflow lateralization.

Key findings for product design:
- Alertness peaks approximately every 90 minutes, with 15–20 minute troughs between cycles
- The trough at the end of each ultradian cycle is characterized by lower cortical arousal, increased daydreaming, and reduced focused attention
- Most people experience 4–5 full cycles during waking hours
- Productivity research suggests that working *with* these cycles (focused work during peaks, rest or diffuse thinking during troughs) outperforms sustained effort

The 90-minute figure is not coincidental relative to Woody's session design. A 2-hour session crosses approximately one full BRAC.

### What It Means for Woody

The "2-hour acoustic arc" is biologically grounded, not arbitrary. A session arc that runs 90–120 minutes is aligned with the body's natural attentional rhythm. This has implications for arc shape design:

1. **The single-apex arc** (build to climax, then descend) maps cleanly onto the BRAC: intensity builds through the alertness peak, the arc descends as the ultradian trough approaches. This is not just aesthetically pleasing — it is biologically congruent.

2. **The plateau arc** (for study/work) should incorporate a deliberate transition at approximately 80–90 minutes: slight drop in density, slight increase in warmth, then a gentle re-energize for the final 20–30 minutes. This matches the ultradian trough and recovery pattern.

3. **Activity arcs** (runs, workouts) map differently: physical activity can extend alertness cycles, so the energy peak can be pushed later than 90 minutes.

4. **The 90-minute session length should be surfaced as a psychologically motivated default**, not just a convenient number. It is the length of one complete human attentional arc.

### Arc Design Implications

- Default session length: 90 minutes (one BRAC), with 120 minutes as the extended option
- Plateau arcs for work/study sessions should include a subtle density dip at ~80 minutes, then recovery
- Single-apex arcs for leisure/entertainment peak between minutes 60–80, then resolve
- Activity arcs with physical exertion can sustain higher energy through the 90-minute mark, mimicking athletic BRAC extension
- Future ML shape learning (SH05) should look for ultradian patterns in user listening behavior — people's naturally preferred arc peaks may cluster near their personal BRAC timing

---

## 4. Musical Frisson (Chills)

### The Science

Musical frisson — the pleasurable chill or skin-tingling response to music — is one of the most reliably documented emotional responses in music psychology (Panksepp, 1995; Blood & Zatorre, 2001). fMRI studies show frisson activates the nucleus accumbens and ventral tegmental area — the same dopamine reward circuits as food, sex, and drugs.

Acoustic properties that reliably trigger frisson:

- **Sudden dynamic changes** — an unexpected increase in loudness or density after quiet/sparse passage
- **Unexpected harmonic shifts** — a chord progression that violates expectation (mode mixture, chromatic mediant relationships, enharmonic modulations)
- **Entrance of a new voice or instrument** — especially choir, strings, or solo voice entering after orchestral texture
- **Rhythmic suspension or silence** — brief rhythmic caesura that heightens expectation before release
- **Melodic peak tones** — the highest note in a melodic phrase, especially when approached from below with acceleration
- **Increased tempo or density** — gradual builds in both dimensions simultaneously

Individual differences matter: ~50% of people experience frisson readily ("high openness to experience" trait predicts it). The other 50% are less susceptible but not immune.

Frisson is primarily a response to **violated and then resolved expectation** — the brain predicts one thing, gets another, and rewards itself for the unexpected resolution.

### What It Means for Woody

Frisson is the most potent discrete emotional payoff music can deliver. It is also engineerable at the session arc level. A session that delivers 2–4 frisson moments is experientially superior to one that is acoustically consistent but never peaks.

The five Woody dimensions partially encode frisson potential:
- **Energy** transitions (rapid upward movement in energy) are frisson triggers
- **Density** spikes after sparse passages are frisson triggers
- **Sacred** captures harmonic centredness — its inverse (sudden Sacred drop into tension) followed by resolution is a harmonic frisson mechanism
- **Organicity** shifts (a synthesized passage followed by sudden acoustic texture) can create frisson through timbral surprise

### Arc Design Implications

- Session arcs should engineer 2–4 deliberate "frisson candidate" moments: points where energy and density spike simultaneously after a lower-density passage
- Frisson moments should not be front-loaded — they work best at the 30–40%, 65–70%, and 85–90% marks of a session arc, matching expectation curves
- A frisson candidate is defined acoustically as: a track that is preceded by ≥3 consecutive lower-energy, lower-density tracks, then delivers a significant upward energy shift
- The transition between frisson candidates should be managed — consecutive high-energy tracks reduce frisson probability (habituation)
- "Sacred" dimension tracks (high harmonic resolution) placed after high-tension passages create a specific harmonic frisson distinct from the energy/dynamic type
- Session arc visualization should mark intended frisson peaks for the user (making the invisible visible)

---

## 5. Habituation and Novelty-Seeking Cycles

### The Science

Habituation — the reduction of response to a repeated stimulus — is one of the most universal phenomena in neuroscience. In music, habituation operates at multiple timescales:

- **Within-session habituation**: a track heard 3+ times in a session loses emotional impact after the first listen
- **Within-day habituation**: tracks heard earlier in the day feel less rewarding later in the same day
- **Familiarity curves**: the "mere exposure effect" (Zajonc) shows that familiarity initially increases liking — up to a point. The optimal familiarity level is intermediate: familiar enough to predict structure, novel enough to hold attention. Beyond that point, preference declines.

Berlyne's (1971) arousal theory predicts an inverted-U relationship between stimulus complexity and liking. Music that is too predictable is boring; music that is too complex is aversive. The sweet spot is context-dependent (and shifts based on current cognitive load).

Research on radio airplay rotation suggests peak liking is reached at approximately 10–15 exposures, with decline beginning around 20+ exposures depending on the track's structural complexity.

For discovery specifically: **novelty preference is highest when the listener is in a positive, high-arousal state.** Exploratory listening (discovery mode) requires cognitive resources; fatigued or anxious states favor familiar music.

### What It Means for Woody

The familiar/novel ratio within a session arc is not fixed — it depends on the user's intent and state. A maintenance session (low cognitive load goal) should lean toward familiar territory. A discovery session (exploratory intent) can handle higher novelty ratios but should be requested, not imposed.

Current territory-based recommendation (E05) handles this structurally by biasing toward the user's acoustic territory. But habituation requires tracking *recency* of exposure, not just territory membership.

**Optimal familiar/novel ratio by session type:**
| Session type | Familiar ratio | Novel ratio |
|--------------|---------------|-------------|
| Recovery/wind-down | 70–80% | 20–30% |
| Work/focus (plateau) | 60–70% | 30–40% |
| Activity (physical) | 50–60% | 40–50% |
| Discovery/exploration | 30–40% | 60–70% |
| Social/shared listening | 50–60% | 40–50% |

These ratios should be inferred from intent, not set manually by the user.

### Arc Design Implications

- Session arc algorithm (IN05) must weight recency of track exposure — recently played tracks are penalized regardless of acoustic fit
- Novelty injection points (tracks outside established territory) should be placed after acoustic anchors (familiar territory tracks), not cold-opened
- Discovery arcs should place novel tracks *after* a session is established — approximately 20–30 minutes in, when the user is committed to the session
- The familiar/novel ratio is an inferred parameter of the intent model — recovery/calm intents auto-bias toward familiar; discovery/exploration intents auto-bias toward novel
- Acoustic adjacent territory (D08 — "what's just outside your known territory") is the correct novelty mechanism: not random novelty, but acoustically proximate novelty that sounds familiar enough to accept
- Session-level habituation tracking should flag when a user is being over-served on a given track or artist cluster

---

## 6. Nostalgia and Memory Encoding (MEAR)

### The Science

Music-Evoked Autobiographical Recall (MEAR) is the mechanism by which music triggers episodic memories — often involuntarily, often with high emotional intensity. The neurological basis: the limbic system (hippocampus + amygdala) is activated by music, and these structures are central to both emotional processing and episodic memory formation.

Key research findings:

- **The reminiscence bump**: music from ages 12–25 carries disproportionate autobiographical weight. This period coincides with peak autobiographical memory formation and peak emotional intensity of identity formation.
- **Memory consolidation during encoding**: tracks heard during emotionally significant experiences become anchors for those memories. The music and the memory are neurologically entangled.
- **Involuntary MEAR** (unbidden memories triggered by music) tends to be more emotionally intense than voluntary music-memory searches.
- **Nostalgia is not entirely backward-looking**: psychological research (Sedikides et al., 2008) shows nostalgia typically strengthens social connectedness and sense of meaning, not just backward yearning. Nostalgic states have measurable positive outcomes for wellbeing.
- **The "sad but beautiful" experience**: tracks with high nostalgia potential often produce mixed emotional states — bittersweet rather than purely positive or negative. This is distinct from straightforward positive valence.

### What It Means for Woody

MEAR is Woody's highest-stakes emotional territory. Tracks that trigger autobiographical recall are categorically different from tracks that merely match acoustic coordinates — they carry personal emotional weight that no acoustic model can measure.

The acoustic fingerprint of nostalgic music tends to be: **high organicity** (acoustic/analogue warmth), **moderate energy**, **high sacred** (tonally resolved, emotionally grounded), and often **lower density** (stripped-back arrangements associated with a specific era's production style). But this is a correlation, not a definition — personal MEAR is irreducibly individual.

Rediscovery features must be designed with care: being ambushed by a track that triggers intense MEAR during a work focus session is a product failure, not a delight. MEAR is an opt-in zone.

### Arc Design Implications

- **Rediscovery mode** (not yet in FEATURES.md — add) is a session intent category distinct from discovery. It operates on the user's own listening history, not external catalog. The acoustic arc starts in familiar territory and surfaces tracks not heard in 2+ years.
- User-flagged nostalgic tracks should be stored as a "memory library" — not acoustic coordinates but emotional anchors. These are served selectively, with context (time of day, explicit nostalgia intent) as gates.
- Wind-down and solace arcs are the highest-fit session types for nostalgic content. Focus and activity arcs should gate against unexpected MEAR triggers.
- The acoustic profile of the reminiscence bump (high organicity, era-specific production warmth) can be used as a proxy signal for nostalgic potential in the absence of personal listening history
- "Memory anchors" as a SavePoint (S06) variant: user can tag a moment in a session where a track triggered strong autobiographical recall. This feeds the personal territory in a qualitatively different way from acoustic data
- Nostalgia arc sessions should be designed with a specific emotional contract: "this will feel bittersweet, and that is the point." Framing matters as much as acoustic content.

---

## 7. Flow State Acoustic Conditions

### The Science

Csikszentmihalyi's flow state is defined by complete absorption in an activity, characterized by loss of self-consciousness, distorted time perception, and intrinsic reward. It requires: clear goals, immediate feedback, and a challenge/skill balance near 1:1.

Music's role in flow is facilitative, not causal — it reduces irrelevant cognitive interference (mind-wandering, social rumination) and stabilizes attentional focus. It does not produce flow alone.

Research on background music and cognitive performance (North, Hargreaves, McKendrick; Ravi Mehta et al.) suggests:

- **Moderate ambient noise (65–70 dB)** improves creative task performance over silence or high noise. Music that generates the equivalent of this "ambient noise" level supports creative flow.
- **Low cognitive load music maximizes flow support** for tasks requiring sustained attention: instrumental, predictable structure, low density variation, low harmonic surprise.
- **High cognitive load music (complex lyrics, unexpected structure, high density) impairs flow** for linguistic and analytical tasks but may enhance flow for physical tasks.
- **Tempo matching to task rhythm**: for physical tasks, rhythmic music matched to movement cadence extends time-on-task and perceived exertion reduction.
- **Activity-specific acoustic profiles:**
  - Creative work: moderate energy (0.4–0.6), low density (0.3–0.5), low sacred (deliberate tonal ambiguity supports divergent thinking), high warmth
  - Deep analytical work: very low density, low energy, high organicity (acoustic minimalism), low sacred (tonally neutral)
  - Physical performance: high energy (0.7–0.9), high density (0.6–0.8), moderate warmth, rhythm-forward
  - Study/learning: low energy (0.3–0.5), low density (0.2–0.4), moderate warmth, minimal structural surprise

### What It Means for Woody

Flow support is Woody's most practically valuable use case — it is what converts casual users into daily-habit users. The activity preset system (A06) should be acoustically precise, not just a label. "Study mode" is not a genre — it is a specific acoustic configuration that evolves over the session.

The challenge/skill ratio in flow theory maps loosely onto the familiar/novel ratio: a flow-supporting arc keeps novelty low enough that processing the music does not pull attention from the task.

### Arc Design Implications

- Activity presets (A06) should ship with acoustically specific default arc coordinates, not just genre associations:
  - Study/deep work: energy 0.35, warmth 0.55, density 0.25, organicity 0.65, sacred 0.45 — plateau shape
  - Creative work: energy 0.5, warmth 0.7, density 0.4, organicity 0.6, sacred 0.35 — gentle wave shape
  - Physical training: energy 0.8, warmth 0.5, density 0.75, organicity 0.35, sacred 0.4 — single apex or intervals
  - Wind-down/recovery: energy 0.2, warmth 0.75, density 0.2, organicity 0.7, sacred 0.7 — inverse shape
- Flow arcs for cognitive work should suppress structural novelty: no sudden energy spikes, no unexpected frisson candidates, no tracks with prominent lyrical content
- Physical activity arcs are the exception: frisson moments are desirable and motivationally useful during physical exertion
- The "study arc" plateau should be acoustically *blander* than the rec engine's natural preference — the product must resist the temptation to make study arcs "interesting"

---

## 8. Social Bonding Through Music

### The Science

Music is one of the most powerful human synchronization mechanisms. Two well-established pathways:

**Neural entrainment**: listening to music causes brainwave patterns and motor systems to synchronize with the rhythmic structure of the music. Shared listening causes listeners to entrain to the same rhythmic signal — creating a form of neural synchrony between people who have never met. This is a biological precondition for social cohesion.

**Oxytocin pathway**: group music-making and synchronized movement (dancing, clapping, marching) triggers oxytocin release — the bonding hormone. Passive shared listening also activates this system, albeit at lower amplitude. The effect is measurable and has been replicated across cultures.

**Shared taste as trust signal**: psychological research (Mark Rentfrow) shows that music preference is one of the fastest and most reliable proxies for personality compatibility. People assess shared musical taste as evidence of aligned values, aesthetic sensibility, and worldview — faster and more reliably than shared occupational or demographic characteristics.

**Synchrony and affiliation**: experiments show that synchronized movement (even just tapping in time with another person) increases prosocial behavior, generosity, and cooperation. The music-induced version of this is less direct but measurable.

### What It Means for Woody

The social layer is not just a feature — it is acoustically grounded. The "mutual territory discovery" mechanism (SO05 — "you and this person share acoustic territory but arrived via completely different routes") taps directly into the shared-taste-as-trust-signal research. The acoustic fingerprint functions as a rapid personality signal that is specific enough to be meaningful but abstract enough to avoid the parasocial dynamics of "this person likes the same artists as me."

Synchrony is the mechanism by which arc-sharing creates connection. Sharing an arc someone else can *follow* (listen to the same sequence) activates low-level neural entrainment — they are literally experiencing the same acoustic journey. This is a stronger bonding mechanism than sharing a static opinion.

### Arc Design Implications

- Shared sessions (two people listening to the same arc simultaneously) should be a Phase 3 feature — it is neurologically meaningful, not just socially pleasant
- Arc sharing artifacts should communicate the *journey*, not just the endpoint, to activate the synchrony pathway in followers who reconstruct the arc
- Community formation should favor acoustic territory overlap as the connection mechanism over social graph following — research supports territory-as-trust more than follow-as-trust
- The social object (arc) is also the bonding object — make it followable, replayable, and reconstructable, not just viewable
- Group session features (friends listen simultaneously) are a legitimate oxytocin trigger — not a gimmick but a biologically grounded product decision

---

## 9. Attention Restoration Theory (ART)

### The Science

Kaplan's Attention Restoration Theory (1995) distinguishes between two types of attention:

- **Directed attention**: effortful, voluntary, depletes with use. Used for analytical work, problem-solving, decision-making.
- **Involuntary attention / soft fascination**: triggered by inherently interesting stimuli without cognitive effort. Allows directed attention to recover.

Natural environments (water, trees, weather) produce soft fascination reliably. So does music — specifically, music that is engaging enough to hold peripheral attention but not demanding enough to require directed attention.

The restoration cycle requires: (1) being away from demand, (2) extent (the restorative environment feels ample and expansive), (3) compatibility (the environment fits the person's inclinations), (4) soft fascination (effortless engagement).

**Directed attention fatigue** is the cause of the afternoon cognitive slump, decision fatigue, and the "can't concentrate anymore" state. Music at the right acoustic position can accelerate restoration.

The acoustic profile for attention restoration is distinct from both flow support and relaxation:
- Moderate structural complexity (enough to be interesting without demanding)
- Low density (not competing for attentional resources)
- High organicity (natural sounds have high ART efficacy)
- Moderate warmth
- Some movement/variation (static music does not hold involuntary attention)

### What It Means for Woody

The "recovery arc" is a specific session type that ART distinguishes from both relaxation and sleep preparation. A post-work restoration session is not a wind-down arc (which moves toward low energy and low arousal) — it is a *mid-energy soft fascination* arc that restores directed attention capacity without putting the user to sleep.

This is a use case that existing recommendation products completely miss. Spotify's focus playlists collapse restoration and focus into one category. They are neurologically distinct.

### Arc Design Implications

- Add "Restore / Recover" as a distinct session intent category, separate from "Wind down" and "Focus"
- Restoration arc acoustic profile: energy 0.45–0.55, warmth 0.6–0.7, density 0.2–0.35, organicity 0.7–0.85, sacred 0.5–0.65 — wave shape with gentle movement
- High organicity (acoustic, natural timbres) is the primary differentiator for restoration arcs — field recordings, acoustic instruments, live recordings, natural reverb
- Restoration arcs should have *enough* movement to maintain involuntary attention but not enough to demand directed attention: density should stay low but energy can oscillate gently (wave shape)
- Duration: 30–45 minutes is sufficient for directed attention restoration, making this the shortest recommended session length
- ART is the psychological grounding for the "Drift" container concept (Container Rethink, Section 15 of FEATURES.md) — Drift mode is acoustically a restoration arc

---

## 10. Music and Physical Performance

### The Science

The evidence for music's effect on physical performance is unusually strong for psychology — multiple meta-analyses converge on consistent findings (Karageorghis & Terry, 2011 onwards):

- **Tempo synchronization**: movement cadence synchronized with music tempo (isotempoal listening) reduces perceived exertion by 10–15% and extends time to exhaustion by up to 15%. The effective tempo range for most steady-state exercise is 120–145 BPM.
- **Motivational music**: music with high motivational qualities (strong rhythm, aspirational lyrical content, culturally familiar associations with effort) reduces perceived exertion during submaximal exercise independent of tempo.
- **Pre-task priming**: high-energy music listened to 10–15 minutes before physical effort increases anaerobic power output and perceived readiness. This is the "pre-hype arc" (SH04 in FEATURES.md) — it has physiological grounding.
- **Dissociation**: during low-to-moderate intensity exercise, music functions as attentional dissociation — directing attention away from fatigue signals. This mechanism breaks down at high intensities (>70% VO2max) where body signals dominate.
- **Recovery acceleration**: slow tempo, high warmth music during cool-down phases accelerates heart rate recovery vs. silence.

The Strava integration is directly supported by this research. A running arc is not about music preference — it is about physiological optimization. The arc can be engineered to extract measurably better physical performance.

### What It Means for Woody

Activity arcs are not just "music for when you're running" — they are physiological tools. The difference between a random playlist and a Woody activity arc is the difference between training with and without a coach. This is a powerful product narrative.

The pre-hype arc (SH04) is validated: 5–10 minutes of high-energy, high-density acoustic preparation before an activity produces measurable priming effects. This should be a designed session component, not an afterthought.

The dissociation mechanism means that activity arcs at high exertion levels should prioritize rhythm and motivational qualities over acoustic complexity — the user is not actually "listening" in the attentive sense, they are entraining and dissociating.

### Arc Design Implications

- Activity arcs should be structured in three zones: pre-hype (5–10 min, high energy build), main arc (tempo-matched to activity cadence), cool-down (15–20 min, inverse shape, warmth increases)
- Strava integration (A01/A04) should extract effort curve and translate to acoustic energy curve, with BPM targets derived from expected movement cadence
- Default activity arc tempo targets: running 155–175 BPM (energy 0.8–0.9), cycling 130–145 BPM (energy 0.75–0.85), walking 110–125 BPM (energy 0.5–0.65)
- Pre-hype arc (SH04) is a distinct 5–10 minute session segment before activity begins — it should be a designed product moment, not just the first few tracks
- Cool-down arc is also a distinct segment — high warmth, high organicity, descending energy. Recovery acceleration from cool-down music is measurable.
- During high-intensity segments, acoustic complexity (sacred, density variation) is less important than consistent tempo and energy — the algorithm should flatten complexity during intensity peaks

---

## Product Principles

*Derived from the psychology research above. These are not features — they are behavioral laws for how Woody operates.*

---

### 1. The arc is the unit. Never the track.

A track recommendation without temporal context is acoustically meaningless. The emotional impact of any given track is inseparable from what preceded it and what follows. Every interaction Woody surfaces should be arc-shaped: a journey with a start state, a trajectory, and a landing. Single-track recommendations are ingredient delivery; Woody delivers meals.

*Grounded in: mood regulation theory, Russell's circumplex traversal, frisson engineering, habituation management*

---

### 2. Match before you move.

Do not start where the user wants to end up. Start where they are. A user who is anxious and wants calm needs a session that acknowledges the anxious state first — acoustically mirroring current arousal before guiding downward. A user who is sad and wants to process needs congruence, not immediate uplift. The arc always begins with a meeting of the user's present state.

*Grounded in: mood regulation theory (discharge strategy, congruent music for repair), Russell's circumplex traversal logic*

---

### 3. The body has a session length. Respect it.

90 minutes is not an arbitrary default — it is the duration of one human ultradian cycle. Session arcs should be designed around the BRAC: a 90-minute arc has a natural arc shape imposed by human physiology. When the body reaches its ultradian trough at ~80 minutes, the session should accommodate it, not fight it. The 2-hour extended session crosses into the next cycle and should be designed accordingly.

*Grounded in: ultradian rhythms (BRAC), cognitive performance research*

---

### 4. Earn the peak moments.

Frisson — the most potent emotional payoff music can deliver — requires setup. An unexpected energy surge from an already high-energy context produces nothing. The same surge from a lower-density, lower-energy context produces chills. Woody must manage the acoustic approach to peak moments: building negative space (low density, low energy) before delivering intensity. The architecture of anticipation is a product responsibility.

*Grounded in: musical frisson research (violated expectation → resolution), habituation theory*

---

### 5. Novelty is earned, not gifted.

New music is not a feature — it is a stressor that requires spare cognitive bandwidth to appreciate. Novelty is most effective when the user is in a positive, moderately aroused state, with acoustic anchors (familiar territory tracks) establishing safety before exploration. Discovery mode should not front-load unfamiliarity. The arc enters known territory before departing into the unknown.

*Grounded in: habituation and novelty-seeking cycles, Berlyne's arousal theory, MEAR research (nostalgic anchors as safety)*

---

### 6. Silence is an acoustic choice. Complexity costs attention.

For every cognitive work session, every study arc, every recovery session — the acoustic complexity budget is finite. Dense, harmonically surprising, lyrically prominent music is not "better" music for these contexts — it is the wrong tool. The engine must know when the goal is *not* to be interesting. A study arc that the user barely notices is a successful study arc. Restraint is a product virtue.

*Grounded in: flow state research, attention restoration theory, cognitive load and music research*

---

### 7. Nostalgia is a protected zone.

Tracks that trigger autobiographical memory recall carry emotional weight that acoustic coordinates cannot measure. Unexpected encounters with high-MEAR tracks during task-oriented sessions are product failures. Nostalgic content belongs in opt-in zones: rediscovery mode, wind-down, solace arcs. The system should never ambush the user with their own past.

*Grounded in: MEAR research, reminiscence bump, nostalgia psychology*

---

### 8. The arc is the social object because the arc is the bonding object.

Sharing a track is sharing an opinion. Sharing an arc is sharing an experience — a temporal, acoustic journey the recipient can *follow*. This is neurologically distinct: following an arc activates the same entrainment mechanisms that made the original experience meaningful. The social layer works because arcs are reconstructable and followable, not because they are visible or likeable. Design every sharing artifact around the journey, not the endpoint.

*Grounded in: neural entrainment research, oxytocin pathway, shared-taste-as-trust-signal research*

---

### 9. Activity arcs are physiological tools, not playlists for exercise.

When a user imports a Strava run or starts an activity session, the acoustic arc they receive is not a curated playlist — it is a physiological intervention. The pre-hype segment primes anaerobic readiness. The tempo-matched main arc reduces perceived exertion and extends endurance. The cool-down arc accelerates heart rate recovery. These effects are real, measurable, and should be communicated as such. Woody's activity arc is a performance tool.

*Grounded in: music and physical performance research (Karageorghis), tempo synchronization and dissociation mechanisms*

---

### 10. Acoustic intelligence is in service of psychological intentionality.

Woody's technical foundation is acoustic coordinates. But the goal is never acoustic precision for its own sake — it is psychological state navigation. The acoustic engine is the mechanism; the destination is a specific human feeling at a specific moment. Every product decision should be evaluated against this: does it help the user get to where they need to be, emotionally and cognitively, in the moment they are in? If not, it is acoustic cleverness without psychological purpose.

*Grounded in: the full body of research above — mood regulation, circumplex model, flow state, ART, physical performance*

---

## Appendix: Acoustic Coordinate Reference for Psychology-Based Arc Design

| Psychological goal | Energy | Warmth | Density | Organicity | Sacred | Arc shape |
|-------------------|--------|--------|---------|-----------|--------|-----------|
| Mood repair (gradual) | 0.3→0.6 | 0.4→0.7 | 0.3→0.5 | 0.6 | 0.4→0.6 | Journey |
| Discharge / process | 0.2→0.4 | 0.2→0.5 | 0.4→0.6 | 0.7 | 0.3→0.6 | Single apex |
| Maintenance / plateau | steady | steady | steady | steady | steady | Plateau |
| Deep focus / study | 0.35 | 0.55 | 0.25 | 0.65 | 0.45 | Plateau |
| Creative work | 0.5 | 0.7 | 0.4 | 0.6 | 0.35 | Wave |
| Attention restoration | 0.5 | 0.65 | 0.3 | 0.75 | 0.55 | Wave |
| Physical activity | 0.85 | 0.5 | 0.75 | 0.35 | 0.4 | Apex/Intervals |
| Wind down | 0.2 | 0.75 | 0.2 | 0.7 | 0.7 | Inverse |
| Nostalgia / rediscovery | 0.45 | 0.65 | 0.35 | 0.75 | 0.6 | Journey |
| Euphoria / peak | 0.85→0.95 | 0.6 | 0.7→0.85 | 0.4 | 0.5 | Single apex |

*Values are starting-point estimates. Real arcs traverse these spaces rather than holding static coordinates.*

---

*This document should be updated as new research is incorporated and as product decisions crystallize against these principles. Cross-reference STRATEGY.md for intent model decisions, FEATURES.md for implementation status.*

---

## 11. Transition Coherence and Flow Disruption

### The Core Insight

The optimization target for a listening session is not "songs you love" — it is **songs you do not interrupt**. These are different things. A track can score highly against an acoustic target and still cause a skip — because the skip is not a judgment on the track, it is a judgment on the *transition*. The transition broke something that was working.

The underlying mechanisms:

**Flow state and interruption cost** — Csikszentmihalyi's flow requires continuity. Disruption does not pause the state; it *exits* it. Re-entering flow after interruption costs more psychological energy than maintaining it. This is why a "good enough" seamless transition outperforms a "perfect" jarring one every time.

**Loss aversion applied to flow** — the pain of losing a flow state is greater than the pleasure of a marginally better track. Acoustic coherence between transitions is therefore worth more to session quality than individual track optimality.

**Peak-end rule (Kahneman)** — an experience is remembered by its peak and its ending, not its average. An interrupted flow session is remembered by the interruption. The last 40 excellent minutes don't save a bad exit.

**Status quo bias / interruption aversion** — once a session is flowing, the psychological preference is for continuation. Any moment that forces a decision (skip or not?) is a cost, even a micro-cost. The ideal session contains zero skip decision points — not because every track is perfect, but because none of them force a decision.

### What the Skip Actually Signals

A skip does not mean "I don't like this song." It means "this transition cost more than the current flow state could absorb." The same song might be loved in isolation and skipped mid-session. Woody's engine must model this: skip events are *transition quality signals*, not track quality signals.

This is a fundamental reframing from how every other recommendation system treats skip data.

### Implications for the Engine

The recommendation engine currently computes acoustic distance from candidate tracks to the target state. It must additionally compute **transition coherence**: acoustic distance from the *currently playing track* to each candidate. A track that scores well against the target but requires a large acoustic jump from the current moment is a skip risk.

Optimal session generation is therefore a two-dimensional path problem:
1. Direction toward acoustic target (are we making progress?)
2. Step size per transition (how much acoustic shift per track boundary?)

The session arc model already handles this at macro level. Transition coherence applies it at micro level — every individual track boundary is a transition quality decision, not just the overall arc shape.

**The skip rate during the first 15 seconds is a particularly strong transition quality signal** — it indicates the transition failed before the track had a chance to be evaluated on its own terms.

### Dopamine Baseline Manipulation

Setting a low acoustic baseline at session start and rising gradually produces disproportionate reward. This is grounded in reward prediction error (Schultz): dopamine spikes are triggered not by reward itself but by *better-than-expected* reward. A low starting state makes every rise feel larger than it is.

This is how skilled DJs build euphoria — not by starting at maximum energy, but by establishing a baseline below the audience's expected state and rising. The same principle applies to lock-in / focus induction sessions: start below the target acoustic state, rise gradually, arrive without the user noticing the transition.

**Baseline Rise** as a specific session arc shape: starts 0.2–0.3 below target acoustic coordinates across energy and density, spends 20–30% of session in the approach, arrives at target and plateaus. Felt as: effortless entry into the desired state.

### Behavioral Precursors vs. Expressed Behavior

Capturing the body's acoustic response without sensor data is a key challenge. The insight: **portrayed behavior is not universal, but precursors presumably are similar in nature across users.** Someone dancing or tapping or having a physical response to music may express it differently — but the *conditions that precede* those states (time of day, recent activity, device behavior, session context) are more universal and more learnable.

**Interaction signals as implicit body response:**
- Skip timing (skipped at 8 seconds vs. 2 minutes)
- Replay (wanted to re-experience this moment)
- Seek forward (too slow for current state) / seek back (wanted to return)
- Volume adjustments (up = engagement, down = distraction or transition away)
- Session length before stopping (the ultimate satisfaction signal)
- Time to first skip (long = good session calibration)

These signals capture what worked acoustically without requiring any physiological sensor. They are universally available and require no permissions. Build the implicit preference model on these.

**Wearable integration** (Apple Watch, Fitbit) provides heart rate — the most honest physiological signal available — for users who have it. This should be an optional enhancement, not a dependency.

---

## 12. The Pause Problem and Acoustic Hold State

### The Problem

Binary play/pause is the wrong model for flow-based listening. When music stops, silence begins. Silence is cognitively active — the default mode network re-engages immediately, and the flow state exits within seconds. This is not a product failure; it is neuroscience. The question is whether the product accommodates it or ignores it.

### The Solution: Soft Pause / Acoustic Hold

A third playback state between play and full stop: **Acoustic Hold**. When triggered:

1. **Graceful ending** (peak-end rule application): Woody has 1–2 seconds to resolve whatever is playing into a satisfying acoustic exit — a DJ-style micro-fade, a reverb sustain, a resolving harmonic texture. The last sound heard before the hold is a completion, not a cut.

2. **Hold state**: rather than silence, a low-level ambient acoustic texture sustains — the reverb tail of the last track, a gentle drone, the acoustic character of the moment held without progressing. Not music. Not silence. The psychological space is kept warm.

3. **Re-entry protocol**: when the user returns, the session does not just resume. If the hold was short (< 60 seconds): seamless continuation. If the hold was longer: a 15–20 second acoustic re-establishment — building back the session's momentum and acoustic character before the main content resumes. Re-entry, not resumption.

4. **"Flow may have reset" prompt**: if hold exceeds a few minutes, on resume: "It's been a while. Continue this session or start fresh?" Not guilt, not pressure — honest acknowledgment of the psychological reality. The user keeps agency.

### Why the Graceful Ending Matters

The peak-end rule means the session is remembered by its ending. A hard cut mid-session creates a negative final impression regardless of how good the preceding 40 minutes were. A graceful acoustic resolution — even a 2-second one — converts an interrupted session into a completed one, psychologically. This is worth significant engineering investment relative to its impact on user memory of the product.

---

## 13. Lock-In Sessions / Focus Induction

### The Concept

A **lock-in session** is music as a psychological intervention for task focus — not a vibe selection, but a deliberate acoustic arc designed to induce and sustain a specific cognitive state for a specific purpose.

The intent capture goes beyond "I want to feel X" to include "I need to DO Y while feeling X." The task is part of the acoustic target. Different tasks have measurably different optimal acoustic states (see Section 7, Flow State; coordinate reference in Appendix). The lock-in session makes this explicit.

### The Flow

1. User declares intent to lock in
2. System captures: task description (what are you doing), current state (how you're arriving), desired end state, duration
3. RAG system with song embeddings matches task description to behavioral acoustic profiles — not just acoustic coordinates but what the track *does* psychologically ("builds focus without urgency," "grounds without sedating")
4. Baseline Rise arc shape applied: session starts below target acoustic state, rises gradually to optimal plateau
5. Session runs without requiring decisions. The music takes responsibility for state management.
6. Soft pause available if interruption occurs; re-entry protocol applies

### Action Attribution

The lock-in session represents a new relationship with music: **music attributed to an intended outcome**. The session has a job. It is not background — it is an active tool. This framing has implications for how the product communicates (not "music for work" but "music that works with you") and for what success means (not "did you enjoy the tracks" but "did you complete what you locked in for?").

Post-session, the system can correlate session acoustic characteristics with task completion signals (session length, skip rate, uninterrupted run time) to refine future lock-in recommendations.

---

## 14. Contextual Signal Architecture

### What Can Be Captured Passively

High-signal contextual data available without active user input:

| Signal | What it indicates | How captured |
|--------|------------------|--------------|
| Time of day + day of week | Probable state (morning alertness, afternoon dip, evening wind-down) | System |
| Headphone connection type | Committed listening vs. ambient | OS signal |
| Screen state (on/off) | Active interaction vs. passive listening | OS signal |
| Recent activity data | Physical state (post-run, sedentary, commuting) | Strava/Health API |
| Calendar context | Cognitive load coming up or just completed | Calendar API |
| Session history (last 24h) | Acoustic trajectory and prior states | Internal |
| Skip rate (current session) | Real-time acoustic fit quality | Internal |
| Session length vs. expected | Satisfaction signal | Internal |
| Replay events | Resonance signals | Internal |
| Volume adjustments | Engagement and distraction signals | Internal |
| Weather / ambient (if permitted) | Environmental context | Location/weather API |
| Heart rate (if wearable connected) | Actual physiological arousal state | HealthKit/Fitbit API |

### The Precursor Principle

The most reliable data for state inference is not expressed behavior but **behavioral precursors** — the conditions that reliably precede states across users. Time of day precedes morning activation. Post-exercise session history precedes elevated baseline. Headphones + screen off precedes committed listening mode.

Individual expressed behavior (dancing, tapping, physical response) is non-universal and largely uncapturable passively. Precursors are more universal, more learnable at scale, and require no sensor permissions.

Build the contextual model on precursors. Let expressed behavior (skip rate, replay, volume) validate and refine it in real-time during sessions.

---

## Updated Acoustic Coordinate Reference

| Psychological goal | Energy | Warmth | Density | Organicity | Sacred | Arc shape |
|-------------------|--------|--------|---------|-----------|--------|-----------|
| Mood repair (gradual) | 0.3→0.6 | 0.4→0.7 | 0.3→0.5 | 0.6 | 0.4→0.6 | Journey |
| Discharge / process | 0.2→0.4 | 0.2→0.5 | 0.4→0.6 | 0.7 | 0.3→0.6 | Single apex |
| Maintenance / plateau | steady | steady | steady | steady | steady | Plateau |
| Deep focus / study | 0.35 | 0.55 | 0.25 | 0.65 | 0.45 | Plateau |
| Creative work | 0.5 | 0.7 | 0.4 | 0.6 | 0.35 | Wave |
| Attention restoration | 0.5 | 0.65 | 0.3 | 0.75 | 0.55 | Wave |
| Physical activity | 0.85 | 0.5 | 0.75 | 0.35 | 0.4 | Apex/Intervals |
| Wind down | 0.2 | 0.75 | 0.2 | 0.7 | 0.7 | Inverse |
| Nostalgia / rediscovery | 0.45 | 0.65 | 0.35 | 0.75 | 0.6 | Journey |
| Euphoria / peak | 0.85→0.95 | 0.6 | 0.7→0.85 | 0.4 | 0.5 | Single apex |
| Lock-in / focus induction | 0.2→0.45 | 0.55 | 0.2→0.35 | 0.65 | 0.45 | Baseline Rise |
| Baseline Rise approach | starts –0.25 below target | starts –0.15 below target | starts –0.2 below target | steady | steady | Custom |
