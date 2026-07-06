# About Supraconscious Avatar AI

Supraconscious Avatar AI is a full-stack AI reflection platform built around guided journaling, agentic council generation, source-grounded retrieval, and internal content governance.

The project is organized as a production-oriented monorepo with a public web app, a separate admin/CMS console, a ChatGPT/MCP integration server, shared AI orchestration packages, and PostgreSQL-backed persistence.

## Repository Details

**GitHub About / description**

Inner Avatar is a full-stack SaaS application that leverages AI-driven analysis to transform journaling into a structured reflection system, surfacing patterns, contradictions, and behavioral insights over time.

**Suggested topics**

`ai` `journaling` `reflection` `saas` `nextjs` `react` `typescript` `postgresql` `prisma` `openai` `rag` `vector-database` `mcp` `cms` `admin-dashboard` `docker` `kubernetes-ready`

## What It Does

- Captures journal entries through a private web experience.
- Runs safety classification and structured analysis before generation.
- Produces bounded Inner Council reflections through role-based AI outputs.
- Synthesizes each session into a focused integrator question and embodiment step.
- Uses reviewed source material through a policy-first RAG layer.
- Persists generation traces, source provenance, feedback, review labels, and calibration evidence.
- Exposes the council pipeline through an MCP-compatible ChatGPT app.
- Gives operators an admin/CMS console for content, prompts, source review, quality review, and launch operations.

## Technical Stack

- **Frontend**: Next.js App Router, React, TypeScript.
- **Admin**: separate Next.js app with admin-scoped auth and RBAC.
- **AI orchestration**: shared `packages/ai` service layer with safety checks, council generation, RAG policy, prompt resolution, evals, and reports.
- **Database**: PostgreSQL with Prisma models and migrations.
- **Auth**: first-party email/password auth, scoped sessions, RBAC, throttling, audit logs.
- **MCP**: Express-based server exposing AI tools and a static widget.
- **Deployment**: Vercel-compatible builds plus Docker and Docker Compose.
- **Scaling path**: stateless containers, managed Postgres, connection pooling, and Kubernetes-ready service boundaries.

## AI And Retrieval Architecture

The system uses a policy-first RAG architecture. Source material is imported and reviewed before it can influence generated responses. Retrieval eligibility is controlled by document state, chunk state, rights metadata, quote permissions, safety intensity, and feature flags.

The current retrieval implementation is keyword based. The source/chunk/provenance model is designed so embeddings and a vector database can be introduced later without bypassing approval, rights, or traceability controls.

## Admin As CMS

The admin app can reasonably be described as a specialized CMS for AI-governed content. It manages not only content records, but also the operational controls around that content:

- source documents, sections, chunks, and review states
- prompt templates and prompt versioning
- source provenance and retrieval readiness
- RAG activation and rollback
- founder calibration sessions and golden examples
- quality labels and safety review
- users, subscriptions, feature flags, and health checks

That makes it closer to an AI operations CMS or governance console than a traditional marketing CMS.

## Current Development Focus

The current focus is founder calibration and production hardening:

- make Carl/Maria calibration sessions easy to run
- capture practical feedback on voice, grounding, and embodiment
- review source-grounded outputs in admin
- tune prompts through versioned templates
- keep RAG narrow and traceable before expanding retrieval scope
- maintain Docker/Kubernetes readiness for future scaling
