# DES-010 redesign release-readiness evidence

Status: in progress, founder-review web deployment live
Review date: 2026-08-25 PT

The previous screenshot set was invalidated and removed after it was found to show the retired eye composition. The active web, Flutter, metadata, Open Graph, and Twitter presentation now use the v3 diagonal mineral-boundary Observatory direction; source and catalog searches find no active eye-artwork reference.

## Scope validated

- Public journey: landing, illustrative reflection boundary, pricing, login, registration, recovery, and onboarding.
- Member journey: journal composer, living field, completed reflection, correction, provenance, carry-forward, dashboard, history, patterns, Guide, and settings.
- Flutter: mobile-native shell, journal, saved sessions, patterns, Guide, settings, Observatory semantic palette, localized copy, and 48 px minimum primary actions.
- Admin: restrained Observatory palette, dense operational navigation, safety/audit boundaries, keyboard focus, and responsive login.

## Five-task usability evidence

1. Begin a reflection: public CTA and authenticated journal entry points remain visible and keyboard reachable.
2. Enable gentler handling: journal composer preserves the explicit gentler-handling control and submits it through the existing owner-scoped API.
3. Distinguish authored and generated content: completed reflections and the public illustration label member words, generated tentative Guide text, provenance, and member-authored carry-forward separately.
4. Correct an observation: keep, reject, correct, and restore actions remain owner scoped; corrections are visibly identified as member input.
5. Save or delete: draft autosave, session feedback, carry-forward editing, individual entry deletion, and destructive confirmations retain success, failure, and recovery states.

The automated suite covers these boundaries through journal composer, completed reflection, correction ownership, provenance, deletion confirmation, private response, session, pattern-memory, and mobile API tests.

## Responsive matrix

- Corrected composer captures: `journal-observatory-{320,375,390,430,768,1024,1440}.png`.
- Corrected completed-reflection captures: `reflection-observatory-{320,375,390,430,768,1024,1440}.png`.
- At all seven widths, Chromium reported `documentElement.scrollWidth === innerWidth` for both routes.
- Public evidence: `landing-observatory-current.png`.
- Authenticated admin evidence: overview and feature-flags pages at 390 and 1440 px. The initial users-page captures were immediately deleted because they contained account identifiers; release evidence is privacy-safe.
- Flutter 390 px composition regressions are stored under `apps/mobile/test/goldens/`, including a dedicated journal golden that requires the editor to appear in the initial viewport while preferences remain below it. Real iPhone 17 Simulator captures cover landing, authenticated journal, completed reflection, and accessibility-extra-extra-large text.
- After an iPhone report exposed a mobile auth centering regression, the ambient glow was removed from the flex layout on registration, login, recovery, reset, and verification routes. Local measurements confirm symmetric gutters and no horizontal overflow at 320, 390, and 430 px; the live production 390 px panel spans 16–374 px in a 390 px viewport.

## Accessibility and motion

- Keyboard sequence was verified on 390 px landing and login views. All sampled focus targets were visible; order followed brand/language/actions on landing and brand/social/email/password/submit/recovery on login.
- Chromium accessibility-tree inspection exposed named links, buttons, textboxes, and a coherent heading hierarchy for the public demonstration and auth form.
- The 320 px matrix validates narrow reflow. Safari's page menu was also set to a genuine 200% zoom; enlarged content remains reachable, and the page permits horizontal access where Safari magnification exceeds the viewport.
- Web and admin provide a 2 px visible focus ring. Flutter primary actions use a 48 px minimum target and mobile navigation shows the selected label.
- Living-field tests verify `prefers-reduced-motion`, hidden-tab lifecycle handling, bounded particle count, capped device-pixel ratio, deterministic generation, decorative semantics, and no private-content reads.
- The reflection-submission transition now uses the same non-central living-field language; the retired sphere, rings, and orbiting points were removed and prohibited by regression tests.
- Simulator accessibility-tree inspection exposed coherent labels and control roles for the authenticated journal and completed reflection. Physical-device VoiceOver gesture and spoken-output testing remains open.
- The required device procedure and evidence fields are recorded in `DES-010-physical-device-voiceover-checklist.md`; this is the only valid path to closing the screen-reader portion of the gate.

## Automated verification

- Web typecheck and lint: pass.
- Web tests: 107 pass.
- Auth tests: 24 pass.
- Admin typecheck, lint, and tests: pass; 22 admin tests pass.
- Flutter localization generation, analyze, and tests: pass; 25 Flutter tests pass, including three 390 px composition goldens.
- Production web and admin builds: pass.
- Real iPhone 17 Simulator build/install/run: pass.
- Physical-device target preflight: `flutter build ios --debug --no-codesign` passes and produces an arm64 `Runner.app` for `co.supraconscious.innerCouncilMobile`. Installation remains intentionally pending signing and a connected iPhone.
- GitHub CI application, Flutter, and Docker-image gates pass for both the redesign deployment and the mobile auth centering correction.

## Known risks and decisions

- The warmer voice pass now covers English, German, French, Greek, Spanish, and Simplified Chinese public/supporting surfaces without changing Maria's locked framework language; automated locked-key comparisons and doctrine guards pass. Greek and Simplified Chinese nuance still merit native-speaker review. Older web catalogs also retain substantial English fallback copy outside this redesign pass, especially in founder calibration, account/security/billing, pattern-action, and voice surfaces; that broader translation-completion work is tracked separately from the redesign voice correction.
- The uncalibrated pattern-confidence percentage and bar were removed from web and Flutter presentation. Evidence count and source excerpts remain visible; the underlying score remains an internal ordering signal and is not presented as diagnostic certainty.
- Member-flow captures use a clearly synthetic local design-review account and synthetic reflection fixture. No real member journal, generated reflection, correction, or pattern content is included in release evidence or analytics.
- Real simulator capture, accessibility-extra-extra-large text, genuine 200% Safari zoom, the cross-locale warmth pass, and an unsigned arm64 physical-device build are complete. A fresh `devicectl` check on 2026-08-25 still reports no connected iPhone, so physical-device VoiceOver remains open. This document therefore remains `in progress`, not approval-ready.
- Admin receives the semantic palette and interaction standards, but no mineral artwork or ambient motion in sensitive operational workflows.

## Rollback and approval boundary

- The founder-review web deployment is `dpl_22wGNjqUPdRs9y8gy2o27dp3Homn` at merge commit `8844ac0d70f95db788720f84b9abd9c1baf6bde8`. Roll back the mobile correction by reverting PR #55, or the full redesign by reverting PR #54 after first accounting for the dependent hotfix.
- Carl explicitly authorized the current founder-review web deployment. DES-010 completion, broader production promotion, mobile store submission, and production activation remain separate decisions and require the outstanding VoiceOver evidence or an explicitly accepted exception.
