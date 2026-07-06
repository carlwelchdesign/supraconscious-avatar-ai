# Supraconscious Wiki

This folder mirrors the shape of a GitHub Wiki. It can be copied into the repository wiki later, but it is kept in the main repo so documentation changes can be reviewed with code.

## Pages

- [Architecture](../architecture.md)
- [Local Setup and Deployment](../setup-and-deployment.md)
- [Authentication](../authentication.md)
- [AI Journaling Pipeline](../ai-pipeline.md)
- [Voice Features](../voice.md)
- [Admin and Operations](../admin-and-operations.md)

## Product Summary

Supraconscious is a guided journaling app centered on Inner Council reflection. Users create an account, write or dictate journal entries, receive structured reflective responses, and build pattern memory over time when consent allows it. The product must stay positioned as reflective journaling, not therapy or diagnosis.

## Core Flow

1. User registers or logs in.
2. User writes or dictates a journal entry.
3. Safety classifier runs first.
4. Safe entries go through structured analysis.
5. Guide response and symbolic prompt are generated.
6. Pattern memory and progression are updated.
7. User sees a short reflection, a grounded integration step, and a prompt.

## Maintainer Notes

- Keep `packages/db/prisma/schema.prisma` and docs in sync.
- Keep auth docs updated when session, password, or admin logic changes.
- Keep AI docs updated when model names, schemas, safety behavior, or prompt rules change.
- Run `node .yarn/releases/yarn-4.cjs build:web` and `node .yarn/releases/yarn-4.cjs build:admin` before deploying.
