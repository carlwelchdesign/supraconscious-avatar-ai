# Supraconscious Documentation

This documentation describes the current monorepo. Update it whenever auth, database models, AI behavior, deployment scripts, or user-facing flows change.

## Quick Links

- [Architecture](architecture.md): workspace structure, app boundaries, data flow, and major packages.
- [Local Setup and Deployment](setup-and-deployment.md): environment variables, Yarn commands, Prisma setup, and Vercel notes.
- [Authentication](authentication.md): first-party login, scoped sessions, route protection, and admin RBAC.
- [AI Journaling Pipeline](ai-pipeline.md): safety, analysis, Inner Council response generation, RAG, LangSmith observability, embodiment prompts, pattern memory, and progression.
- [Voice Features](voice.md): microphone transcription, text-to-speech playback, preferences, and API routes.
- [Voice Browser Troubleshooting](voice-browser-troubleshooting.md): browser and device-specific microphone/playback support notes.
- [Admin and Operations](admin-and-operations.md): separate admin app, privacy controls, audit logging, users, subscriptions, safety, prompt templates, feature flags, and operational checks.
- [Obsidian Vault Import](obsidian-vault-import.md): local-only Obsidian authoring workflow for importing opted-in Markdown notes into source review.
- [Container and Kubernetes Readiness](container-and-kubernetes.md): Docker images, Compose testing, runtime environment, and future Kubernetes scaling model.
- [Flutter Mobile App](mobile-flutter.md): App Store/Google Play plan, local Flutter tooling, mobile workspace shape, and wearable deferral.
- [Wiki Home](wiki/Home.md): GitHub-wiki-style navigation page that can be copied into an actual GitHub Wiki.
- [ChatGPT MCP App](chatgpt-mcp-app.md): ChatGPT MCP server package, MCP tools, static widget, test harness, and deployment.

## Release Checks

Pull requests run CI for Prisma validation, typecheck, lint, auth/web/AI/RAG/pilot/founder checks, web/admin/ChatGPT builds, and Docker image builds. Vercel remains the current production deployment path.

## Current System

Supraconscious Avatar AI is a multi-app AI journaling platform with a public web app, a separate admin/CMS console, a ChatGPT/MCP server, PostgreSQL persistence, policy-first RAG, prompt governance, source provenance, optional metadata-only LangSmith observability, and Docker-ready deployment.

Core runtime capabilities include:

- bounded Inner Council generation through shared AI services
- safety classification before reflection
- reviewed source-document, section, and chunk records for RAG
- vector-DB-ready provenance contracts for future embeddings/search work
- MCP-compatible tool execution through `apps/chatgpt-app`
- admin/CMS workflows for source review, prompt templates, feature flags, guide-stage metadata, RAG readiness, safety review, calibration, users, and subscriptions
- metadata-only LangSmith tracing around the Inner Council service boundary
- LangGraph intentionally deferred until graph-native orchestration is needed

## Runtime Defaults

- Package manager: Yarn workspaces.
- Task runner: Turborepo.
- Web app: `apps/web`, usually on port `3000`.
- Admin app: `apps/admin`, usually on port `3001`.
- Auth: first-party email/password with hashed passwords and database-backed scoped sessions.
- Database: PostgreSQL through Prisma 7 and `@prisma/adapter-pg`.
- Main reflection model: `OPENAI_MODEL` when set, otherwise `gpt-5-mini`.
- Voice transcription: `whisper-1`.
- Voice speech: `tts-1`.
- Admin bootstrap: emails in `SUPER_ADMIN_EMAILS` become `super_admin` on registration/login.
