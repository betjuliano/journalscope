#!/bin/bash

# Script de Deploy para VPS - JournalScope v4.0
echo "🚀 Iniciando deploy do JournalScope v4.0 na VPS..."

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

# Build da nova imagem
echo "📦 Construindo imagem Docker periodicos:4v..."
docker build -t periodicos:4v .

# Verificar se a imagem foi criada
echo "✅ Verificando imagem criada..."
docker images | grep periodicos

echo "🎉 Build concluído! Agora atualize via Portainer."
EOF

echo "🌐 Próximos passos:"
echo "1. Acesse: https://portainer.escolabets.com.br"
echo "2. Login: iaprojetos / Admjuliano1@"
echo "3. Atualize a stack para usar periodicos:4v"