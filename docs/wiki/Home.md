# Inner Avatar AI Wiki

This folder mirrors the shape of a GitHub Wiki. It can be copied into the repository wiki later, but it is kept in the main repo so documentation changes can be reviewed with code.

## Pages

- [Architecture](../architecture.md)
- [Local Setup and Deployment](../setup-and-deployment.md)
- [Authentication](../authentication.md)
- [AI Journaling Pipeline](../ai-pipeline.md)
- [Voice Features](../voice.md)
- [Admin and Operations](../admin-and-operations.md)

## Product Summary

Inner Avatar is a guided journaling app. Users create an account, write or dictate journal entries, receive structured reflective responses, and build pattern memory over time. The product must stay positioned as reflective journaling, not therapy or diagnosis.

## Core Flow

1. User registers or logs in.
2. User writes or dictates a journal entry.
3. Safety classifier runs first.
4. Safe entries go through structured analysis.
5. Avatar response and symbolic prompt are generated.
6. Pattern memory and progression are updated.
7. User sees a short reflection, a grounded integration step, and a prompt.

## Maintainer Notes

- Keep `prisma/schema.prisma` and docs in sync.
- Keep auth docs updated when session, password, or admin logic changes.
- Keep AI docs updated when model names, schemas, safety behavior, or prompt rules change.
- Run `npm run build` before deploying.
