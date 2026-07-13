# Admin and Operations

## Separate Admin App

The admin panel lives in `apps/admin` and deploys separately from `apps/web`.

There are no `/admin` routes inside the public web app. Admin functionality is not bundled into the user-facing deployment.

Current admin routes:

- `/`: high-level counts and system links.
- `/users`: users, roles, account dates, entry counts.
- `/subscriptions`: subscription state and billing metadata.
- `/safety`: safety events and flagged entry metadata.
- `/health`: database, runtime configuration, founder calibration status, auth abuse pressure, and voice usage checks.
- `/prompts`: prompt template create/list/edit.
- `/guide-stages`: editable guide stage metadata. `/avatar-stages` redirects here for older admin links.
- `/feature-flags`: feature flag create/list/update.
- `/reasoning-graph`: source-backed concept-network generation, graph review, graph canvas tabs, and reasoning insights.
- `/reasoning-ontology`: approved concept, relationship, gap, bridge, and stakeholder-path curation.
- `/ai-quality`: metadata-only AI output review.
- `/council`: council/session review, including source-grounding traces and ontology-assisted GraphRAG traces when present.
- `/calibration/setup`: Carl/Maria founder participant setup, readiness checklist, safe handoff links, and scenario coverage.
- `/calibration/live`: Carl/Maria live calibration review cockpit with raw journal text hidden by default.

Admin review and CMS-style actions use server actions. High-use forms show pending submit states, top-level status banners, and local validation help where required fields are easy to miss. Source and chunk review actions redirect back near the edited record with anchors when practical.

## Reasoning Graph And Ontology Operations

The reasoning graph is an admin-only analysis surface for approved Maria/source materials. It is not a public product feature and does not affect user-facing AI responses by itself.

Use `/reasoning-graph` to generate and inspect source-backed text networks:

- source chunks are transformed into concept nodes and weighted co-occurrence edges
- graph runs preserve source provenance, metrics, clusters, bridges, gaps, and insight metadata
- the graph canvas is split into `Network 1`, `Network 2`, and `Network 3` tabs so each connected network can be reviewed separately
- Network 1 uses stronger cluster coloring and more prominent edges because it is usually the densest and most useful graph
- clicking a node keeps the selected-node detail panel tied to connected ideas, source excerpts, and graph metrics

Graph generation should only use approved, rights-compatible source material. Failed generation should preserve the previous completed graph rather than replacing it with partial output.

Source approval and ontology eligibility are separate controls. `SourceDocument.reasoningScope` decides whether a document belongs to `maria_materials`, `product_doctrine`, `curriculum`, `reference_only`, or `excluded`. The graph generator defaults to `maria_materials`; product-doctrine and all-scope runs are diagnostic and should not be promoted into the Maria ontology by accident.

If the default Maria scope reports no source chunks, parse and approve manuscript chunks first. Do not use product-doctrine chunks as a fallback just to populate the ontology.

Use `/reasoning-ontology` to curate durable records from generated candidates:

- concepts with canonical labels, aliases, descriptions, evidence, and review state
- typed relationships such as causal, hierarchical, associative, tension, practice-to-outcome, supports, and gap-bridge
- clusters/themes with summaries and central concepts
- stakeholder outcome paths with supporting concepts and missing/gap areas

Generated graph runs are draft analysis history. Only approved ontology records may enter runtime GraphRAG prompts. Admins remain the architect: AI may propose structure, but humans approve, reject, rename, merge, and pin what becomes canonical.

Runtime GraphRAG remains feature-flagged through `ontology_rag_enabled`. Keep it disabled by default until the approved ontology has been reviewed against source evidence.

## Founder Calibration Operations

Founder calibration is for Carl and Maria while the product is still being shaped. Admins may configure participants and review sessions, but must not create passwords, create sessions, impersonate founders, or bypass onboarding/consent. A feedback type is enough to keep calibration moving; written notes and human reviews are useful when they capture a specific tuning detail or strong example.

Use this sequence:

```bash
node .yarn/releases/yarn-4.cjs verify:founder-calibration-code
node .yarn/releases/yarn-4.cjs dev:founder-calibration
node .yarn/releases/yarn-4.cjs smoke:founder-local --web-url http://localhost:3000 --admin-url http://localhost:3001 --passes 3
node .yarn/releases/yarn-4.cjs packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001
```

Then:

- open admin `/calibration/setup`
- confirm active `carl` and `maria` participants are linked to the right accounts
- if a linked founder knows their current password, they can change it from web `/settings`
- if a linked founder cannot sign in, use the audited super-admin temporary password reset in `/users`; do not create duplicate accounts or bypass onboarding
- copy the Full Launch Packet or the per-founder handoff text and send it manually
- have each founder complete onboarding/consent through the normal web app
- have each founder run one guided journal scenario and choose a feedback type
- optionally review sessions in `/calibration/live` when feedback points to a specific issue or a strong example
- mark strong sessions `ready`/golden or route issues to voice, source, prompt, intensity, or embodiment review when useful

The setup report may still show live founder actions until Maria completes onboarding and her first session. That is operational handoff work, not a reason to stop app development.

## Access Control

Admin access uses a separate session scope:

- web cookie: `ia_web_session`
- admin cookie: `ia_admin_session`

Only users with `admin` or `super_admin` may create an admin session. `SUPER_ADMIN_EMAILS` bootstraps `super_admin` access at registration/login.

Every admin page or server action must call `requireAdminUser()` or `requireSuperAdminUser()` server-side. Client-side role checks are never enough.

## Privacy and Audit Logging

Admin list views are metadata-first and should not show raw journal content.

The safety page can reveal raw journal text only through `revealFlaggedEntryAction()`, which requires:

- a signed-in admin session
- a safety event ID
- an explicit reason
- a server-side authorization check
- an `AuditLog` row with actor, action, target, reason, metadata, IP, user agent, and timestamp

Use raw reveal only for support, moderation, or safety review.

## Subscriptions

The web app starts Stripe Checkout from `/pricing`, opens Stripe Billing Portal from `/settings`, and syncs subscription state through `POST /api/billing/webhook`.

Stored fields include Stripe customer ID, subscription ID, price ID, plan, status, and current period dates. Admin `/subscriptions` shows a searchable metadata table.

Required web env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`

## Prompt Management

Prompt template records live in `PromptTemplate`. Admin changes write audit logs with the prompt key, old version, new version, and related calibration session ids when provided.

The live Inner Council flow resolves the active `council.system` template at runtime. If no active template exists, or if the active template is missing required guardrails, the AI package falls back to the checked-in default council prompt. Council generation traces record the prompt key/version that was used, so prompt changes can be reviewed against founder calibration evidence.

Do not paste raw journal text into prompt update reasons or related-session metadata. Use `/calibration` and `/calibration/live` to identify golden examples or issue sessions, then link those session ids when updating `council.system`.

## LangSmith Trace Review

When optional LangSmith tracing is enabled, admin `/council` shows LangSmith metadata from `GenerationTrace.outputJson.langsmith` alongside the existing internal trace details. The display is intentionally metadata-first:

- enabled/sampled state
- project name
- policy version
- run id or trace link when available
- metadata-only flag

Raw journal text, source chunk text, prompt content, and full council output are not sent to LangSmith by default and should not be added to admin review reasons.

## Council Review GraphRAG Traces

Admin `/council` also distinguishes normal source-grounded sessions from ontology-assisted sessions when GraphRAG has been enabled.

For ontology-assisted sessions, reviewers should be able to inspect:

- selected approved concept ids and labels
- selected approved relationship ids and typed relationship summaries
- bridge/path summaries used as reasoning context
- evidence source chunk ids used to boost or supplement source retrieval
- whether GraphRAG was enabled, disabled, omitted for safety, or skipped because of a fallback

These traces are stored in internal `GenerationTrace` records with `traceType = "ontology_retrieval"`. They are review metadata, not user-facing content. If ontology retrieval fails, the session should still complete through the existing source-RAG flow and the fallback reason should be visible in review.

## Operational Checks

Before deploy:

```bash
node .yarn/releases/yarn-4.cjs lint
node .yarn/releases/yarn-4.cjs typecheck
node .yarn/releases/yarn-4.cjs test:langsmith
node .yarn/releases/yarn-4.cjs build:web
node .yarn/releases/yarn-4.cjs build:admin
```

After deploy:

- visit web `/login`
- register or login with an allowlisted `SUPER_ADMIN_EMAILS` account
- visit admin `/login`
- confirm normal `user` accounts cannot access admin routes
- confirm `/safety` does not show raw journal content in list views
- confirm `/health` shows database `ok`, expected runtime configuration, and the current founder calibration state
- reveal a flagged entry with a reason and confirm an `AuditLog` row is created

## Incident Notes

If login throws database errors about missing columns, regenerate the Prisma client and apply checked-in migrations to the active database:

```bash
node .yarn/releases/yarn-4.cjs db:generate
node .yarn/releases/yarn-4.cjs db:migrate:deploy
```

Use `node .yarn/releases/yarn-4.cjs db:push` only for local throwaway databases when you intentionally want Prisma to sync the schema without creating or applying migrations. If production uses a different database than local development, run migrations against the production `DATABASE_URL` as a controlled release step.
