# Architecture

## High-Level Shape

The repo is a Yarn workspaces + Turborepo monorepo with two independently deployable Next.js apps.

- `apps/web`: public marketing pages, login/register, authenticated journaling product, voice APIs, and journal AI route handlers.
- `apps/admin`: internal admin panel with its own `/login`, own session cookie, own route protection, and its own deployment target.
- `packages/db`: Prisma schema at `packages/db/prisma/schema.prisma`, Prisma client singleton, and shared DB access.
- `packages/auth`: password hashing, login/register/logout server actions, scoped session cookies, and RBAC guards.
- `packages/ai`: OpenAI client helper, Zod schemas, safety classifier, analysis, Inner Council and guide response generation, source RAG, approved-ontology GraphRAG retrieval, prompt generation, pattern memory, and progression logic.
- `packages/billing`: Stripe checkout, billing portal, webhook sync helpers, plan mapping, and subscription status normalization.
- `packages/ui`: shared UI primitives and visual components used by both apps.
- `packages/types`: shared TypeScript unions such as `UserRole` and `SessionScope`.
- `packages/config`: shared TypeScript configuration.

There is no `apps/api` in this phase. Route handlers remain inside the app that owns the behavior.

## App Boundaries

The web app owns user-facing routes:

- `/`: public landing page.
- `/pricing`: public pricing page.
- `/login` and `/register`: web account entry points.
- `/dashboard`, `/journal`, `/journal/[entryId]`, `/patterns`, `/guide`, `/settings`: authenticated product routes. `/avatar` redirects to `/guide` for older links.
- `/api/journal/*`, `/api/avatar/*`, `/api/prompts/*`, `/api/patterns`, `/api/voice/*`: user-facing backend routes.
- `/api/billing/portal` and `/api/billing/webhook`: Stripe billing portal and webhook sync routes.

The admin app owns internal operations routes:

- `/login`: admin login.
- `/`: admin dashboard.
- `/users`, `/subscriptions`, `/safety`, `/health`, `/prompts`, `/guide-stages`, `/feature-flags`, `/reasoning-graph`, `/reasoning-ontology`, `/ai-quality`, `/council`. `/avatar-stages` redirects to `/guide-stages` for older admin links.

The web app must not contain `/admin` routes. Admin functionality is not bundled into the public app.

## Request Flow

1. Public visitors use `apps/web`.
2. Web registration/login creates an `ia_web_session` cookie and a `Session` row with `scope = "web"`.
3. Web protected pages are guarded by `apps/web/src/proxy.ts` and by server-side `requireAppUser()`.
4. Admin users use `apps/admin`.
5. Admin login creates an `ia_admin_session` cookie and a `Session` row with `scope = "admin"`.
6. Admin protected pages are guarded by `apps/admin/src/proxy.ts` and by server-side `requireAdminUser()` or `requireSuperAdminUser()`.

Cookie presence is only an early check. Server pages, server actions, and API routes still enforce authorization server-side.

## Database Models

The Prisma schema is the source of truth in `packages/db/prisma/schema.prisma`.

Core models:

- `User`: account, role, reflection preferences, progression state, safety/memory flags, and voice preferences.
- `Session`: hashed session token, expiry, last-seen timestamp, and `scope` (`web` or `admin`).
- `JournalEntry`, `EntryAnalysis`, `AvatarResponse`, `GeneratedPrompt`, `PatternMemory`, `SafetyEvent`: journaling and AI pipeline data. Some model names retain legacy `Avatar` wording for compatibility.
- `Subscription`: Stripe subscription metadata synced from checkout and webhook events.
- `AuditLog`: immutable record of sensitive admin actions.
- `PromptTemplate`: admin-managed prompt/system text.
- `FeatureFlag`: admin-managed product gates.
- `AvatarStageConfig`: editable admin metadata for guide stages. The model name retains legacy `Avatar` wording for compatibility.
- `ReasoningGraphRun`, graph node/edge/cluster/insight/evidence models: generated source-backed graph analysis history for admin review.
- Reasoning ontology concept, relationship, cluster, gap, bridge, outcome, and evidence models: approved curated graph records that may be used by GraphRAG when feature-flagged on.

## Source RAG And Ontology GraphRAG

The source corpus remains the grounding layer. Source documents are reviewed into sections and chunks, and the AI pipeline retrieves only eligible chunks based on approval state, rights, safety, feature flags, and validation policy. `SourceDocument.reasoningScope` is separate from retrieval approval and controls whether approved source material is eligible for Maria ontology generation, product-doctrine diagnostics, curriculum review, reference-only use, or exclusion.

The reasoning graph and ontology layer sits above that source corpus:

1. Admins generate graph runs from approved source chunks.
2. Generated runs expose concept networks, clusters, bridge concepts, gaps, and stakeholder paths for review.
3. Admins curate durable ontology records from those candidates.
4. Runtime GraphRAG can retrieve approved ontology neighborhoods only when `ontology_rag_enabled` is on.
5. Ontology evidence chunk ids can boost or supplement source retrieval, but user-facing citations still come from approved retrieved source chunks.

Unreviewed graph-run candidates never enter public AI prompts. If GraphRAG retrieval fails or is disabled, the council flow falls back to the normal source-RAG path.

## Styling

Both apps use Tailwind CSS and shared primitives from `@inner-avatar/ui`. App-local components stay inside their app unless they are reused by both apps.
