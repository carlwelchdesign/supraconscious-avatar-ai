# Inner Avatar AI

Inner Avatar is a guided AI journaling SaaS built with Next.js, Clerk, Prisma Postgres, and OpenAI.

## Getting Started

Install dependencies and run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication

Clerk is the source of truth for login and registration.

Required environment variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/register"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

For the MVP, configure the Clerk application for email-only registration and sign-in. Do not enable Google or social providers until they are intentionally added to the product.

If Clerk keys are missing or placeholders during local development, the app enters local demo mode and uses a demo user. Production never enters demo mode; protected routes and APIs fail closed until valid Clerk keys are configured.

## Verification

```bash
npm run lint
npm run build
npx prisma validate
```

The first authenticated request mirrors the Clerk user into Prisma using `User.clerkId`, then all journal data is stored against the local `User.id`.
