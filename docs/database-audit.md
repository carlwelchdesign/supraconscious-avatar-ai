# Database audit

Last audited: 2026-08-08

This audit covers the active PostgreSQL datastore, the Prisma schema and migrations, and database access visible in the repository. It does not inspect production data, production query plans, managed-database settings, backups, retention policy, or regulatory compliance.

## Current boundary

- PostgreSQL is the only configured application datastore. Browser storage is used for disposable UI state, not authoritative user records.
- `packages/db/prisma/schema.prisma` is the schema source of truth and currently contains 64 models.
- `packages/db/prisma/migrations` contains 18 ordered migrations. CI applies the complete history to an empty PostgreSQL 16 database before testing for schema drift.
- User data is scoped by `userId`; the current product does not define organization tenants. Adding tenant columns or row-level security without a product requirement would create misleading isolation rather than prove multi-tenant safety.
- Stripe remains the source of truth for monetary amounts. The local `Subscription` model stores provider identifiers and status, not currency amounts; existing `Float` fields represent bounded scores or weights rather than money.

## Findings addressed

The audit added seven missing indexes for foreign-key columns. PostgreSQL enforces those relationships but does not automatically add indexes to the referencing columns. The indexes improve joins and parent-row updates or deletes for:

- `GeneratedPrompt.journalEntryId`
- `PatternMemory.journalEntryId`
- `CuratedPrompt.approvedById`
- `SourceDocument.importedById`
- `CurriculumDay.sourceDocumentId`
- `GenerationTrace.sourceChunkId`
- `SafetyEvent.journalEntryId`

Nine composite indexes map directly to recurring application access patterns:

- user session recency;
- user journal timelines;
- active pattern-memory lookup;
- user council-session timelines;
- latest consent by user and consent type;
- approved curriculum prompts by month and day;
- trace retrieval by council session and trace type;
- safety-review queues by status and creation time; and
- latest subscription state by user.

The migration creates every index with `CREATE INDEX CONCURRENTLY` to avoid blocking normal writes during index construction. Concurrent builds take more work and can leave an invalid index after an interrupted build, so deployment monitoring and `prisma migrate status` remain required.

Eight existing single-column indexes become leading-prefix duplicates of the new composite indexes. They remain in the managed schema because this repository's Prisma 7.8 replay wrapped `DROP INDEX` migrations in a transaction while PostgreSQL forbids `DROP INDEX CONCURRENTLY` inside a transaction. Removing them automatically would require a potentially blocking ordinary drop. After staging and production plan observation, an operator may retire those exact indexes with monitored `DROP INDEX CONCURRENTLY` commands and then remove them from the Prisma schema in a separately coordinated release.

## Automated guardrails

Run:

```bash
yarn test:database
yarn prisma validate
yarn prisma generate
```

`yarn test:database` verifies:

- the configured provider remains PostgreSQL;
- every relation field has an index or unique constraint;
- the query-backed composite indexes remain present and correctly ordered;
- money-like fields cannot use `Float`;
- migration directories are timestamped and contain non-empty SQL; and
- the audit migration cannot delete rows, tables, or columns, and all index changes remain concurrent.

After migrations are applied to an ephemeral or staging database, run:

```bash
yarn test:database:drift
```

Prisma exits with code 2 when the database and schema differ. This detects Prisma-supported drift; it does not detect unsupported database objects such as custom triggers or views.

## Deployment and rollback

1. Snapshot the target database and confirm restore procedures before deployment.
2. Run the migration in staging with production-representative row counts.
3. Monitor active sessions, locks, disk use, and migration state while indexes build.
4. Run `yarn test:database:drift` against staging.
5. Use `EXPLAIN (ANALYZE, BUFFERS)` on representative read-only queries and confirm the planner uses the new indexes at realistic cardinality. Do not log bound values or private journal content.
6. Deploy during a monitored window. If a concurrent build is interrupted, inspect and remove only the invalid index before resolving or retrying the migration.

The paired `rollback.sql` drops only the new indexes and does so concurrently. Rollback is not automatic; confirm query-plan impact before running it.

## Open operational decisions

- Prisma currently maps `DateTime` columns to PostgreSQL `TIMESTAMP(3)` without an explicit time-zone type. The applications exchange JavaScript `Date` values and format them in configured display zones, but a repository audit cannot prove historical database/session timezone assumptions. Any conversion to `TIMESTAMPTZ` needs sampled-data validation and a separate staged migration.
- Hard deletes and cascading deletes are intentional for account/session cleanup in several paths, while audit and safety records use their own lifecycle fields. Product retention and erasure requirements need a written policy before introducing soft deletion broadly.
- Index value must be rechecked with production-scale statistics. Indexes that remain unused after a representative observation window should be reviewed because write and storage costs are not free.
- Backup scheduling, point-in-time recovery, connection pooling, slow-query thresholds, and database alerts are managed-service configuration and must be verified in the deployment environment.

Primary references: [PostgreSQL concurrent index behavior](https://www.postgresql.org/docs/16/sql-createindex.html), [PostgreSQL query-plan analysis](https://www.postgresql.org/docs/current/using-explain.html), and [Prisma schema drift comparison](https://docs.prisma.io/docs/cli/migrate/diff).
