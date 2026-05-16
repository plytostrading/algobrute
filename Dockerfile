# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Cloud Run deployment image for the AlgoBrute Next.js 15 frontend.
#
# Multi-stage build:
#   - deps:    install npm dependencies
#   - builder: copy source and run `next build` (uses output: 'standalone')
#   - runner:  minimal node:20-alpine runtime serving the standalone bundle
#
# Build:
#   docker build -t algobrute-frontend .
#
# Run (local sanity check):
#   docker run --rm -p 8080:8080 \
#     -e NEXT_PUBLIC_API_URL=http://34.121.58.22:8000 \
#     algobrute-frontend
#
# Cloud Run env:
#   NEXT_PUBLIC_API_URL  -- backend engine VM URL
#   PORT                 -- Cloud Run injects this; we honor $PORT, default 8080
# ---------------------------------------------------------------------------

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
# Build-time env so `next build` can inline NEXT_PUBLIC_* if any.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone build output, static assets, and public dir
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

# server.js is emitted by Next.js standalone output and reads PORT/HOSTNAME.
CMD ["node", "server.js"]
