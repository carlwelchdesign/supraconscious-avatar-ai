# The Inner Council
## Founder design, brand, copy, and product experience review

Prepared July 24, 2026
Scope: public landing, pricing, authentication, onboarding, dashboard, journal, saved reflections, patterns, guide progression, settings, responsive behavior, product voice, and design-system foundations.

Review lenses: staff product design, creative direction, brand strategy, UX writing, conversion copy, AI interaction design, accessibility, product strategy, and engineering feasibility.

---

## Executive recommendation

The product does not need more “spiritual decoration.” It needs a clearer point of view.

The underlying system is unusually thoughtful: private journaling, bounded council roles, safety-aware response handling, source governance, pattern correction, and explicit user controls. The current interface communicates only part of that depth. It looks polished in individual frames, but the product story, interaction model, and visual language do not yet feel like one authored experience.

The recommended direction is **The Quiet Observatory**: an editorial, contemplative system built around spacious composition, careful observation, tactile light, and visible evidence. It should feel more like entering a private practice than opening a wellness dashboard, while retaining the clarity and control expected of a serious AI product.

Three decisions should drive the redesign:

1. **Sell the practice, not the AI or a promise of hidden truth.**
2. **Make one reflection the center of the product, with everything else supporting that ritual.**
3. **Express spiritual depth through restraint, rhythm, language, and presence—not mystical clichés or unearned authority.**

### Recommended positioning

> A private reflection practice for hearing the different parts of yourself—and choosing what to carry forward.

### Recommended product promise

> Write what is present. Receive several grounded perspectives. Leave with one question and one next step.

### Recommended emotional outcome

The member should feel **met, unhurried, clear, and still in control**.

---

## What was reviewed

This review is grounded in the current repository and rendered local product, not only a mood-board exercise.

- Marketing: `/`, `/pricing`
- Entry: registration, login, onboarding and consent
- Core practice: dashboard, journal composer, council response, saved session
- Continuity: patterns, guide stages, reflection history
- Trust and account: privacy, reflection settings, billing, passkeys, sessions, data export, deletion
- Responsive behavior: desktop and mobile landing, pricing, dashboard
- Foundations: global tokens, typography, illustration assets, shared shell, repeated component treatments, English message catalog

The current implementation is strongest when it is specific and bounded: “signals, not diagnoses,” source grounding, feedback controls, safety limits, privacy controls, and the one-small-shift interaction. It is weakest when marketing language claims certainty, the interface falls back to generic SaaS cards, or operational founder-calibration concepts interrupt the reflective experience.

---

## Current-state scorecard

| Dimension | Current assessment | Why |
|---|---:|---|
| Mission clarity | 7/10 | The council, reflection, and conscious-choice idea is present, but “identity reflection,” “decision clarity engine,” “journal,” and “not a journal” compete. |
| Visual distinctiveness | 6/10 | Plum, cream, Cormorant, cosmic-eye art, and engraved guide portraits create atmosphere; the repeated rounded cards and familiar wellness palette reduce originality. |
| Product coherence | 5/10 | Marketing, pricing, calibration, daily practice, patterns, and progression feel like adjacent features rather than one ritual system. |
| Spiritual integrity | 6/10 | The product has clear founder/source context, but some copy implies access to truth or hidden knowledge that the system cannot responsibly claim. |
| Trust and user agency | 7/10 | Privacy, safety, provenance, feedback, memory controls, export, and deletion are meaningful strengths; confidence and progression language need more humility. |
| Conversion readiness | 4/10 | The landing page is long, repetitive, unsupported social proof remains visible, and pricing explains features rather than the member’s changing practice. |
| Mobile quality | 6/10 | Landing and pricing adapt reasonably; the dashboard guide card clips content horizontally and long pages become especially heavy. |
| Accessibility readiness | 5/10 | Semantic structure and focus states exist, but 10–12px labels, low-opacity text, subtle borders, color-coded states, and continuous decorative motion need review. |
| Design-system scalability | 4/10 | Global variables exist, but many arbitrary sizes, radii, opacity combinations, and inline styles make a full theme change expensive and inconsistent. |

---

## Highest-priority findings

### P0 — Fix before presenting the current experience as launch-ready

#### 1. Remove unsupported trust language

The landing page currently says the product is “Trusted by leaders, creators, and individuals…” and immediately follows it with “Testimonials and authority proof can be added here.” This reads as placeholder content and an unsupported claim.

**Recommendation:** remove the entire band until real permissioned evidence exists. Replace it with verifiable product trust:

- Private by default
- You can turn pattern memory off
- You can correct or hide a pattern
- Source material is reviewed before use
- This is reflection, not diagnosis or crisis care

#### 2. Repair mobile dashboard clipping

The primary guide card uses a horizontal layout without a mobile stack. In the rendered mobile view, the guide title and body are pushed beyond the right edge. This damages the most brand-defining app surface.

**Recommendation:** stack the guide portrait and copy below the medium breakpoint, constrain decorative glow, and test at 320, 375, 390, and 430px.

#### 3. Resolve the pattern-evidence contradiction

The Patterns page says patterns appear only after recurring across multiple entries, while the rendered cards can show `1×`, “Seen 1 time,” and high confidence such as 75–90%.

**Recommendation:** do not promote a signal to a pattern until the recurrence rule is satisfied. Before that, label it “emerging signal,” avoid percentage confidence, and explain the evidence count in plain language.

#### 4. Remove or separate founder-calibration language from the member experience

Phrases such as “voice test,” “no-source fallback test,” “golden example,” “Carl/Maria calibration,” and “does not automatically retrain” are appropriate for a founder pilot, not for the lasting product experience.

**Recommendation:** keep a founder-review mode, but visibly separate it from the member-facing product. The main product should ask simple questions such as “Did this feel accurate?” and “What would you change?”

---

### P1 — Required for a convincing redesign

#### 5. Replace certainty with invitation

Current marketing repeatedly tells the visitor what is true about them:

- “You are not seeing clearly.”
- “reveals what you already know, but have not faced”
- “what you have been avoiding”
- “The Truth Self cuts through illusion.”
- “When you see…you move naturally.”

This can feel confrontational, guru-like, or psychologically presumptuous. It also conflicts with the product’s careful “signals, not diagnoses” posture.

**Recommendation:** use language that offers a practice and leaves interpretation with the member:

- “Notice what is pulling in different directions.”
- “See your own words from more than one angle.”
- “Keep what resonates. Correct what does not.”
- “Leave with a question worth carrying.”

#### 6. Give the landing page a real demonstration

The current page explains the concept in many sections but never makes the experience tangible.

**Recommendation:** add an anonymized, clearly fictional “one reflection” sequence:

1. A short journal excerpt
2. Three or four concise council perspectives
3. One synthesis question
4. One chosen next step
5. A note showing what is stored and controlled

This can replace several abstract sections.

#### 7. Reframe progression

“Stages,” “levels,” “depth,” and “earned” progression can motivate, but they can also imply spiritual rank, reward performative disclosure, or pressure users to write more intensely.

**Recommendation:** describe progression as the guide adapting to the member’s preferences and history—not the member becoming more spiritually advanced. Allow users to inspect, pause, or reset adaptation.

#### 8. Redesign pricing around practice outcomes

The current Free / Starter / Pro structure is familiar SaaS packaging. “Priority AI usage” is not a meaningful spiritual-practice benefit, and the distinction between memory, progression, pattern review, and council reflection is difficult to evaluate before trying the product.

**Recommendation:** either:

- simplify to **Free + Membership**, or
- rename three tiers around cadence without implying personal rank: **Begin**, **Practice**, **Deepen**.

Pricing should state limits, privacy implications, cancellation behavior, and exactly which continuity features are added.

#### 9. Establish one naming architecture

The brand currently moves among “Supraconscious,” “The Inner Council™,” “Inner Avatar,” “guide,” “council,” and “journal.”

**Recommendation:**

- Company / method: **Supraconscious**
- Product: **The Inner Council**
- Core action: **Reflection**
- Input space: **Journal**
- Multi-perspective output: **Council**
- Ongoing adaptive presence: **Guide**
- Recurring observations: **Patterns**

Use “Inner Avatar” only if it has a defined product role; otherwise retire it from customer-facing language.

#### 10. Build a tokenized product system

The current code has brand variables, but also extensive page-level inline color, radius, shadow, opacity, and typography decisions. A new stylesheet will otherwise become another layer rather than a system.

**Recommendation:** define semantic tokens and reusable patterns before restyling screens:

- surface: canvas, raised, sunken, inverse, scrim
- text: primary, secondary, quiet, inverse, link, danger
- border: subtle, standard, strong, focus
- action: primary, secondary, quiet, destructive
- feedback: neutral, success, caution, danger
- type roles: display, title, section, body, small, label, data
- radius: 0, small, medium, large, pill
- elevation: none, lifted, modal
- motion: enter, respond, progress, reduced-motion

#### 11. Do not sell plan differences until entitlements exist

The pricing page assigns memory, voice, progression, expanded patterns, and “priority AI usage” to paid tiers, but the current product workflows do not show a corresponding server-side entitlement system.

**Recommendation:** keep paid checkout disabled or label the plans as proposed pilot packaging until every benefit maps to an enforced capability, documented limit, downgrade behavior, and supportable service level.

#### 12. Make advertised reflection controls real

Settings says members can shape guide tone and reflection intensity, but the current screen presents those values as static text while the save flow governs pattern memory.

**Recommendation:** either add clear controls and explain their behavioral effect, or remove the impression that those preferences can currently be changed.

#### 13. Design recovery before adding more atmosphere

The journal entry can be saved before the AI reflection finishes. The current client collapses failure into a generic retry, with no idempotency key, partial-success message, autosave status, or “resume analysis” path.

**Recommendation:** model durable reflection states—saved, analyzing, ready, safety paused, recoverable failure—and guarantee that retrying cannot create duplicate or orphaned entries.

---

## Brand platform

### Core human tension

People often do not need another answer. They need enough space and structure to hear the different needs, fears, habits, and possibilities already present in their own words.

### Product role

The Inner Council is not an oracle, therapist, authority figure, or autonomous agent. It is a **structured reflective instrument**.

### Brand essence

**Many voices. One conscious choice.**

### Brand principles

1. **Presence before performance**
   Do not gamify disclosure or reward intensity.

2. **Invitation before interpretation**
   Offer perspectives; do not announce a person’s truth.

3. **Specificity before mystique**
   Explain what the product does even when the tone is poetic.

4. **Agency before authority**
   The member decides what resonates, what is wrong, and what happens next.

5. **Continuity before content volume**
   A useful practice is more important than an endless feed of generated text.

6. **Spiritual seriousness without spiritual theater**
   Avoid generic stars, chakras, glowing brains, cosmic stock art, sacred-geometry wallpaper, and guru language unless a symbol has a defined role in the method.

### Voice attributes

| Attribute | Do | Avoid |
|---|---|---|
| Grounded | Name the concrete action or consequence. | Floating abstractions with no product meaning. |
| Spacious | Use short sentences and let questions breathe. | Long stacks of motivational claims. |
| Humble | “May,” “can,” “one perspective,” “keep what fits.” | “Reveals the truth,” “you already know,” “cuts through illusion.” |
| Intimate | Speak directly and calmly. | Manufactured urgency or conversion pressure. |
| Clear | Distinguish journal, council, guide, patterns, and sources. | Renaming ordinary controls with mystical terms. |
| Protective | State privacy and safety limits plainly. | Hiding important constraints in soft poetic copy. |

---

## Recommended experience architecture

### Public journey

**Landing → Try a guided example → Understand privacy and method → Choose free or membership → Create account → Consent → First reflection**

The “guided example” is the missing bridge. Visitors currently move from an abstract promise directly to registration or pricing.

### Member journey

**Arrive → Reflect → Read → Respond → Carry one step → Return**

Everything should support this loop:

- Dashboard becomes **Today**, not a stats overview.
- Journal becomes a focused writing room.
- Council response reveals perspectives progressively instead of presenting a long generated report.
- The final question and user-selected next step receive the strongest hierarchy.
- History, patterns, and guide adaptation become secondary continuity tools.

### Proposed primary navigation

| Current | Proposed | Reason |
|---|---|---|
| Dashboard | Today | Orients the member to the practice, not app administration. |
| Journal | Reflect | Makes the core action clear. |
| Patterns | Patterns | Strong existing concept when evidence rules are trustworthy. |
| Guide | Guide | Keep, but explain adaptation rather than advancement. |
| Settings | Account | Conventional destination for privacy, data, security, billing, and preferences. |

On mobile, keep a maximum of four persistent destinations: **Today, Reflect, Patterns, Account**. Guide adaptation can live within Today and Account unless research proves it deserves permanent navigation.

---

## Surface recommendations

### Landing

Reduce the page from a sequence of assertions to a narrative with proof.

1. Hero: concise promise and one primary action
2. “See one reflection”: real product demonstration
3. “Why several perspectives”: explain the council method
4. “You remain the authority”: correction, privacy, sources, safety
5. Member outcomes: notice, name, choose, carry
6. Pricing preview
7. Final invitation

Remove “Problem,” “The shift,” “Why it works,” “Different by design,” and placeholder social proof as separate bands. Their useful content can be absorbed into the demonstration and trust sections.

### Pricing

Add:

- a plain-language plan comparison
- usage or feature limits
- who each plan is for
- cancellation and data-retention summary
- privacy/memory implications
- an FAQ for AI processing, pattern memory, and billing
- a free-first recommendation if that is genuinely the best starting path

Avoid treating the dark featured card as the primary differentiator. The recommendation must be explained by member need, not visual dominance.

### Onboarding

Keep consent explicit, but divide it into three understandable steps:

1. **What this is:** a guided spiritual reflection inspired by reviewed teachings
2. **What happens to your writing:** AI processing, storage, pattern memory
3. **What it is not:** therapy, diagnosis, crisis care, or Maria herself

Pattern memory should be an independent, optional choice—not visually grouped as if it were required.

### Today / dashboard

Prioritize:

1. Continue or begin today’s reflection
2. Carry-forward step from the last session
3. Latest reflection, if useful
4. Emerging patterns
5. Guide adaptation

De-emphasize counts such as “entries written” unless research shows they support habit formation without pressuring disclosure.

### Reflection workspace

The core writing surface is good in intent but crowded by founder calibration, threshold content, voice, guide art, and post-generation controls.

Create three modes:

1. **Write** — quiet editor, optional prompt, privacy status
2. **Listen** — progressive council perspectives, source/provenance disclosure
3. **Carry** — one synthesis question, user response, one saved step

The member should always know whether text is unsaved, being processed, saved, remembered as a pattern, or included in feedback.

### Council response and saved sessions

Lead with the synthesis, then let members open individual voices. Four full responses plus a guide response, prompt, provenance, feedback, and embodiment controls can become a report rather than a reflection.

Recommended hierarchy:

1. A short mirror
2. “What the council noticed”
3. One question
4. One user-owned next step
5. Expandable perspectives
6. Sources and system details
7. Feedback

### Patterns

Use evidence language rather than model-confidence theater.

- “Emerging” = early signal, not yet a pattern
- “Recurring” = appears across the defined minimum number of entries
- “Established” = sustained across time and confirmed or left uncorrected

Allow:

- “This fits”
- “Not quite”
- “This feels too strong”
- “Hide this”
- evidence inspection
- correction in the member’s own words

Avoid percentages unless they are calibrated, understandable, and useful. “Appeared in 3 reflections over 6 weeks” is more meaningful than “82% confidence.”

### Guide

Keep the evolving guide art, which is one of the more ownable brand elements. Reframe the five stages as **ways the guide can support the member**, not a ladder the member climbs.

Potential model:

- Echo — reflects language
- Witness — notices recurring themes
- Clear Mirror — holds tensions side by side
- Reframer — offers alternate frames
- Inner Author — helps the member articulate a chosen direction

Members should be able to see why the guide changed, opt out of adaptation, and choose a preferred support style.

### Account, privacy, and settings

Split the very long page into:

- Reflection preferences
- Privacy and memory
- Voice
- Plan and billing
- Security
- Data and account

Replace static “tone” and “intensity” values with real, clearly described controls or remove the impression that they are editable.

---

## Copy direction

### Recommended hero

**Eyebrow**
A private practice for clearer choices

**Headline**
Hear the different parts of yourself.

**Emphasis**
Choose what you carry forward.

**Body**
Write what is present. The Inner Council reflects your words from several grounded perspectives, then leaves you with one question and one next step. You decide what fits.

**Primary CTA**
Begin a reflection

**Secondary CTA**
See an example

**Trust line**
Private by default · Patterns are optional · Reflection, not diagnosis

### Recommended “how it works”

**Write honestly**
Start with what is present. No perfect prompt and no performance.

**See more than one perspective**
The council reflects tensions, protective patterns, possibilities, and your own language.

**Choose consciously**
Keep what resonates, correct what does not, and carry one small step into the day.

### Replace the four council role descriptions

| Current posture | Recommended posture |
|---|---|
| The Protector “shows where fear is holding you back” | **Protector** notices what may be trying to keep you safe. |
| Conditioned Self “reveals patterns you did not question” | **Pattern Keeper** reflects familiar stories or responses that may be repeating. |
| Visionary “shows who you are becoming” | **Possibility** makes room for desires, values, and directions that are not yet fully formed. |
| Truth Self “cuts through illusion” | **Witness** holds your words together and names the tension without deciding for you. |

The role names should be validated against Maria’s method before changing. The key change is from authority to perspective.

### Recommended pricing language

#### Option A — Preferred simplification

**Free**
Begin the practice
For trying the core reflection loop privately.

**Membership — $19/month**
Build continuity
For ongoing council reflections, optional pattern memory, voice, guide adaptation, and deeper review over time.

This is easier to understand and avoids an under-differentiated middle plan.

#### Option B — If three plans are commercially required

**Begin — Free**
Write and receive a grounded reflection.

**Practice — $9/month**
Return regularly with council perspectives, prompts, voice, and optional memory.

**Deepen — $19/month**
Review longer-term patterns and guide adaptation with more continuity.

Do not use “priority AI usage” as the lead Pro benefit. State any usage caps plainly in the comparison table.

---

# Ten visual style sheets

These are ten different design territories, not ten palettes applied to the same rounded-card UI. Each changes typography, composition, imagery, interaction rhythm, and the way spiritual meaning is expressed.

## 1. The Quiet Observatory — recommended

**Emotional promise:** step back far enough to notice the pattern, without being told what it means.

**Palette**

- Ink `#211A23`
- Parchment `#F3EDE2`
- Chalk `#FBF8F2`
- Burnished bronze `#9A6D46`
- Dusk violet `#6C6174`
- Moss `#687569`

**Typography:** Newsreader or Lyon-style editorial serif for display; Instrument Sans for interface and body.

**Art direction:** natural side light, observational diagrams, traces, handwritten constellations formed from the member’s own words, subtle topographic marks, and occasional thresholds. No literal third eye. Guide portraits become restrained medallions used at meaningful moments.

**Layout:** asymmetrical editorial grids, large quiet margins, thin rules, few containers, full-width reflection moments, strong line length control, and a narrow evidence rail showing what came from the member, an approved source, or generated interpretation.

**Components:** mostly square or lightly rounded surfaces; pill shapes reserved for tags and compact choices; primary actions are calm rectangular forms with 8px radius.

**Motion:** a slow veil reveal, focus transitions, and progressive disclosure. No perpetual motion by default.

**Best for:** spiritual credibility, premium positioning, trust, long-form reflection.

**Risk:** can feel austere if photography and copy lack warmth.

## 2. The Living Margins

**Emotional promise:** your life as a text you are learning to read and author.

**Palette**

- Carbon `#27211E`
- Cotton `#F7F1E7`
- Oat `#E8DDCC`
- Madder `#9B5142`
- Olive ink `#6F7355`
- Gold leaf `#B99255`

**Typography:** Source Serif 4 for reflection; Source Sans 3 for controls; optional handwritten marginal accent used very sparingly.

**Art direction:** deckled paper, editorial annotations, fine line drawings, chapter markers, field notes, underlines, and marginalia generated from member-owned actions—not decorative pseudo-handwriting.

**Layout:** chapter-based pages, margin notes for provenance and privacy, council voices as annotated perspectives around a central text.

**Components:** paper sheets, ruled writing areas, bookmarks for saved steps, restrained stamp-like status labels.

**Motion:** ink or underline reveal; pages settle rather than slide.

**Best for:** journaling continuity, authorship, saved-session history.

**Risk:** can become nostalgic or craft-store-like if texture is overused.

## 3. Ritual Modernism

**Emotional promise:** a disciplined daily practice without religious or mystical theater.

**Palette**

- Near black `#171717`
- Bone `#F2EFE7`
- Mineral `#D8D3C8`
- Cinnabar `#A44732`
- Sage `#697665`
- Signal blue `#526C83`

**Typography:** Libre Franklin for the system; Source Serif 4 for reflective passages.

**Art direction:** calibrated lines, circles as time/practice markers, numbered sequences, quiet documentary photography of hands, paper, breath, water, and ordinary thresholds.

**Layout:** Swiss grid, clear modules, visible sequence, no floating decorative cards. The five-part council experience becomes a deliberate score or ritual notation.

**Components:** 1px rules, flat surfaces, strong selected states, compact status systems, conventional form controls.

**Motion:** precise 160–240ms transitions; one slower reflection reveal after processing.

**Best for:** usability, credibility, accessibility, scalable product system.

**Risk:** may undersell warmth unless paired with humane art and language.

## 4. Inner Cosmos, Matured

**Emotional promise:** inward vastness without the familiar “mystical AI” look.

**Palette**

- Night plum `#17121D`
- Lunar `#EFE8DC`
- Nebula mauve `#8C738C`
- Copper `#B88259`
- Deep blue `#34475C`
- Soft star `#D6C9B7`

**Typography:** Fraunces for display; Manrope for interface.

**Art direction:** abstract astronomical fields based on real light, dust, orbit, and depth; no stock galaxies, glowing brains, or sacred-geometry overlays. The eye is replaced by changing spatial fields.

**Layout:** immersive dark opening and reflection reading; light functional spaces for writing, pricing, privacy, and account management.

**Components:** layered translucent planes used only for council voices and provenance; limited glow tied to active system state.

**Motion:** subtle parallax and orbital sequencing with strong reduced-motion behavior.

**Best for:** preserving current equity while making it more sophisticated.

**Risk:** remains close to a crowded meditation/AI visual category.

## 5. Threshold Architecture

**Emotional promise:** permanence, silence, and a place set apart.

**Palette**

- Charcoal stone `#252422`
- Limestone `#E9E4D9`
- White light `#FBFAF6`
- Oxide `#9C593F`
- Lichen `#7B806D`
- Shadow `#5C5752`

**Typography:** Bodoni Moda or Editorial New-style display; IBM Plex Sans for interface.

**Art direction:** architecture, carved voids, shadow across textured walls, alcoves, water basins, and material detail.

**Layout:** monumental blocks, deep vertical rhythm, hard-edged sections, small precise labels, generous negative space.

**Components:** minimal radius, inset panels, strong focus outlines, architectural dividers.

**Motion:** light moves slowly across a surface; interface motion remains minimal.

**Best for:** founder presentation, premium differentiation, serious spiritual context.

**Risk:** can feel expensive, distant, or overly masculine.

## 6. Somatic Field

**Emotional promise:** reflection that returns the member to body, feeling, and lived experience.

**Palette**

- Soil `#43372F`
- Flax `#F0E6D5`
- Skin rose `#C58F7B`
- Leaf `#71836D`
- Sky wash `#9FB7BF`
- Aubergine `#594251`

**Typography:** Lora for display and prompts; Atkinson Hyperlegible for interface.

**Art direction:** macro natural textures, gesture, breath, hands, fabric, water, seed forms, and imperfect organic line work.

**Layout:** soft irregular fields and grounded horizontal bands; the final “carry” step has physical prominence.

**Components:** organic corner systems, tactile toggles, spacious sliders, embodied check-ins, accessible large targets.

**Motion:** expansion/contraction and breath-like pacing only during intentional transitions.

**Best for:** embodiment, warmth, daily use, moving away from head-heavy AI framing.

**Risk:** may drift toward generic wellness branding.

## 7. The Polyphonic Studio

**Emotional promise:** every part gets a voice; none gets the throne.

**Palette**

- Chalk `#F7F3EA`
- Black `#171717`
- Protector rust `#A75D45`
- Pattern slate `#687181`
- Possibility cobalt `#3E67A7`
- Witness citron `#B2A93B`

**Typography:** an expressive grotesk for perspectives, a literary serif for synthesis, and mono annotations for provenance.

**Art direction:** editorial collage, transcript fragments, role notations, and overlapping typographic voices. Color identifies a lens, never a personality diagnosis.

**Layout:** four perspectives enter separately around a central piece of member language, then align into one synthesis.

**Components:** voice panels with distinct but equal hierarchy, member-language anchors, synthesis rails, and correction controls.

**Motion:** perspectives enter individually and settle into one composition; reduced motion uses instant grouping.

**Best for:** making the council method memorable, dynamic, and visibly non-authoritarian.

**Risk:** can become visually noisy or turn roles into fixed identities.

## 8. Archetypal Gallery

**Emotional promise:** meeting distinct inner perspectives as enduring characters, not chatbots.

**Palette**

- Gallery black `#201D1C`
- Gesso `#F4F0E8`
- Umber `#8B6248`
- Verdigris `#607B73`
- Oxblood `#713E43`
- Frame gold `#A9854F`

**Typography:** EB Garamond for display and voices; Work Sans for interface.

**Art direction:** commissioned monochrome portraits, engraving, relief, or collage for each council perspective. Each voice has a subtle visual signature without becoming a collectible character.

**Layout:** gallery labels, paired portraits and passages, one perspective per frame, expandable council sequence.

**Components:** framed voice panels, caption systems, curator-note provenance, restrained tabs.

**Motion:** gallery crossfades and focus shifts.

**Best for:** making the council memorable and ownable.

**Risk:** archetypes can become theatrical, culturally narrow, or imply personalities more authoritative than the system warrants.

## 9. The Sacred Ordinary

**Emotional promise:** depth is already present in ordinary life.

**Palette**

- Oat `#EAE2D4`
- Charcoal `#252522`
- Moss `#64705A`
- Terracotta `#A86348`
- Window blue `#93AAB2`
- Quiet plum `#776272`

**Typography:** a warm editorial serif for reflection and a sturdy humanist sans for interface.

**Art direction:** inclusive documentary photography of hands, windows, walking, tables, water, work, and lived-in rooms. No staged meditation poses.

**Layout:** generous photographic compositions paired with precise product proof and a quiet daily return state.

**Components:** warm surfaces, larger body type, familiar controls, and member-owned moments used as the visual focus.

**Motion:** nearly invisible light and focus changes; no ambient spectacle.

**Best for:** embodiment, inclusivity, emotional humanity, and escaping both AI and spiritual clichés.

**Risk:** requires excellent original photography; generic stock would immediately weaken it.

## 10. Sacred Interface

**Emotional promise:** a modern instrument designed for deep attention.

**Palette**

- Black violet `#141118`
- Porcelain `#F5F2EC`
- Electric iris `#8C7CE6`
- Warm signal `#D18B61`
- Cool signal `#6BA7A1`
- Graphite `#5E5962`

**Typography:** Instrument Serif for reflective headlines; Geist for the interface and data.

**Art direction:** nearly no photography; typographic composition, responsive light, subtle line fields, and a single evolving guide glyph.

**Layout:** dark focus mode for reading, light workspace for writing, command-like clarity for controls, minimal chrome.

**Components:** sharp accessible state changes, focus rings as a core brand device, restrained translucent overlays, no ornamental cards.

**Motion:** state-responsive light and type; never ambient spectacle.

**Best for:** a contemporary AI product that still feels contemplative.

**Risk:** can become cold, “AI premium,” or trend-dependent.

---

## Style-direction decision matrix

Scores are directional, from 1 (weak) to 5 (strong).

| Direction | Mission fit | Distinctive | Product scalability | Accessibility potential | Build effort | Overall |
|---|---:|---:|---:|---:|---:|---:|
| The Quiet Observatory | 5 | 5 | 5 | 5 | 3 | **4.8** |
| The Living Margins | 5 | 5 | 4 | 4 | 4 | **4.5** |
| Ritual Modernism | 4 | 5 | 5 | 5 | 3 | **4.7** |
| Inner Cosmos, Matured | 4 | 3 | 4 | 3 | 3 | 3.6 |
| Threshold Architecture | 5 | 5 | 4 | 4 | 4 | 4.4 |
| Somatic Field | 4 | 3 | 4 | 5 | 4 | 4.0 |
| The Polyphonic Studio | 4 | 5 | 4 | 4 | 4 | 4.2 |
| Archetypal Gallery | 4 | 5 | 3 | 4 | 5 | 4.0 |
| The Sacred Ordinary | 5 | 4 | 4 | 5 | 4 | 4.5 |
| Sacred Interface | 3 | 4 | 5 | 4 | 4 | 4.0 |

### Shortlist

1. **The Quiet Observatory** — best overall expression of intimacy, trust, spiritual seriousness, and evidence-aware reflection.
2. **Ritual Modernism** — best interaction and design-system foundation; strongest if the founder prefers clarity and discipline over atmosphere.
3. **The Living Margins** — strongest metaphor for journaling, continuity, interpretation, correction, and authorship.

### Suggested combination if one hybrid is allowed

Use **The Quiet Observatory** as the brand world, **Ritual Modernism** as the interaction grammar, **The Living Margins** for annotation and correction behavior, and selective human photography from **The Sacred Ordinary**.

That is a coherent system:

- threshold = entry and emotional posture
- modernist ritual = product structure and accessibility
- manuscript = the member’s personal record

---

## Design-system implications

Before redesigning all pages, build and validate these shared patterns:

1. Public header and mobile menu
2. Page title / introduction
3. Reflection editor
4. Council perspective
5. Synthesis question
6. Carry-forward step
7. Evidence / provenance disclosure
8. Pattern signal and correction controls
9. Trust notice
10. Plan comparison
11. Settings row and section navigation
12. Empty, loading, error, partial, permission, success, and recovery states

### Accessibility requirements

- Body text minimum 16px on marketing and reflection surfaces; avoid 10px as meaningful content.
- Meet WCAG AA contrast for text, controls, focus, and status communication.
- Never rely on clay/sage/rose color alone for state.
- Full keyboard support with visible focus.
- Reduce or stop breathing, pulsing, drifting, and parallax under `prefers-reduced-motion`.
- Do not animate while a member is composing a reflection unless they explicitly enable it.
- Council voices, pattern evidence, and progress visuals need semantic headings and text equivalents.
- Mobile actions must remain reachable above safe areas and must not obscure content.
- Test localization for text expansion and non-Latin typography before finalizing compact labels.
- Configure a global `next-intl` time zone; the current local runtime warns that the missing value can cause server/client markup mismatches.

---

## Validation plan

### Five concept-test tasks

1. “What do you believe this product will do with your writing?”
2. “What is the difference between the council, the guide, and a pattern?”
3. “Would you trust this reflection? What would make you correct or reject it?”
4. “Which plan would you choose, and why?”
5. “Does this feel spiritually meaningful, manipulative, clinical, generic, or something else?”

### Prototype tests

- 5–7 target users for landing comprehension
- 5 members for first-reflection completion
- 5 members for pattern correction and memory controls
- Founder and source-author review for voice and spiritual integrity
- Accessibility review with keyboard, VoiceOver, 200% zoom, reduced motion, and contrast checks

### Success signals

- Visitors can explain the product accurately after 15 seconds.
- More visitors open the guided example before registration.
- First-reflection completion improves.
- Members can identify and use correction controls.
- Fewer people describe the experience as “a chatbot” or “generic wellness.”
- Pricing-plan choice can be explained without reading every feature.
- Members report feeling invited rather than analyzed.
- Reflection return rate improves without relying on streak pressure.

### Suggested analytics

- `landing_example_opened`
- `landing_method_viewed`
- `trust_controls_viewed`
- `pricing_plan_compared`
- `registration_started`
- `onboarding_consent_completed`
- `reflection_started`
- `reflection_submitted`
- `council_perspective_opened`
- `synthesis_question_viewed`
- `carry_step_saved`
- `reflection_feedback_submitted`
- `pattern_evidence_viewed`
- `pattern_corrected`
- `pattern_hidden`
- `memory_setting_changed`
- `return_reflection_started`

Do not send raw journal text, generated reflection text, or sensitive pattern labels into behavioral analytics.

---

## Proposed rollout

### Phase 0 — Trust and responsive repair

- Remove placeholder/unsupported trust claims.
- Fix mobile guide-card clipping.
- Correct pattern recurrence and confidence presentation.
- Separate founder-calibration language from the member experience.
- Audit low-contrast and 10–12px text.

### Phase 1 — Concept decision

- Create three high-fidelity concept frames for The Quiet Observatory, The Living Margins, and The Sacred Ordinary.
- Apply each to the same four surfaces: landing hero, one-reflection demo, journal workspace, council result.
- Test comprehension, emotional fit, and founder preference before building the full system.

### Phase 2 — Core ritual

- Redesign Today, Reflect, council response, and Carry.
- Establish tokens and shared components.
- Add clear save/processing/memory/provenance states.
- Validate responsive and accessible behavior.

### Phase 3 — Public story and pricing

- Replace the long assertion-led landing page with the demonstration-led narrative.
- Repackage pricing.
- Add trust explanation and FAQ.
- Align authentication and onboarding.

### Phase 4 — Continuity

- Redesign patterns around evidence and correction.
- Reframe guide adaptation.
- Split Account into navigable sections.
- Align saved sessions and history with the manuscript/continuity model.

---

## Founder decisions

The founder review should end with five decisions:

1. Is the primary promise **clarity**, **self-authorship**, **inner dialogue**, or **spiritual practice**?
2. Should the product lead with **The Inner Council** and keep Supraconscious as the company/method?
3. Is guide progression a visible member benefit, a quiet adaptive behavior, or both?
4. Does the commercial model need three plans, or can it become Free + Membership?
5. Which direction should proceed to prototype: The Quiet Observatory, The Living Margins, The Sacred Ordinary, or another of the ten?

The next design artifact should be a four-screen concept test, not a whole-app reskin. Once the founder chooses the product posture and style territory, the rest of the system can be designed coherently.
