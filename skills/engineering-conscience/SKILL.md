---
name: engineering-conscience
description: Persistent engineering security and ethics layer for the Woody codebase. Activates automatically on any engineering, architecture, or data-related discussion. Audits for auth vulnerabilities, privacy violations, OWASP risks, GDPR/CCPA compliance, ethical ML implications, dependency risks, and secure coding failures. Runs silently on routine work, speaks up proportionally to risk severity. Invoke explicitly with /engineering-conscience for a full structured audit of any design, spec, or code.
---

# Engineering Conscience

A proportional, persistent security and ethics layer. The goal is not paranoia — it is to catch the class of mistakes that are expensive to fix after the fact, cheap to address during design, and easy to miss when you're moving fast.

## Activation Modes

This skill runs in two modes:

**Passive (always on):** Woven into every engineering response. Volume is proportional to risk:
- Critical risk (data exposure, auth bypass, ML bias) — interrupt and flag explicitly before continuing
- Moderate risk (missing rate limiting, unencrypted at-rest, broad permissions) — one-line note after main response
- Low risk (verbose logging, weak typing) — silent unless asked

**Active (explicit audit):** When the user invokes `/engineering-conscience` or asks for a security/privacy review, run the full structured audit below.

---

## Domains to Monitor

### 1. Authentication & Authorization
The failure mode is subtle scope creep: a feature gets added that implicitly expands what an unauthenticated or lower-privileged user can access.

Watch for:
- API endpoints that return user data without verified identity (Spotify OAuth scopes — are we requesting only what we need?)
- JWT: expiry, rotation, storage (never localStorage for sensitive tokens — use httpOnly cookies or secure native storage)
- Personal model data: on-device means access controls are the OS, not your server. What happens on a shared device?
- Federated learning: gradient upload endpoints must be authenticated — poisoning attacks are real
- Incognito/session exclusion: is there any server-side trace of incognito sessions? There must not be

### 2. Privacy by Design (GDPR/CCPA/PIPEDA)
For Woody specifically, the privacy promise is structural (gradients only, not raw behavior) — if that promise breaks anywhere, the whole trust architecture collapses.

Watch for:
- Any raw listening event (track ID + timestamp + user ID) leaving the device without explicit consent
- Acoustic territory data — this is behavioral fingerprint data, treat as PII
- Server-side personalization logs: if the personal model is on-device, why is any inference result going to the server?
- Third-party SDKs (analytics, crash reporting) that silently exfiltrate behavioral data
- Data retention: what's the deletion path? GDPR requires it. Build it at the same time as the write path, not later.
- Spotify API terms: they prohibit storing certain audio feature data beyond session use. Verify caching of audio features complies.

### 3. OWASP Top 10 (Applied to Woody)
Not as a checklist but as a threat model for this specific product:

| OWASP Risk | Woody-Specific Manifestation |
|---|---|
| Injection | NL intent parser → dimension targets: is user text sanitized before hitting any DB query? |
| Broken Auth | Spotify OAuth flow: PKCE required for mobile/web, not implicit grant |
| Sensitive Data Exposure | Acoustic territory stored in cloud — encrypted at rest? Key management? |
| Security Misconfiguration | Default Essentia/ML model endpoints exposed without auth during development |
| Vulnerable Dependencies | Essentia.js WASM build: supply chain risk, pin versions, verify checksums |
| Insufficient Logging | Federated gradient uploads: log the metadata (device ID, model version, timestamp) not the gradients |

### 4. Ethical ML
The dimension model is the product. Bias here is product failure, not just ethics failure.

Watch for:
- Training data cultural bias: are Essentia's feature extractors calibrated on Western music? Classical Indian, microtonal, polyrhythmic music will score strangely on Energy/Density without intentional correction.
- Cold start territory from Spotify history: Spotify's own recommendations are biased. We're inheriting that bias as seed data.
- Feedback loop amplification: the personal RL model optimizes for session completion. If a user gets stuck in a narrow acoustic territory because early sessions were constrained, the model reinforces that constraint. Need explicit exploration budget.
- Attribution objectives: training on "which dimension caused failure" requires ground truth labels. Who labels them? If it's inferred from skips/completions, the inference model must account for confounds (user was interrupted, not dissatisfied).
- Acoustic archetypes as labels: "warm organic descent" vs "cold electric drive" — these names carry cultural weight. Name them acoustically (by coordinates), not culturally.

### 5. Secure Coding Patterns
- Screen Capture API (tab audio sharing): this is a user-granted permission, but what happens to that audio stream? Must never be uploaded, never stored. Process in WASM, discard.
- Essentia.js WASM: runs in a sandboxed browser context. But: what does it emit? Ensure it's structured feature vectors, not raw audio chunks.
- On-device model weights: treat like private keys. Never include in crash reports. Never sync to cloud without explicit opt-in.
- YouTube player integration: same-origin policy means you can't read the audio buffer directly. Screen Capture API is the circumvention — but it's fragile. Handle the case where permission is denied gracefully.

### 6. Dependency Risk
- Essentia (Python, WASM): MIT licensed, MTG Barcelona. Last major release check: they maintain it actively, but WASM build is less battle-tested than the Python package. Pin versions.
- Phi-3 / Gemma 2B: Microsoft/Google respectively. Model weights have license terms — commercial use requires checking terms at download time, not at deployment time.
- Spotify Web API: terms prohibit storing audio content but permit storing metadata. Audio features (BPM, energy, etc.) are metadata — likely fine, but confirm with legal.
- DistilBERT / TinyBERT for dimension calibration: Apache 2.0 / MIT — clean for commercial use.

---

## Full Audit Template (active mode)

When invoked explicitly, structure the output as:

```
## Engineering Conscience Audit — [Component/Feature]

### 🔴 Critical (must fix before shipping)
[Issue] → [Specific fix]

### 🟡 Moderate (fix in same sprint)
[Issue] → [Specific fix]

### 🟢 Low / Future (log and revisit)
[Issue] → [Recommended approach]

### ✅ What's solid
[What the design gets right — not just negatives]

### Open questions requiring external input
[Anything needing legal, Spotify ToS review, or user research to answer]
```

---

## Woody-Specific Standing Rules

These apply permanently, no need to re-check:

1. **Raw listening events never leave the device unencrypted and unminimized.** If a Woody server receives `{user_id, track_id, timestamp, listen_duration}`, that's a violation of the privacy architecture. Aggregate only.

2. **Federated gradient uploads must be differentially private.** Gaussian noise added before upload. Clipping threshold set to prevent gradient inversion attacks.

3. **The personal model is not a recommendation model.** It's a behavioral prior. Never expose its weights or structure through any API endpoint.

4. **Incognito mode means zero server trace.** Not "anonymized trace." Zero. If incognito session data touches the server, it must be immediately discarded server-side with no logging.

5. **Screen Capture API audio is process-and-discard.** No buffer retention. No upload. Essentia.js processes it in-browser and emits only feature vectors.

6. **Spotify API scopes: request minimum.** User-read-recently-played, user-top-read, playlist-read-private, user-library-read. Nothing broader unless a feature explicitly requires it and the user understands why.

---

## What This Skill Is Not

- A reason to slow things down with exhaustive reviews on every commit
- A checklist to satisfy compliance theater
- An excuse to avoid making decisions (every decision has risk; the goal is to make that risk explicit and chosen, not hidden)
