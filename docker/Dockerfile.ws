# Use a lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy root config and lock files first (better caching)
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy monorepo packages and ws-backend app
COPY ./packages ./packages
COPY ./apps/ws-backend ./apps/ws-backend

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies for the workspace
RUN pnpm install --frozen-lockfile

# Build the WebSocket backend
RUN pnpm --filter ws-backend run build

# Generate Prisma client
RUN pnpm --filter @repo/db exec prisma generate

# Expose the port WebSocket server runs on (adjust if needed)
EXPOSE 8081

# Start the WebSocket backend
CMD ["pnpm", "--filter", "ws-backend", "start"]

