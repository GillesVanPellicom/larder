# ==========================================
# Stage 1: Build Frontend and Backend
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for fast, native pnpm support
RUN corepack enable && corepack prepare pnpm@latest --activate

# Cache dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and configurations
COPY . .

# Build Vite client (-> dist/) and Node backend bundle (-> dist-server/)
RUN pnpm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Enable pnpm for installing production-only dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install wget for container healthchecks
RUN apk add --no-cache wget

# Copy package descriptors
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Set default production environment variables
ENV NODE_ENV=production \
    PORT=3000

# Run as non-root node user for container security
USER node

EXPOSE 3000

# Docker healthcheck querying the backend health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server (which serves API at /api and static client at /)
CMD ["node", "dist-server/index.js"]
