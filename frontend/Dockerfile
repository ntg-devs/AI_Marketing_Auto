# STAGE 1: Cài đặt dependencies
FROM node:18-alpine AS deps
WORKDIR /app
# Copy package.json và lock file để tận dụng Docker cache
COPY package.json package-lock.json* ./
RUN npm install

# STAGE 2: Build source code
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Biến môi trường lúc build (nếu cần)
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# STAGE 3: Runner (Giai đoạn chạy thực tế)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Tạo user để bảo mật hơn (không dùng root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy các file cần thiết từ stage builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# Chạy Next.js ở chế độ production
CMD ["npm", "start"]