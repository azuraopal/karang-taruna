# ==========================================
# Multi-stage Dockerfile untuk Karang Taruna Margabakti 07
# Siap untuk Dokploy / Coolify / VPS Docker
# ==========================================

# Tahap 1: Build Frontend (Vite + React + Tailwind)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Tahap 2: Production Server (Express + PostgreSQL + Static SPA)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies yang dibutuhkan di runtime
COPY package*.json ./
RUN npm install --omit=dev && npm install tsx

# Salin source server dan data inisial
COPY server ./server
COPY src/data ./src/data
COPY src/types ./src/types

# Salin aset frontend hasil build dari builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

# Jalankan server Express (melayani REST API dan SPA frontend)
CMD ["npx", "tsx", "server/index.ts"]
