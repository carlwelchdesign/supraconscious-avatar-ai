# Local Setup and Deployment

## Requirements

- Node.js compatible with Next.js 16 and Prisma 7.
- PostgreSQL database URL.
- OpenAI API key for real AI, transcription, and speech behavior.

## Environment Variables

Required:

```bash
DATABASE_URL="postgres://..."
OPENAI_API_KEY="sk-..."
```

Optional:

```bash
OPENAI_MODEL="gpt-5-mini"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

If `OPENAI_MODEL` is omitted, the app uses `gpt-5-mini`.

## Install and Run

```bash
npm install
npm run dev
```

The `postinstall` script runs `prisma generate`. The build script also runs `prisma generate` before `next build` so fresh Vercel installs have a generated Prisma client.

## Database Setup

For local schema sync:

```bash
npx prisma validate
npx prisma generate
npx prisma db push
```

Use `npx prisma db push --accept-data-loss` only when intentionally dropping or replacing obsolete columns. This was previously needed when removing Clerk's `clerkId` column.

## Verification

Run:

```bash
npm run lint
npm run build
npx prisma validate
```

Useful route smoke checks:

```bash
curl -I http://localhost:3000/login
curl -I http://localhost:3000/register
curl -I http://localhost:3000/journal
curl -I http://localhost:3000/admin
```

Without a session, `/journal` and `/admin` should redirect to `/login`.

## Vercel Deployment

Set Vercel environment variables for production:

```bash
DATABASE_URL="postgres://..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5-mini"
```

Then deploy with the normal Vercel Next.js build. No Clerk variables are required.

If deployment fails with Prisma client type errors, confirm `npm install` is running and `postinstall` is not disabled. If deployment succeeds but registration/login fails, make sure the production database has been updated with the latest Prisma schema.

## Security Notes

- Do not commit `.env`; it is ignored.
- Sessions are HTTP-only cookies.
- Session tokens are stored hashed in the database.
- Passwords are hashed with bcrypt.
- The app currently does not implement email verification or password reset.
