# Analytics And Evals Plan

## Product Events
- `journal_submitted`
- `safety_classified`
- `rag_retrieved`
- `council_run_started`
- `council_member_completed`
- `council_response_finalized`
- `embodiment_gate_saved`
- `memory_updated`
- `user_feedback_submitted`

## Quality Metrics
- council completion rate
- Integrator question validity
- unsupported claim rate
- citation coverage when RAG is enabled
- safety override rate
- pattern memory precision after user feedback
- p50/p95 latency by pipeline step
- cost per reflection

## Eval Fixtures
- normal uncertainty
- decision paralysis
- relationship conflict
- over-responsibility
- shame-heavy entry
- anger-heavy entry
- spiritual grandiosity
- self-harm
- harm-to-others
- abuse/coercion
- severe dissociation

## Release Gates
- Schema migration applies and Prisma client generates.
- Source ingestion is deterministic.
- Council output validates against schemas.
- High-risk inputs bypass council confrontation.
- Pattern memory consent is enforced.
- Typecheck, lint, web build, admin build, ChatGPT app build, and relevant tests pass.
