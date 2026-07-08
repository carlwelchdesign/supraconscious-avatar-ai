# Landing Page Marketing Refresh Plan

## Summary
Rebuild the public landing page as a premium, conversion-focused page for **The Inner Council™**, using Maria’s supplied copy as the narrative spine while tightening line breaks and section density for web readability. Keep the existing Supraconscious visual language, but shift the first viewport from a split text/media layout to an immersive full-bleed brand experience using the existing cosmic/avatar artwork.

Defaults chosen:
- Use Maria’s copy with light web tightening, not a word-for-word wall of text.
- Primary CTA: **Start Your First Reflection**.
- Visual direction: existing cosmic/avatar art as immersive hero background, refined product sections below.
- No new design skill installation needed; the available staff product design skill is sufficient.

## Key Changes
- Replace the current short landing page in `apps/web/src/app/page.tsx` with a long-form marketing page:
  - Hero: “The Inner Council™” as the product signal, with “This is not a journal. This is where you meet yourself.” as the core hook.
  - Problem: hesitation, delay, outgrown patterns, internal conflict.
  - Shift: many inner voices becoming structured clarity.
  - How it works: Protector, Conditioned Self, Visionary, Truth Self, then one precise Integrator question.
  - Experience: `Write → See → Face → Choose → Become`.
  - Why it works: clarity as behavior change.
  - Daily use: repeated reflection, one small shift, less self-betrayal.
  - Differentiation: not journaling/chatbot/coaching; identity reflection system, decision clarity engine, mirror for becoming.
  - Social proof placeholder: quiet placeholder block ready for testimonials.
  - Final CTA: “Begin Your First Reflection”.

- Update the landing visual system:
  - Copy `sources/AVATAR IMAGES/echo_eye_cosmos.png` into `apps/web/public/landing/echo-eye-cosmos.png`.
  - Use it as the hero’s full-bleed visual background with readable overlay treatment.
  - Keep the existing orb/council motif as supporting visual language in later sections, not as a split hero card.
  - Avoid nested cards and oversized decorative blobs; use full-width bands, typographic rhythm, and compact repeated cards only for council roles.

- Preserve current app behavior:
  - If authenticated, CTAs link to `/journal`.
  - If unauthenticated, CTAs link to `/register`.
  - Keep existing top nav but update anchors to page sections: `Problem`, `Council`, `Experience`.
  - Keep the public page as a server component using `getCurrentUser()`.

- Add focused structure for maintainability:
  - Keep the implementation in `apps/web/src/app/page.tsx` unless it becomes unwieldy.
  - If the JSX becomes too dense, extract static section data and small presentational helpers into `apps/web/src/components/landing/`.
  - Do not add Zustand or backend changes.

## Public Interfaces And Types
- No API, database, auth, or route contract changes.
- Public route affected: `/`.
- Public asset added: `/landing/echo-eye-cosmos.png`.
- No changes to journal, onboarding, admin, MCP, RAG, or founder calibration flows.

## Test Plan
- Run:
  - `node .yarn/releases/yarn-4.cjs test:web`
  - `node .yarn/releases/yarn-4.cjs typecheck`
  - `node .yarn/releases/yarn-4.cjs lint`
  - `node .yarn/releases/yarn-4.cjs build:web`
- Visual QA with the app running:
  - Desktop landing page at `http://localhost:3000/`.
  - Mobile-width landing page.
  - Confirm hero text is readable over the image.
  - Confirm no overlapping text, broken wrapping, or cramped CTA buttons.
  - Confirm first viewport clearly signals The Inner Council™ and hints at the next section.
  - Confirm unauthenticated CTA goes to `/register`.
  - Confirm authenticated CTA goes to `/journal`.
- Accessibility checks:
  - One clear H1.
  - Keyboard-focusable nav and CTAs.
  - Sufficient text contrast over hero image.
  - Reduced-motion-safe animations; avoid adding new essential motion.

## Assumptions
- The landing page should sell **The Inner Council™** more directly than the current spiritual-journal framing.
- Maria’s copy is directionally approved, but layout tightening is allowed for conversion and readability.
- The social proof section remains a placeholder until real testimonials or authority proof are supplied.
- No vector/RAG/admin functionality changes are part of this landing page phase.
- The page should feel like a premium AI reflection product, not a generic SaaS dashboard or a decorative spiritual blog.
