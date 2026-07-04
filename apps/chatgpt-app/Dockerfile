FROM node:20-alpine AS deps

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
COPY packages/db/package.json ./packages/db/package.json
COPY packages/db/prisma ./packages/db/prisma
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/config/package.json ./packages/config/package.json

RUN node .yarn/releases/yarn-4.cjs install --immutable

FROM node:20-alpine AS builder

WORKDIR /app
ENV DATABASE_URL=postgresql://inner_avatar:inner_avatar_dev@localhost:5432/inner_avatar?sslmode=disable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarnrc ./.yarnrc
COPY --from=deps /app/.yarnrc.yml ./
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock
COPY --from=deps /app/prisma.config.ts ./prisma.config.ts

COPY apps/chatgpt-app ./apps/chatgpt-app
COPY packages/ai ./packages/ai
COPY packages/auth ./packages/auth
COPY packages/db ./packages/db
COPY packages/types ./packages/types
COPY packages/ui ./packages/ui
COPY packages/config ./packages/config

RUN node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app build

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/apps/chatgpt-app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/chatgpt-app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002

CMD ["node", "--import", "tsx", "dist/server.js"]
