# Architecture

## High-Level Shape

The app is a Next.js App Router application using route groups:

- `src/app/(marketing)`: public marketing pages such as pricing.
- `src/app/(auth)`: custom login and registration pages.
- `src/app/(app)`: authenticated product pages and admin pages.
- `src/app/api`: server routes for journaling, Avatar preferences, patterns, and voice.

Shared modules live under:

- `src/lib/auth`: password hashing, session creation, session lookup, server actions, and auth guards.
- `src/lib/ai`: OpenAI client, safety classifier, analysis, Avatar response generation, prompt generation, progression, schemas, and pattern memory.
- `src/lib/voice`: voice selection, speech synthesis, and transcription helpers.
- `src/components`: UI, journal workspace, layout, auth forms, voice controls, and landing visuals.

## Request Flow

1. Public visitors land on `/`, `/pricing`, `/login`, or `/register`.
2. Registration/login creates an `inner_avatar_session` cookie and a `Session` row.
3. Protected pages are guarded by `src/proxy.ts`, which redirects unauthenticated browser requests to `/login` and returns `401` for protected API requests without a session cookie.
4. Server pages and APIs call `requireAppUser()` for the authoritative user record.
5. Admin pages call `requireAdminUser()`, which redirects non-admin users to `/dashboard`.

## Product Pages

- `/dashboard`: summary of entries, patterns, and recent reflections.
- `/journal`: primary writing surface, optional mic input, Avatar reflection panel, generated prompt, progression notices, and optional audio playback.
- `/journal/[entryId]`: saved journal entry and reflection detail.
- `/patterns`: repeated pattern dashboard.
- `/avatar`: current Avatar stage and reflection settings.
- `/settings`: account, reflection, safety, pattern memory, and voice preferences.
- `/admin`: admin dashboard and links for user, subscription, analytics, and prompt operations.

## API Routes

- `POST /api/journal/analyze`: full journal analysis pipeline.
- `POST /api/journal/create`: draft/simple journal entry creation.
- `GET /api/patterns`: current user's pattern memory and recent entries.
- `PATCH /api/avatar/preferences`: Avatar preference updates.
- `PATCH /api/voice/preferences`: voice preference updates.
- `POST /api/voice/transcribe`: multipart audio transcription.
- `POST /api/voice/speak`: text-to-speech response audio.
- `POST /api/avatar/respond` and `POST /api/prompts/generate`: placeholders that currently point callers to the combined journal pipeline.

## Database Models

The Prisma schema is the source of truth in `prisma/schema.prisma`.

- `User`: account, role, reflection preferences, progression state, safety/memory flags, and voice preferences.
- `Session`: hashed session token, expiry, last-seen timestamp.
- `JournalEntry`: raw user input.
- `EntryAnalysis`: structured AI analysis.
- `AvatarResponse`: short reflective response fields.
- `GeneratedPrompt`: generated symbolic journaling prompt and optional user completion.
- `PatternMemory`: repeated themes across entries.
- `SafetyEvent`: stored safety flags and handling recommendation.
- `Subscription`: Stripe-ready subscription metadata.

## Styling

The app uses Tailwind CSS plus local UI components. Several product screens use CSS custom properties from `src/app/globals.css` for the warm editorial visual system. MUI is present through `src/components/providers/mui-provider.tsx`, but the current core surfaces are mostly custom/Tailwind.
