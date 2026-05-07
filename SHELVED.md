# Woody — Shelved & Parked Ideas
*Ideas that came up, were considered, and either explicitly rejected or deferred with reasons. Nothing gets lost — these are preserved here so they can be revisited deliberately, not accidentally re-proposed.*

*Last updated: 2026-05-06*
*Append-only. Do not remove entries — add [REVISITED] tag if status changes.*

---

## Key

- `[REJECTED]` — Explicitly ruled out. Strong reason. Would need fundamentally different circumstances to revisit.
- `[DEFERRED]` — Good idea, wrong time. Specific condition noted for when it becomes relevant.
- `[SUPERSEDED]` — A better approach replaced this one. Original preserved for context.
- `[NEEDS VALIDATION]` — Not rejected, but not decided. Parked until real-world data available.

---

## Architecture / Engine

---

### [SUPERSEDED] Pure A* search for arc generation
**What it was:** Use A* graph search over the acoustic catalog to find optimal path from start state to end state.

**Why it was considered:** A* is theoretically optimal for pathfinding problems. Arc generation is a pathfinding problem.

**Why it was superseded:** A* over millions of tracks at 30-40 step depth is computationally infeasible without extreme pruning. Constrained beam search is what actually works in practice — maintains k candidate sequences, extends each by one track, keeps the k best. The cost function matters more than the algorithm label. Beam search is faster and practically equivalent in output quality for this problem.

**Replaced by:** Beam search (planning layer) + Markov acoustic momentum (execution layer).

---

### [SUPERSEDED] Euclidean distance as the distance metric (long-term)
**What it was:** Weighted Euclidean distance as the permanent distance function between acoustic coordinates.

**Why it was considered:** Simple, fast, interpretable. Good for MVP.

**Why it was superseded:** Euclidean assumes dimensions are independent. Energy and density correlate strongly; sacred and organicity correlate. Euclidean is provably wrong for correlated dimensions.

**Replaced by:** Phase 1: weighted Euclidean (kept for MVP speed). Phase 2: Mahalanobis distance (accounts for inter-dimension correlations). Phase 3: learned metric from skip/replay behavioral signals via contrastive learning.

---

### [DEFERRED] JEPA (Joint Embedding Predictive Architecture) for audio representation
**What it was:** LeCun's JEPA architecture — predicts in representation space rather than pixel/audio space — applied to acoustic modeling for Woody.

**Why it was considered:** Woody builds a map-like acoustic space. JEPA is designed to model structure in representation space. Seemed potentially aligned.

**Why it was deferred:** JEPA is a world-model architecture suited for dense temporal prediction. It would be relevant if Woody needed to model "what does this acoustic territory lead to in temporal sequence" — but the temporal structure of an 8-hour listening day is too long and too sparse for JEPA's prediction objective to be meaningful. JEPA requires dense observation to train well.

**Condition for revisit:** Phase 3, if session behavioral data is dense enough (multiple sessions/day per user, high-frequency skip/replay signals). Could be interesting for modeling long-horizon taste trajectories. Not Phase 1 or 2.

---

### [SUPERSEDED] LLM prompt engineering for dimension calibration
**What it was:** Use a large language model via prompting to translate audio feature descriptions into 5D perceptual coordinates.

**Why it was considered:** Fast to implement, no training data required initially.

**Why it was superseded:** LLMs produce inconsistent results on perceptual tasks. The same track described in different terms gets different scores. Not reliable enough for a product where the 5D coordinates are the core primitive.

**Replaced by:** Fine-tuned BERT-class model (DistilBERT/TinyBERT) trained on an anchor corpus of 200 tracks rated pairwise by 20+ listeners. Bradley-Terry model converts pairwise wins to continuous coordinates. ~3000 labeled examples is sufficient for fine-tuning. Consistent and calibrated.

---

### [DEFERRED] In-house social capabilities (internal feed, follows, likes)
**What it was:** Building Woody's own social graph — follows, likes, comments, feed.

**Why it was considered:** Natural extension once community content exists.

**Why it was deferred:** Building a social graph from scratch is an enormous product investment. Network effects mean it requires critical mass to have any value. Community is topic-organized (like Reddit), not person-organized (like Instagram) — so the follow graph is less central than content quality anyway.

**Condition for revisit:** Phase 3+. Only after DJ wedge strategy has produced meaningful community content. Social layer emerges from product, not vice versa. Starting with DJ content → community content → then social graph infrastructure.

---

### [DEFERRED] On-device audio analysis as primary pipeline (Essentia.js for all tracks)
**What it was:** Run all acoustic feature extraction client-side using Essentia.js WASM, eliminating the server-side audio analysis step.

**Why it was considered:** Reduces server costs. Essentia.js exists and is capable.

**Why it was deferred:** Essentia.js is performant for real-time analysis (YouTube, SoundCloud sources) but not viable as the primary pipeline for catalogued tracks — you'd be running analysis on every new user's device for every track they encounter, burning CPU and battery. The right split: Essentia.js for non-Spotify live sources; server-side Essentia (Python) for catalogued track analysis at ingestion time.

**Condition for revisit:** Not a candidate for revisit as primary pipeline. Real-time use case (YouTube/SoundCloud) remains valid and is decided.

---

### [SUPERSEDED] Spotify history as primary cold start signal
**What it was:** Mine Spotify top_tracks, recently_played, saved, and playlists on first connect to build initial acoustic territory.

**Why it was considered:** Immediately available data. No friction. Fast territory seeding.

**Why it was superseded:** Not rejected — kept as fallback. Superseded as *primary* approach because Spotify history encodes Spotify's own collaborative filtering bias. You're not getting the user's true acoustic preferences; you're getting what Spotify chose to surface to them, which systematically skews toward popular and algorithmically optimized content.

**Replaced by:** Bayesian acoustic probe approach as primary: 6-8 carefully selected tracks spanning the 5D space, behavioral responses (skip timing, replay, completion) update a Gaussian process prior over taste space. Information-theoretic probe selection — each probe is chosen for maximum expected information gain. Converges to territory estimate in 6 observations. Spotify history becomes a supplement and fallback, not the primary signal.

---

### [NEEDS VALIDATION] Full Librosa pipeline for audio analysis
**What it was:** Use Librosa (Python audio analysis library) as the audio feature extraction backbone.

**Why it was considered:** Widely used, well-documented, Python-native, large community.

**Why it needs validation:** Librosa is designed for offline analysis, not optimized for large-scale production throughput. It has licensing ambiguity for some use cases. Essentia (MTG Barcelona) is more feature-complete for music-specific analysis, has better production throughput, and has explicit MIT licensing. Also raises ethical questions about copyright-adjacent analysis of tracks at scale.

**Replaced by:** Essentia (Python) as primary, Librosa as fallback. Decision: use Essentia unless a specific feature requires Librosa. Re-evaluate if Essentia has gaps.

---

## UX / Product

---

### [REJECTED] Genre tags as navigation primitive
**What it was:** Using genre labels as a primary way for users to express intent or browse content.

**Why it was considered:** Familiar mental model for users. Easy to implement.

**Why it was rejected:** Genre is the core problem Woody solves. "I want indie" tells you nothing acoustically. Two tracks both called indie can be sonically incompatible. Introducing genre tags as navigation undermines the core value proposition — it's regressing to the language system Woody is designed to replace. Not a trade-off — a contradiction.

---

### [REJECTED] Mood labels as navigation primitive
**What it was:** Happy, sad, energetic, chill — standard mood-tag taxonomy.

**Why it was rejected:** Same reason as genre. "Happy playlist" is a social category, not an acoustic reality. Mood labels are arbitrary and unverifiable — two people using "happy" mean different acoustic things. Woody's 5D system is the structural replacement for this. Mood labels as *shortcuts* that internally map to acoustic coordinates are acceptable (see intent chip system), but mood labels as first-class navigation primitives are not.

---

### [REJECTED] Artist / track ratings and reviews
**What it was:** A Letterboxd-style rating system for tracks and artists.

**Why it was considered:** Letterboxd is an explicit inspiration for the product model.

**Why it was rejected:** Opinion is not the social object. The arc is the social object. Rating a track is a static judgment that doesn't capture how that track functions in context. The same track rated differently depending on whether it's at the start or the end of a session, in a study arc vs. a workout arc. Star ratings erase this context. Woody's data model (session arc as social object, acoustic coordinates as the primitive) is incompatible with track-level ratings — it would incentivize a fundamentally different user behavior.

---

### [REJECTED] Woody as a streaming service / in-house catalog
**What it was:** Building a music catalog and streaming infrastructure rather than sitting on top of Spotify.

**Why it was rejected:** Licensing costs, legal complexity, direct competition with Spotify/Apple Music on a dimension (catalog breadth) where Woody cannot win. The Letterboxd model is right: be the intelligence and curation layer, not the content layer. Licensing is the graveyard of music startups.

---

### [DEFERRED] Pixel/custom art as shareable artifact format
**What it was:** Custom pixel art or illustrated art generated per-user as a shareable artifact of their acoustic territory.

**Why it was considered:** Visually distinctive. Potentially viral. Solves the "I want to share something" impulse.

**Why it was deferred:** Not rejected, but not decided. Needs the illustrated form library to be designed first. Also needs validation that it serves creator-ownership goals — the artifact must feel like the creator's, not Woody's. A fixed aesthetic (pixel art) might feel more like a Woody brand stamp than a creator artifact.

**Condition for revisit:** After illustrated form library is designed (8-12 fluid shapes). Requires a dedicated visual/artifact design session. Open question in VISUAL_LANGUAGE.md 9.7.

---

### [SUPERSEDED] TikTok/Reels short video as the primary shareable artifact format
**What it was:** Short video clip of the acoustic field animation as the primary creator sharing format.

**Why it was superseded:** A short video of the acoustic field is a *visual* artifact, not a *community* artifact. It communicates aesthetic but not meaning. It's engaging as a visual but not engaging in terms of music — a viewer sees a pretty animation but can't interact with the arc, can't explore the territory, can't adopt the session. It becomes a Woody marketing artifact rather than a creator's own content.

**Replaced by:** Three-format approach — (1) interactive web artifact (Mixcloud/blog embed — the full arc, interactive, explorable), (2) live screen/projection for DJ sets, (3) short video as secondary reach amplifier only, not primary format. Creator-native template system: creator uses their color palette, typography, branding; Woody provides acoustic data and visualization engine; Woody credit is metadata only, not a visual element.

---

### [DEFERRED] Waveform/spectrum analyzer visualizations
**What it was:** Traditional music visualizer — waveform display, frequency spectrum bars.

**Why it was deferred:** Not the visual language. Waveform visualizers are associated with SoundCloud/generic audio players. They display signal properties, not acoustic meaning. Woody's visualization language is the acoustic field (continuous 2D space, not discrete frequency bars). Waveforms are explicitly excluded from VISUAL_LANGUAGE.md 9.6.

---

### [NEEDS VALIDATION] Voice-first intent input as primary mobile UX
**What it was:** Voice as the *primary* intent entry method on mobile, with text as fallback.

**Why it was considered:** Voice is fastest on mobile. No typing friction. "Hey, I just finished a run and I want to cool down" is 3 seconds.

**Why it needs validation:** Requires users to be comfortable speaking intent out loud. This is highly context-dependent (public spaces, social settings, around other people). Voice as a *available* method is decided. Voice as *primary* needs user testing to see how often it's actually used vs. typed text. Don't over-engineer voice if 80% of intent input is typed in practice.

---

### [DEFERRED] Guided music listening / therapeutic music use
**What it was:** Using music as an intentional tool for psychological state manipulation — not as entertainment but as a precision intervention. Pre-cognition priming, emotional regulation protocols, focus induction sequences.

**Why it was considered:** Strong psychological evidence base. Differentiates from entertainment apps. Aligns with the "music as tool" framing (athlete pregame, focus sessions).

**Why it was deferred:** Powerful but risky to enter without clinical grounding. The line between "focus music" (clearly product territory) and "therapeutic intervention" (requires clinical oversight) is blurry. Phase 1 covers the product-safe end (focus, wind-down, energy maintenance). The therapeutic end (grief processing, anxiety management) requires clinical partnerships and more care. Not rejected — deferred until core product is validated and there's capacity for responsible design in that space.

**Condition for revisit:** Phase 3+. Requires: (1) user research establishing demand, (2) clinical advisory input, (3) careful UX design to avoid overclaiming.

---

## Technical / Infrastructure

---

### [SUPERSEDED] Simple k-NN as the only recommendation approach
**What it was:** Weighted k-nearest-neighbor in 5D space as the sole recommendation mechanism.

**Why it was superseded:** k-NN alone finds acoustically similar tracks but doesn't generate *arcs*. It has no concept of trajectory, transition coherence, or session shape. It selects good individual tracks but produces bad sessions. The full engine is: k-NN for candidate shortlisting → beam search for arc planning → Markov acoustic momentum for execution → RL (Phase 3) for long-horizon optimization.

---

### [DEFERRED] Full federated model training (aggregating user gradients at scale)
**What it was:** True federated learning — each user's device trains a local model, encrypted gradients are aggregated server-side to improve the population model.

**Why it was considered:** Privacy by design. Raw behavioral data never leaves device. Differential privacy on aggregation.

**Why it was deferred:** Federated learning at scale is an engineering mountain — requires secure aggregation infrastructure, differential privacy implementation, gradient compression for mobile bandwidth, coordination protocol. This is Phase 3 architecture. Phase 1: server-side population model trained on anonymized aggregated behavioral data (not individual raw data). Phase 2: on-device personal model (Phi-3/Gemma INT4) fine-tuned locally via RL — this is the privacy benefit for users. Phase 3: full federated aggregation if scale justifies it.

---

### [DEFERRED] MERT as on-device embedding model
**What it was:** Running MERT (300M-600M parameter music transformer) on-device for real-time acoustic embedding.

**Why it was deferred:** MERT models are 300M-600M parameters — not viable for on-device inference at these sizes. Battery, thermal, and memory constraints make this impractical on current mobile hardware. INT4 quantization reduces this somewhat but not enough.

**Condition for revisit:** If distilled MERT variants emerge (sub-50M parameters) with acceptable quality. Currently: MERT runs server-side at track ingestion time only. On-device inference uses the much smaller personal RL model (Phi-3-mini-4k or Gemma-2B, quantized INT4).

---

### [NEEDS VALIDATION] YouTube as a primary music source (not fallback)
**What it was:** Full YouTube integration as a co-equal source alongside Spotify — not just "if Spotify doesn't have it."

**Why it needs validation:** YouTube has the broadest catalog. But: (1) YouTube's API terms are restrictive around building music products on top of them, (2) audio quality varies wildly, (3) user experience of YouTube playback in a music context is degraded (ads, video, interface). The Screen Capture API approach for live analysis works, but it's a workaround, not a native integration.

**Condition for revisit:** If YouTube Music offers an API partnership. Otherwise, keep as fallback for catalog gaps only.

---

## GTM / Business

---

### [DEFERRED] Artist/performer partnerships as early GTM
**What it was:** Partnering with artists (not DJs) directly to feature their music with Woody acoustic intelligence.

**Why it was deferred:** Artists have labels, rights, and gatekeepers. The DJ wedge is cleaner — DJs have the audience and the documentation behavior, without the label overhead. Artist partnerships are Phase 3+ after there's a product worth pitching.

---

### [DEFERRED] Athlete / performance-driven branding (pregame arcs, hype mixes)
**What it was:** Athletes and performance-driven users using Woody natively for purpose-driven acoustic sessions — pregame hype, warm-up, cooldown. Potential brand partnerships with athletes as influencers.

**Why it was considered:** Strong authentic use case. Athletes already have pregame playlists they've iterated for years. Woody makes the implicit explicit: "this arc takes you from 0.3 Energy to 0.9 Energy over 45 minutes" is a training prescription, not a playlist recommendation. Shareable arc as a methodology other athletes can adopt.

**Why it was deferred:** Right use case, wrong time. GTM priority is DJ wedge → intentional listener → community. Athlete market requires brand partnership infrastructure and sports-world credibility that doesn't exist yet. Also: need to validate that athletes care about acoustic precision, not just the social signal of having a branded playlist. The version that fails is athlete partnerships become a marketing exercise with no authentic use underneath.

**Condition for revisit:** Phase 2-3 GTM, after DJ wedge has established Woody's credibility as a performance tool. Add athlete/performance as a named use case to FEATURES.md under activity integration.

---

### [REJECTED] Advertising-based revenue model
**What it was:** Serving ads to free-tier users.

**Why it was rejected:** Ads interrupt the acoustic experience — the precise opposite of what Woody is trying to provide. More fundamentally: an ad-supported product optimizes for attention and time-on-platform, which conflicts with Woody's design principle of intentional, purposeful sessions. Woody should be a subscription product. Users who pay are users who value the experience enough to protect it.

---

### [DEFERRED] Spotify competitor positioning (we're better than Spotify)
**What it was:** Marketing Woody as an alternative to Spotify.

**Why it was deferred:** Woody is not a streaming service. Positioning against Spotify invites comparison on catalog, interface, and library features where Woody loses. The right positioning: "the intelligence layer for your music life" — Woody makes Spotify better, not Spotify-replaceable. Direct competition framing also makes Spotify more likely to try to block API access or build competing features.

---
