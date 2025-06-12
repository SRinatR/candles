# Используем официальный образ Node.js как базовый
FROM node:20-alpine AS base

# Устанавливаем зависимости только при изменении package файлов
FROM base AS deps
# Проверка для уменьшения размера образа
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./
# Устанавливаем зависимости
RUN npm ci

# Этап сборки приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Копируем переменные окружения для сборки если нужны
# COPY .env.production .env

# Отключаем телеметрию Next.js при сборке
ENV NEXT_TELEMETRY_DISABLED=1

# Строим приложение
RUN npm run build

# Продакшн образ, копируем только необходимые файлы
FROM base AS runner
WORKDIR /app

# Создаем группу и пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы из стадии сборки
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Создаем директорию для Prisma и копируем схему
COPY --from=builder /app/prisma ./prisma

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app

# Используем непривилегированного пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Команда для запуска приложения
CMD ["node", "server.js"]