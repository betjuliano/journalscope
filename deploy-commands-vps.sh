#!/bin/bash

# Comandos para executar diretamente na VPS
# Copie e cole estes comandos no terminal da VPS após fazer SSH

echo "🚀 Deploy JournalScope v6 + SUB - Comandos para VPS"
echo "Execute estes comandos após conectar na VPS via SSH"
echo ""

cat << 'COMMANDS'
# 1. Navegar para o diretório do projeto
cd /opt/journalscope

# 2. Fazer pull das últimas mudanças
echo "📥 Fazendo pull do GitHub..."
git pull origin master

# 3. Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose -f docker-compose-simple.yml down 2>/dev/null || true
docker-compose -f docker-compose-production.yml down 2>/dev/null || true

# 4. Build da imagem principal (JournalScope)
echo "📦 Construindo imagem JournalScope v6..."
docker build -f Dockerfile.v6 -t periodicos:6v .

# 5. Build da imagem do SUB
echo "📦 Construindo imagem SUB v1..."
cd sub
docker build -t sub-system:1v .
cd ..

# 6. Verificar se as imagens foram criadas
echo "✅ Verificando imagens criadas..."
docker images | grep -E "(periodicos:6v|sub-system:1v)"

# 7. Subir nova versão em produção
echo "🚀 Subindo containers em produção..."
docker-compose -f docker-compose-production.yml up -d

# 8. Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 30

# 9. Verificar status dos containers
echo "🔍 Verificando status dos containers..."
docker-compose -f docker-compose-production.yml ps

# 10. Health check
echo "🏥 Executando health checks..."
echo "JournalScope (porta 8080):"
curl -f http://localhost:8080 > /dev/null 2>&1 && echo "✅ JournalScope OK" || echo "❌ JournalScope ERRO"

echo "Sistema SUB (porta 8081):"
curl -f http://localhost:8081/api/health > /dev/null 2>&1 && echo "✅ SUB OK" || echo "❌ SUB ERRO"

# 11. Mostrar logs recentes
echo "📋 Logs recentes dos containers:"
echo "=== JournalScope ==="
docker logs --tail=10 journalscope-v6

echo "=== Sistema SUB ==="
docker logs --tail=10 sub-system-v1

echo "🎉 Deploy concluído!"
echo ""
echo "🌐 Acessos:"
echo "- JournalScope: http://207.180.254.250:8080"
echo "- Sistema SUB: http://207.180.254.250:8081"
echo ""
echo "📊 Para monitorar:"
echo "docker-compose -f docker-compose-production.yml logs -f"
COMMANDS
