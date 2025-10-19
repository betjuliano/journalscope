#!/bin/bash

# Script de Deploy Final - JournalScope v7 + SUB + Redis
echo "🚀 Iniciando deploy do JournalScope v7 + SUB + Redis na VPS..."

# Informações da VPS
VPS_HOST="207.180.254.250"
VPS_USER="root"
PROJECT_DIR="/opt/journalscope"

echo "📡 Conectando na VPS e fazendo deploy..."

ssh $VPS_USER@$VPS_HOST << 'EOF'
# Navegar para o diretório do projeto
cd /opt/journalscope

# Fazer pull das últimas mudanças
echo "📥 Fazendo pull do GitHub..."
git pull origin master

# Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose -f docker-compose-simple.yml down 2>/dev/null || true
docker-compose -f docker-compose-production.yml down 2>/dev/null || true
docker-compose -f docker-compose-domain.yml down 2>/dev/null || true

# Limpar containers e imagens antigas
echo "🧹 Limpando containers antigos..."
docker container prune -f
docker image prune -f

# Build da imagem principal (JournalScope v7)
echo "📦 Construindo imagem JournalScope v7..."
docker build -f Dockerfile.v6 -t periodicos:6v .

# Build da imagem do SUB com Redis
echo "📦 Construindo imagem SUB v2 (com Redis)..."
cd sub
docker build -t sub-system:2v .
cd ..

# Verificar se as imagens foram criadas
echo "✅ Verificando imagens criadas..."
docker images | grep -E "(periodicos:6v|sub-system:2v)"

# Subir Redis primeiro
echo "🔴 Iniciando Redis..."
docker run -d \
  --name journalscope-redis \
  --network journalscope-network \
  -p 6379:6379 \
  -v redis-data:/data \
  --restart unless-stopped \
  redis:7-alpine redis-server --appendonly yes --requirepass "JournalScope2025!" || echo "Redis já rodando"

# Aguardar Redis inicializar
echo "⏳ Aguardando Redis inicializar..."
sleep 10

# Subir nova versão em produção
echo "🚀 Subindo containers em produção..."
docker-compose -f docker-compose-production.yml up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 45

# Verificar status dos containers
echo "🔍 Verificando status dos containers..."
docker-compose -f docker-compose-production.yml ps

# Health check detalhado
echo "🏥 Executando health checks..."

echo "Redis:"
docker exec journalscope-redis redis-cli --raw incr ping 2>/dev/null && echo "✅ Redis OK" || echo "❌ Redis ERRO"

echo "JournalScope (porta 8080):"
curl -f http://localhost:8080 > /dev/null 2>&1 && echo "✅ JournalScope OK" || echo "❌ JournalScope ERRO"

echo "Sistema SUB (porta 8081):"
curl -f http://localhost:8081/api/health > /dev/null 2>&1 && echo "✅ SUB OK" || echo "❌ SUB ERRO"

echo "Cache Redis (via SUB):"
curl -f http://localhost:8081/api/cache?key=test > /dev/null 2>&1 && echo "✅ Cache API OK" || echo "❌ Cache API ERRO"

# Mostrar logs recentes
echo "📋 Logs recentes dos containers:"
echo "=== Redis ==="
docker logs --tail=5 journalscope-redis

echo "=== JournalScope ==="
docker logs --tail=10 journalscope-v6

echo "=== Sistema SUB ==="
docker logs --tail=10 sub-system-v1

# Verificar uso de recursos
echo "📊 Uso de recursos:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo "🎉 Deploy concluído!"
echo ""
echo "🌐 Acessos:"
echo "- JournalScope: http://207.180.254.250:8080"
echo "- Sistema SUB: http://207.180.254.250:8081"
echo "- Redis: 207.180.254.250:6379"
echo ""
echo "📊 Para monitorar:"
echo "docker-compose -f docker-compose-production.yml logs -f"
echo ""
echo "🔧 Para configurar domínios:"
echo "1. Use docker-compose-domain.yml com Traefik"
echo "2. Configure DNS para:"
echo "   - periodicos.iaprojetos.com.br → 207.180.254.250"
echo "   - sub.iaprojetos.com.br → 207.180.254.250"
EOF

echo "🌐 Próximos passos para domínios:"
echo "1. Configure DNS nos domínios:"
echo "   - periodicos.iaprojetos.com.br → 207.180.254.250"
echo "   - sub.iaprojetos.com.br → 207.180.254.250"
echo ""
echo "2. No Portainer (https://portainer.escolabets.com.br):"
echo "   - Login: iaprojetos / Admjuliano1@"
echo "   - Configure Traefik labels ou use nginx proxy"
echo ""
echo "3. Para SSL automático com Traefik:"
echo "   docker-compose -f docker-compose-domain.yml up -d"
