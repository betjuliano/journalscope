#!/bin/bash

# Script de Deploy com senha - JournalScope v6 + SUB
echo "🚀 Iniciando deploy do JournalScope v6 + SUB na VPS..."

# Informações da VPS
VPS_HOST="207.180.254.250"
VPS_USER="root"
VPS_PASS="Admjuliano.1"

echo "📡 Conectando na VPS e fazendo deploy..."

# Usar sshpass para automatizar a senha
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
# Navegar para o diretório do projeto
cd /opt/journalscope

# Fazer pull das últimas mudanças
echo "📥 Fazendo pull do GitHub..."
git pull origin master

# Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose -f docker-compose-simple.yml down 2>/dev/null || true
docker-compose -f docker-compose-production.yml down 2>/dev/null || true

# Build da imagem principal (JournalScope)
echo "📦 Construindo imagem JournalScope v6..."
docker build -f Dockerfile.v6 -t periodicos:6v .

# Build da imagem do SUB
echo "📦 Construindo imagem SUB v1..."
cd sub
docker build -t sub-system:1v .
cd ..

# Verificar se as imagens foram criadas
echo "✅ Verificando imagens criadas..."
docker images | grep -E "(periodicos:6v|sub-system:1v)"

# Subir nova versão em produção
echo "🚀 Subindo containers em produção..."
docker-compose -f docker-compose-production.yml up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 30

# Verificar status dos containers
echo "🔍 Verificando status dos containers..."
docker-compose -f docker-compose-production.yml ps

# Health check
echo "🏥 Executando health checks..."
echo "JournalScope (porta 8080):"
curl -f http://localhost:8080 > /dev/null 2>&1 && echo "✅ JournalScope OK" || echo "❌ JournalScope ERRO"

echo "Sistema SUB (porta 8081):"
curl -f http://localhost:8081/api/health > /dev/null 2>&1 && echo "✅ SUB OK" || echo "❌ SUB ERRO"

# Mostrar logs recentes
echo "📋 Logs recentes dos containers:"
echo "=== JournalScope ==="
docker logs --tail=10 journalscope-v6 2>/dev/null || echo "Container ainda não criado"

echo "=== Sistema SUB ==="
docker logs --tail=10 sub-system-v1 2>/dev/null || echo "Container ainda não criado"

echo "🎉 Deploy concluído!"
echo ""
echo "🌐 Acessos:"
echo "- JournalScope: http://207.180.254.250:8080"
echo "- Sistema SUB: http://207.180.254.250:8081"
echo ""
echo "📊 Para monitorar:"
echo "docker-compose -f docker-compose-production.yml logs -f"
EOF

echo "🌐 Próximos passos:"
echo "1. Acesse: https://portainer.escolabets.com.br"
echo "2. Login: iaprojetos / Admjuliano1@"
echo "3. Verifique se os containers estão rodando"
echo "4. Configure domínios se necessário:"
echo "   - periodicos.iaprojetos.com.br → porta 8080"
echo "   - sub.iaprojetos.com.br → porta 8081"
