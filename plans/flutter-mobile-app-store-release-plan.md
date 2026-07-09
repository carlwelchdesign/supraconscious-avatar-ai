# Flutter Mobile App Store Release Plan

## Summary
Add a Flutter mobile client for Apple App Store and Google Play while keeping the current Next.js web/admin platform, Postgres database, RAG governance, and AI orchestration as the system of record. The first release targets iPhone, Android phones, iPad, and Android tablets. Apple Watch, Wear OS, and other wearables are deferred until the phone/tablet experience proves useful.

Core decision:
- Build Flutter as a new user-facing client, not a rewrite of the existing app.
- Keep admin/CMS, source review, prompt tuning, RAG governance, founder calibration, and operations dashboards in the existing web/admin apps.
- Reuse existing backend APIs where possible; add mobile-safe API surfaces only where the current web route shape is too coupled to server-rendered flows.

## Key Phases
- **Phase 1: Mobile Foundation**
  - Add a new Flutter app workspace, likely `apps/mobile`, without disturbing the existing Yarn/Turborepo setup.
  - Configure iOS, Android, and tablet-responsive layouts from the start.
  - Establish app branding, favicon/app icon parity with the cosmic eye artwork, launch screen, environment config, and build flavors for local/dev/production.
  - Choose a Flutter state approach appropriate for the app, likely Riverpod or Bloc, with server/database state remaining authoritative.

- **Phase 2: API And Auth Readiness**
  - Audit current web auth/session, onboarding, journal, council, feedback, saved session, settings, and pattern endpoints for mobile compatibility.
  - Add a mobile API contract for login/session refresh, current user, onboarding state, journal submission, council result, feedback, Embodiment Gate save, saved sessions, pattern memory controls, and account privacy controls.
  - Keep sensitive journal text out of analytics events; preserve existing safety, privacy, source provenance, and pattern-memory consent rules.
  - Decide whether first mobile auth uses email/password only or also adds Apple/Google sign-in; recommended first pass is email/password plus later social sign-in before public App Store launch.

- **Phase 3: Flutter MVP**
  - Build the core user flow: register/login, onboarding/consent, dashboard, journal entry, Inner Council response, feedback note/type, Embodiment Gate save, saved session detail, patterns, and settings.
  - Use native keyboard dictation for the MVP rather than custom audio capture.
  - Match the premium landing/app visual language while designing for mobile ergonomics: focused writing, readable council output, clear source/no-source provenance, and simple feedback controls.
  - Include offline-safe draft handling locally, but persist completed sessions only through the backend.

- **Phase 4: App Store Readiness**
  - Prepare Apple and Google store assets, screenshots, privacy labels, data safety forms, age rating, app review notes, and support/privacy URLs.
  - Add mobile release CI for Flutter analyze/test/build, plus TestFlight and Google Play internal testing tracks.
  - Verify app behavior against AI-generated content, user-generated content, privacy, wellness, and safety expectations.
  - Run founder/Maria mobile calibration before inviting broader testers.

- **Phase 5: Post-MVP Enhancements**
  - Add in-app speech-to-text only after native keyboard dictation proves insufficient.
  - Improve tablet-specific layouts for longer reflections, side-by-side council review, and saved-session reading.
  - Evaluate push notifications for daily reflection reminders only after consent and retention behavior are clear.
  - Revisit Apple Watch and Wear OS as companion apps later, limited to micro-journaling, daily prompts, voice capture, or saved micro-shifts.

## Public Interfaces And Types
- Add a mobile API layer only where existing web actions are not suitable for Flutter consumption.
- Mobile-facing APIs should return explicit JSON contracts for auth state, onboarding state, council sessions, source provenance, feedback status, Embodiment Gate responses, and privacy settings.
- Add mobile client environment variables for API base URL, app environment, support URL, privacy URL, and optional telemetry endpoint.
- Do not expose admin-only RAG traces, raw source chunks, prompt templates, calibration review data, or internal quality review data to the mobile app.

## Test Plan
- Backend/API:
  - Mobile auth/session flow works without relying on server-rendered page state.
  - Journal submission, council generation, feedback, Embodiment Gate save, saved sessions, and settings controls match web behavior.
  - Safety bypass, RAG provenance, source/no-source copy, and pattern-memory consent remain consistent with web.

- Flutter:
  - Unit/widget tests for auth state, onboarding gate, journal draft state, council result rendering, feedback submission, saved session detail, and settings toggles.
  - Golden/screenshot tests for phone and tablet breakpoints.
  - Accessibility checks for dynamic type, keyboard navigation where relevant, screen reader labels, contrast, and touch target sizing.

- Release:
  - iOS local archive and TestFlight upload.
  - Android App Bundle build and Google Play internal testing upload.
  - Store metadata review for privacy, AI-generated content, wellness/safety positioning, and support links.
  - Founder smoke: install from TestFlight/internal testing, complete onboarding, submit one reflection, save the Gate, submit feedback, and confirm admin sees the session.

## Assumptions
- Flutter is the preferred mobile framework for iOS, Android, and tablet release.
- The current web/admin apps remain production surfaces; Flutter does not replace admin, CMS, RAG governance, prompt tuning, or calibration workflows.
- Wearables are explicitly deferred and should not be included in the first mobile milestone.
- Native keyboard dictation is enough for the first mobile MVP; custom speech-to-text is a later enhancement.
- The first mobile release should be validated through TestFlight and Google Play internal testing before any public launch.
