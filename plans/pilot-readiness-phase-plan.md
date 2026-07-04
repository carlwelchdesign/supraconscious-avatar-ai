# Pilot Readiness Phase Plan

## Summary
Build pilot readiness, not vector RAG. The next release should make a small Maria-grounded Inner Council pilot safe, measurable, and usable end to end: explicit pilot cohort enrollment, first-session orientation, P0 consent/data controls, privacy-safe analytics, council quality gates, and an admin pilot operations dashboard.

## Key Changes
- Add `PilotCohort`, `PilotEnrollment`, privacy-safe `PilotEvent`, `ConsentEvent`, `QualityReview`, `CouncilSessionFeedback`, and safety review fields on `SafetyEvent`.
- Add first-session orientation and consent for pilot participation, AI processing, voice/audio processing, pattern memory, privacy version, and non-therapy/safety limits.
- Add P0 user controls for data export, journal-entry deletion, pattern memory clear, session revocation, and clearer stored-vs-processed copy.
- Extract council orchestration into a service flow and add deterministic pilot validation before persistence/trace use.
- Add session feedback, dashboard session status, admin pilot operations, safety resolution, and quality review queues.

## Test Plan
- Privacy-safe pilot events never store raw journal text.
- Consent gates pilot journal access and voice/pattern-memory use.
- Export includes profile, entries, analysis, responses, prompts, pattern memory, council sessions, feedback, safety events, and source provenance.
- Journal deletion and pattern memory clearing write audit records.
- Pilot council evals cover normal, relational, shame/anger, spiritual-grandiosity, self-harm, harm-to-others, abuse/coercion, and dissociation cases.
- Admin dashboards compute pilot funnel, feedback mix, safety review queue, quality queue, source mode rates, no-source rate, and eval freshness.

## Assumptions
- Full account deletion, vector search, manuscript retrieval, dynamic council roles, long-form chat, and marketplace/community remain out of scope.
- Analytics are metadata-only and use hashes instead of raw text.
- Zustand is optional and only for transient step state if needed.
- Existing unrelated dirty files remain untouched.
