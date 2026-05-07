---
name: biz-model-research
description: Research comparable business models, extract the specific mechanisms behind their success (not surface observations), map those mechanisms to your product context, and identify actionable growth and marketing levers. Use when you need to learn from analogous companies before committing to a strategy. Pairs with /devils-advocate and /strategy-suite.
argument-hint: "[your product] vs [comp1, comp2, comp3] — focus: [moat | growth | monetization | marketing]"
---

# /biz-model-research

> The goal is not to copy. It is to understand *why* something worked at a mechanism level — then ask whether that mechanism is available to you, in your context, at this moment.

Surface-level comp analysis ("Letterboxd did X, we should do X") is almost always wrong. The mechanism that made X work for Letterboxd may not be available to you, or may require different conditions than you have. This skill forces the deeper question.

---

## Workflow

### Step 1 — Select Comparables
Choose 3–5 companies that are structurally similar, not just thematically similar. The right comps share:
- A similar **value delivery mechanism** (how the product creates value for the user)
- A similar **community/network dependency** (if applicable)
- A similar **phase of market development** when they launched

Wrong comp selection is the most common error. "We're like Spotify" is almost always the wrong comp. Find the company that solved the same *underlying* problem, not the same surface problem.

### Step 2 — Extract Success Mechanisms (not observations)

For each comparable, go three levels deep:

**Level 1 (Observation):** What did they do?  
*"Letterboxd added social features."*

**Level 2 (Pattern):** Why did it work?  
*"Social features worked because film watching is already a shared cultural activity with established vocabulary — it had a pre-existing social layer to digitise."*

**Level 3 (Mechanism):** What specifically was the load-bearing component?  
*"The load-bearing component was the diary format — it made logging feel personal and low-stakes, which lowered the activation energy for first-time posters. Without the diary, it would have felt like publishing, not note-taking."*

Always reach Level 3. Level 1 and 2 are table stakes.

### Step 3 — Mechanism Availability Test

For each extracted mechanism, ask:
- **Is this mechanism available to us?** (What conditions made it work? Do we have those conditions?)
- **Is this mechanism still available?** (Did the window close? Is it saturated?)
- **What would we need to unlock it?** (Resources, timing, community size, data?)

Output: a mechanism availability matrix — which mechanisms transfer, which don't, which require adaptation.

### Step 4 — Map to Your Context

Take the transferable mechanisms and map them to your specific product, user base, and moment in time. This is where generic comp analysis becomes actionable strategy.

Format for each transferable mechanism:
```
Mechanism: [from comp]
Why it worked there: [Level 3 explanation]
Transfer condition: [what needs to be true for it to work here]
Our version: [the specific implementation in our context]
First test: [the smallest experiment that validates the transfer]
```

### Step 5 — Growth & Marketing Lever Extraction

Beyond business model mechanics, extract the specific growth levers:

**Acquisition:** How did early users find the product? What was the actual acquisition channel — not "word of mouth" but the specific community, platform, or moment that seeded it?

**Activation:** What was the "aha moment"? The specific thing a user experienced that made them come back?

**Retention:** What created the lock-in? Data accumulation, social graph, identity expression, switching cost?

**Referral:** What made users share? Was it social proof, status signalling, utility sharing, or something else?

**Revenue:** What was the first dollar? What did paying users get that free users didn't — and was it the right thing?

For each lever: extract the mechanism, test the transfer, propose the Woody-specific version.

---

## Standard Comparable Set for Music/Culture/Taste Products

Run this set when no specific comps are given:

### Letterboxd
**Core mechanism:** Identity expression through taste curation. The product made caring about film publicly legible and socially valuable.  
**Load-bearing component:** The diary format lowered activation energy. Lists enabled identity expression without requiring articulation. Pro/Patron signalled seriousness.  
**Growth lever:** Organic Twitter/film-community seeding. No paid acquisition. The product spread within pre-existing taste communities who felt underserved by IMDb and Goodreads.  
**Moat type:** Social graph + taste data. Your Letterboxd history is irreplaceable. Switching cost is identity, not convenience.

### Rateyourmusic / Sonemic
**Core mechanism:** Became the canonical reference layer for music. When you want ground truth on whether something is considered good, you go there.  
**Load-bearing component:** Taxonomy depth. The genre tagging system became so granular it had no competitor. Depth beat breadth.  
**Growth lever:** Power users (music obsessives) did all the work. Community moderation kept quality high without paid effort.  
**Moat type:** Data depth + community trust. The catalog is the product.

### Last.fm
**Core mechanism:** Scrobbling — your listening history as a persistent, cumulative data asset. The product became more valuable the longer you used it.  
**Load-bearing component:** Automatic data collection. No manual input required. Frictionless accumulation.  
**Growth lever:** Winamp and iTunes plugins made it invisible to set up. Once scrobbling started, stopping felt like losing something.  
**Moat type:** Historical data moat. Irreplaceable listening history. Strongest possible lock-in.

### Discogs
**Core mechanism:** Marketplace + database. The database (contributed by collectors) enabled the marketplace. The marketplace funded the database.  
**Load-bearing component:** Collector identity. Discogs made owning records a public, legible act. The catalog was built by people who wanted their collections documented.  
**Growth lever:** Sellers came for the marketplace, became database contributors. Buyers came for prices, became collectors.  
**Moat type:** Database depth + marketplace liquidity. Both sides of a two-sided market.

### Are.na
**Core mechanism:** Curation tool for creative professionals. Not social media — a thinking tool that happened to be shareable.  
**Load-bearing component:** Blocks (atomic units of content) that could be connected across channels. The fundamental unit was right — not posts, not likes, but connections.  
**Growth lever:** Design/art school word of mouth. Started in a specific taste community that valued the aesthetic intentionality.  
**Moat type:** Weak — data is exportable. Real moat is habit and identity. Lesson: aesthetic products need stronger functional lock-in.

### Bandcamp
**Core mechanism:** Artist-direct sales with fan relationship layer.  
**Load-bearing component:** Revenue transparency. Artists knew exactly who bought, fans felt direct connection. No algorithm between artist and fan.  
**Growth lever:** Bandcamp Fridays (100% to artists) created massive PR and community goodwill.  
**Moat type:** Artist relationships + fan libraries. Fan collections create switching cost.

---

## Mechanism Matrix for Woody

| Mechanism | Source | Transfers? | Condition | Our Version |
|-----------|--------|------------|-----------|-------------|
| Identity expression through taste | Letterboxd | ✅ Yes | Need shareable artifacts | Acoustic field as exportable identity |
| Diary/low-stakes logging | Letterboxd | ✅ Yes | Need frictionless SavePoints | Intent input → SavePoint in one step |
| Canonical reference layer | RYM | ⚠️ Partially | Needs acoustic taxonomy depth | Acoustic coordinates as the lingua franca for taste description |
| Automatic data accumulation | Last.fm | ✅ Yes | Need native app or browser extension | Scrobble-equivalent: automatic acoustic tagging of listening sessions |
| Historical data moat | Last.fm | ✅ Yes | Time — need early adopters to commit | The longer you use Woody, the more irreplaceable your territory map |
| Collector identity | Discogs | ✅ Yes | Curators already have this identity | Territory map as collection — your acoustic library |
| Atomic curation unit | Are.na | ✅ Yes | Need right unit | Track-as-coordinate is the right unit. The SavePoint is the annotation. |
| Artist-direct relationship | Bandcamp | ❌ No | Requires catalog licensing | Not the right model for Woody |
| Power user contribution | RYM | ✅ Yes | Need contribution framework | Curators building acoustic annotations and playlists as content |

---

## Novel Marketing & Growth Levers (not copied from comps)

**The acoustic embed play:** A shareable acoustic field visualization that plays live on any page — like a Bandcamp embed but for a listening session or territory. Every curator who puts it on their Substack/website is an acquisition channel.

**The "acoustic translation" hook:** Take someone's existing Spotify playlist → show them its acoustic map. The first session makes the product immediately legible and creates an "aha moment" without any new music required.

**The DJ set wedge:** The mixing/DJ community has no good logging tools. A Boiler Room set documented with acoustic arc visualization is shareable content that markets itself to a community with massive reach.

**Taste communities as launch channels:** Music blogs, music journalism Discord servers, producer communities. These are small but high-influence. One respected taste-maker adopting Woody publicly is worth 10,000 impressions.

**The "Spotify Wrapped but honest" play:** Every year Spotify Wrapped feels more like a marketing asset for Spotify than a reflection of the user. Woody's equivalent — an acoustic year-in-review showing the contours of your listening year — is genuinely personal and highly shareable without feeling like advertising.

---

## Output Format

When running this skill, produce:
1. **Comp analysis** (3–5 companies, Level 3 mechanisms each)
2. **Mechanism availability matrix** (what transfers, what doesn't, why)
3. **Mapped implementations** (our specific version of each transferable mechanism)
4. **Growth lever extraction** (acquisition, activation, retention, referral, revenue — each with mechanism + our version)
5. **Novel angles** (the things comps didn't do that are available to us given current context)
6. **First three bets** — the 3 most important things to validate, ranked by: (impact if true × probability of being true) ÷ cost to test
