# Council Agent Architecture

## Summary
The Inner Council is implemented as a bounded orchestration pipeline in `packages/ai`. Route handlers own authentication, request validation, persistence, and response formatting. AI services own safety, retrieval, council generation, synthesis, traceability, and memory update decisions.

## Architecture Principles
- Single Responsibility: each service owns one job.
- Open/Closed: council roles are addable through typed role configuration.
- Liskov: every role supports success, abstention, failure, and safe fallback.
- Interface Segregation: UI, persistence, retrieval, and generation contracts are separate.
- Dependency Inversion: orchestration depends on internal service contracts, not direct provider calls.

## Pipeline
1. Classify safety.
2. Create the journal entry.
3. If high risk, persist a grounding response and skip symbolic council work.
4. Analyze the entry.
5. Retrieve approved source/curriculum context when enabled.
6. Generate council role outputs with strict schemas.
7. Synthesize a single Integrator question and integration step.
8. Persist `CouncilSession`, `CouncilMessage`, `CouncilSynthesis`, `GenerationTrace`, and legacy response rows for compatibility.
9. Update pattern memory only when enabled.
10. Return a structured UI payload.

## Output Rules
- Council roles may abstain.
- Council roles must include user evidence where they make user-derived observations.
- Source-derived claims must carry source chunk IDs when retrieval is active.
- The Integrator is the only component that creates final synthesis language.
- No role may diagnose, prescribe treatment, claim certainty, speak as Maria, or use channeling language.

## Rollout
- `council_mode`: enables the new council response shape.
- `rag_enabled`: enables source retrieval.
- `memory_feedback_enabled`: enables memory correction controls.
- `admin_evals_enabled`: enables expanded review queues.
