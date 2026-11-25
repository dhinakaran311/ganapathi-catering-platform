# syntax=docker/dockerfile:1
#
# Production image for the Ganapathi catering site (Next.js, standalone output).
# Build context is this folder (frontend/).
#
#   docker build -t ganapathi \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... .
#   docker run -p 3000:10000 --env-file .env ganapathi
#
# NEXT_PUBLIC_* values are compiled into the browser JavaScript at build time,
# so they must be present during `docker build` (Render passes every service
# env var as a build arg automatically). Server-only secrets
# (SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, ...) are NOT declared here; they are
# only read at runtime, so they never end up in image layers.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── 1. Install dependencies (cached until package*.json changes) ────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. Build ────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_HOTEL_PHONE
ARG NEXT_PUBLIC_HOTEL_WHATSAPP
ARG NEXT_PUBLIC_HOTEL_NAME_EN
ARG NEXT_PUBLIC_HOTEL_NAME_TA
ARG NEXT_PUBLIC_GOOGLE_MAPS_EMBED
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_HOTEL_PHONE=$NEXT_PUBLIC_HOTEL_PHONE \
    NEXT_PUBLIC_HOTEL_WHATSAPP=$NEXT_PUBLIC_HOTEL_WHATSAPP \
    NEXT_PUBLIC_HOTEL_NAME_EN=$NEXT_PUBLIC_HOTEL_NAME_EN \
    NEXT_PUBLIC_HOTEL_NAME_TA=$NEXT_PUBLIC_HOTEL_NAME_TA \
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED=$NEXT_PUBLIC_GOOGLE_MAPS_EMBED \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

RUN npm run build

# ── 3. Runtime: only the standalone server + static files ───────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=10000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Invoice PDF fonts are read from disk at runtime (lib/invoice/pdf-document.tsx).
COPY --from=builder --chown=nextjs:nodejs /app/assets ./assets

USER nextjs
EXPOSE 10000
CMD ["node", "server.js"]
