FROM node:20-bookworm-slim AS deps

WORKDIR /app
ENV DATABASE_URL=postgresql://inner_avatar:inner_avatar_dev@localhost:5432/inner_avatar?sslmode=disable

COPY package.json yarn.lock .yarnrc .yarnrc.yml ./
COPY .yarn ./.yarn
COPY prisma.config.ts ./prisma.config.ts
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/chatgpt-app/package.json ./apps/chatgpt-app/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/billing/package.json ./packages/billing/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/db/prisma ./packages/db/prisma
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN node .yarn/releases/yarn-4.cjs install --immutable

FROM node:20-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://inner_avatar:inner_avatar_dev@localhost:5432/inner_avatar?sslmode=disable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.yarnrc ./.yarnrc
COPY --from=deps /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock
COPY --from=deps /app/prisma.config.ts ./prisma.config.ts
COPY packages ./packages
COPY apps/web ./apps/web

RUN node .yarn/releases/yarn-4.cjs --cwd apps/web build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
