# Sistema SUB - Dockerfile para Produção
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação Next.js
RUN npm run build

# Estágio de produção
FROM node:18-alpine AS runner

WORKDIR /app

# Instalar dependências de runtime
RUN apk add --no-cache libc6-compat

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copiar server.ts e dependências
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/node_modules ./node_modules

# Criar diretório para banco de dados
RUN mkdir -p /app/prisma/db && chown -R nextjs:nodejs /app

USER nextjs

# Expor porta
EXPOSE 3001

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:./prisma/db/custom.db"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Comando de inicialização
CMD ["node", "server.ts"]
