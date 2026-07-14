# Supraconscious Wiki

This folder mirrors the shape of a GitHub Wiki. It can be copied into the repository wiki later, but it is kept in the main repo so documentation changes can be reviewed with code.

## Pages

- [Repository About](../../ABOUT.md)
- [Technical README](../../README.md)
- [Architecture](../architecture.md)
- [Local Setup and Deployment](../setup-and-deployment.md)
- [Authentication](../authentication.md)
- [AI Journaling Pipeline](../ai-pipeline.md)
- [Voice Features](../voice.md)
- [Admin and Operations](../admin-and-operations.md)
- [ChatGPT MCP App](../chatgpt-mcp-app.md)
- [Container and Kubernetes Readiness](../container-and-kubernetes.md)

## System Summary

Supraconscious Avatar AI is a production-oriented AI journaling monorepo. It combines a Next.js web app, a separate internal admin/CMS console, an Express ChatGPT/MCP server, shared AI orchestration packages, PostgreSQL persistence, policy-first RAG, prompt governance, and Docker/Kubernetes-ready service boundaries.

## Core Runtime Flow

1. User registers or logs in.
2. User writes or dictates a journal entry.
3. Safety classifier runs first.
4. Structured analysis and optional retrieval context are generated.
5. Bounded council voices and the integrator response are generated.
6. Source provenance, generation traces, feedback, and review metadata are persisted.
7. Admin reviews source readiness, prompt versions, quality labels, calibration sessions, and operational health.

## Maintainer Notes

- Keep `packages/db/prisma/schema.prisma` and docs in sync.
- Keep auth docs updated when session, password, or admin logic changes.
- Keep AI docs updated when model names, schemas, safety behavior, RAG policy, MCP tools, or prompt rules change.
- Run `yarn build:web` and `yarn build:admin` before deploying.
