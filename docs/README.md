# Inner Avatar AI Documentation

This documentation describes the current monorepo. Update it whenever auth, database models, AI behavior, deployment scripts, or user-facing flows change.

## Quick Links

- [Architecture](architecture.md): workspace structure, app boundaries, data flow, and major packages.
- [Local Setup and Deployment](setup-and-deployment.md): environment variables, Yarn commands, Prisma setup, and Vercel notes.
- [Authentication](authentication.md): first-party login, scoped sessions, route protection, and admin RBAC.
- [AI Journaling Pipeline](ai-pipeline.md): safety, analysis, Avatar response, prompt generation, pattern memory, and progression.
- [Voice Features](voice.md): microphone transcription, text-to-speech playback, preferences, and API routes.
- [Admin and Operations](admin-and-operations.md): separate admin app, privacy controls, audit logging, users, subscriptions, safety, prompt templates, feature flags, and operational checks.
- [Wiki Home](wiki/Home.md): GitHub-wiki-style navigation page that can be copied into an actual GitHub Wiki.

## Current Product

Inner Avatar is a private guided journaling SaaS. A registered user writes or dictates an entry, the backend runs a safety check, analyzes the entry into structured data, generates a short Avatar reflection, creates a symbolic prompt, updates pattern memory, and may advance the user's level or Avatar stage.

The product positioning is reflective journaling, not therapy, diagnosis, or treatment.

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
