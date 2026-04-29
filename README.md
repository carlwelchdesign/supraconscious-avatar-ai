# Inner Avatar AI

Inner Avatar is a guided AI journaling SaaS built with Next.js, first-party email/password auth, Prisma Postgres, and OpenAI.

## Documentation

Start here:

- [Documentation Index](docs/README.md)
- [Architecture](docs/architecture.md)
- [Local Setup and Deployment](docs/setup-and-deployment.md)
- [Authentication](docs/authentication.md)
- [AI Journaling Pipeline](docs/ai-pipeline.md)
- [Voice Features](docs/voice.md)
- [Admin and Operations](docs/admin-and-operations.md)
- [Wiki Home](docs/wiki/Home.md)

## Getting Started

Install dependencies and run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication

The app uses first-party email/password accounts with database-backed sessions.

Required environment variables:

```bash
DATABASE_URL="postgres://..."
OPENAI_API_KEY="sk-..."
```

The first credentialed account becomes an admin. Admin users can access `/admin` for user, subscription, analytics, and prompt-management views.

## Verification

```bash
npm run lint
npm run build
npx prisma validate
```

Authenticated sessions are stored in the `Session` table with hashed tokens, and all journal data is stored against the local `User.id`.
