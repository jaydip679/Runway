# ----------------------------------------------------
# Stage 1: Dependencies and Builder
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies and compile Prisma client
RUN npm ci && npx prisma generate

# Prune development dependencies to retain only production assets
RUN npm prune --omit=dev

# ----------------------------------------------------
# Stage 2: Production Runtime Image
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime libraries: openssl for Prisma, dumb-init for PID 1 signal propagation
RUN apk add --no-cache openssl libc6-compat dumb-init

ENV NODE_ENV=production

# Security: Run as dedicated non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -u 1001 -G nodejs -s /bin/sh -D appuser

# Copy production node_modules (including compiled Prisma engines) from builder
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./

# Copy application source
COPY --chown=appuser:nodejs ./src ./src

# Create local storage directories with non-root ownership
RUN mkdir -p uploads src/storage/temp/exports && \
    chown -R appuser:nodejs uploads src/storage

USER appuser

EXPOSE 4000

# Use dumb-init as init process to handle SIGTERM/SIGINT graceful shutdowns cleanly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "src/server.js"]
