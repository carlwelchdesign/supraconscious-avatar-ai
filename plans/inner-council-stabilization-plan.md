# Inner Council Stabilization Plan

## Summary
Stabilize the implemented Inner Council MVP before expanding RAG or richer agent behavior. Keep the council flow trustworthy, reproducible, and reviewable while preserving unrelated deployment/source changes.

## Key Changes
- Separate Inner Council changes from pre-existing dirty files and commit only council, source, schema, UI, admin, and plan work.
- Convert the Prisma `db push` result into a migration so schema changes are reproducible.
- Document the AI package `.js` compatibility shims and keep them intentionally until the package has a compiled output strategy.
- Add focused tests for council safety bypass, Integrator single-question enforcement, pattern-memory opt-out, feature flag defaults, source filters, and curriculum parsing.
- Seed conservative feature flags: `council_mode=true`, `rag_enabled=false`, `memory_feedback_enabled=false`, `admin_evals_enabled=false`.
- Import the current month curriculum as `needs_review` and approve a small subset for the journal Threshold.

## Test Plan
- Prisma validate/generate.
- AI package tests.
- Web/admin/ChatGPT TypeScript checks.
- Web/admin lint.
- Web/admin builds.
- ChatGPT app tests.

## Assumptions
- Durable state stays server/database-backed.
- Zustand remains optional and only for transient UI state.
- RAG remains disabled until source approval and trace reliability are stronger.
