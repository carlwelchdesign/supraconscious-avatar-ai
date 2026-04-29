# Inner Avatar AI Documentation

This documentation describes the current codebase, not a future target architecture. It should be updated whenever auth, database models, AI behavior, deployment scripts, or user-facing flows change.

## Quick Links

- [Architecture](architecture.md): app structure, route groups, data flow, and major modules.
- [Local Setup and Deployment](setup-and-deployment.md): environment variables, install/build commands, Prisma setup, and Vercel notes.
- [Authentication](authentication.md): first-party login, registration, sessions, route protection, and admin access.
- [AI Journaling Pipeline](ai-pipeline.md): safety, analysis, Avatar response, prompt generation, pattern memory, and progression.
- [Voice Features](voice.md): microphone transcription, text-to-speech playback, preferences, and API routes.
- [Admin and Operations](admin-and-operations.md): admin dashboard, users, subscriptions, analytics, prompt management, and operational checks.
- [Wiki Home](wiki/Home.md): GitHub-wiki-style navigation page that can be copied into an actual GitHub Wiki if desired.

## Current Product

Inner Avatar is a private guided journaling SaaS. A registered user writes or dictates an entry, the backend runs a safety check, analyzes the entry into structured data, generates a short Avatar reflection, creates a symbolic prompt, updates pattern memory, and may advance the user's level or Avatar stage.

The product positioning is reflective journaling, not therapy, diagnosis, or treatment.

## Important Runtime Defaults

- App framework: Next.js App Router.
- Auth: first-party email/password with hashed passwords and database-backed sessions.
- Database: PostgreSQL through Prisma 7 and `@prisma/adapter-pg`.
- Main reflection model: `OPENAI_MODEL` when set, otherwise `gpt-5-mini`.
- Voice transcription: `whisper-1`.
- Voice speech: `tts-1`.
- First credentialed registered user becomes `admin`.
