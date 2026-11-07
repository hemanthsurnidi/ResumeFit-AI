# ==============================================================
# ResumeFit AI — Frontend Dockerfile
# Multi-stage: Node build + Nginx serve
# ==============================================================

# --------------------------------------------------------------
# Stage 1: Build (Node 20 Alpine)
# --------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arg for API URL
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies first (layer caching)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm install --frozen-lockfile; \
    else npm install; fi

# Copy source and build
COPY . .
RUN npm run build

# --------------------------------------------------------------
# Stage 2: Serve (Nginx Alpine)
# --------------------------------------------------------------
FROM nginx:1.25-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
