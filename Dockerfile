FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --omit=dev && npm install tsx

COPY server ./server
COPY src/data ./src/data
COPY src/types ./src/types

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

RUN mkdir -p /app/uploads/profiles /app/uploads/galeri /app/uploads/berita /app/public/uploads && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npx", "tsx", "server/index.ts"]
