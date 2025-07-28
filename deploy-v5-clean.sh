#!/bin/bash

# Script de Deploy Limpo - JournalScope v5
echo "🚀 Iniciando deploy limpo do JournalScope v5 na VPS..."

# Configurações
VPS_HOST="207.180.254.250"
VPS_USER="root"
PROJECT_DIR="/opt/journalscope"
IMAGE_NAME="periodicos:5v"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📡 Conectando na VPS ${VPS_HOST}...${NC}"

# Executar comandos na VPS
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << EOF
set -e

echo -e "${YELLOW}📂 Navegando para o diretório do projeto...${NC}"
cd $PROJECT_DIR

echo -e "${YELLOW}📥 Fazendo pull das últimas mudanças...${NC}"
git pull origin master

echo -e "${YELLOW}🧹 Limpando imagens Docker antigas...${NC}"
# Remove imagens antigas do periodicos (mantém apenas as 2 mais recentes)
docker images | grep periodicos | tail -n +3 | awk '{print \$3}' | xargs -r docker rmi -f

echo -e "${YELLOW}🗑️ Limpando cache do Docker...${NC}"
docker system prune -f

echo -e "${YELLOW}📦 Construindo nova imagem $IMAGE_NAME...${NC}"
docker build -f Dockerfile.v5 -t $IMAGE_NAME .

echo -e "${GREEN}✅ Verificando imagem criada...${NC}"
docker images | grep periodicos

echo -e "${YELLOW}🔄 Parando containers antigos...${NC}"
docker-compose down || true

echo -e "${YELLOW}🚀 Subindo nova versão...${NC}"
docker-compose up -d

echo -e "${YELLOW}📊 Verificando status dos containers...${NC}"
docker-compose ps

echo -e "${GREEN}🎉 Deploy da versão 5 concluído com sucesso!${NC}"
echo -e "${BLUE}🌐 Aplicação disponível em:${NC}"
echo -e "   • https://periodicos.iaprojetos.com.br"
echo -e "   • https://periodicos.iatranscreve.com.br"

echo -e "${YELLOW}📋 Para verificar logs:${NC}"
echo -e "   docker-compose logs -f"

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
    echo -e "${BLUE}🔗 Links úteis:${NC}"
    echo -e "   • Portainer: https://portainer.iaprojetos.com.br"
    echo -e "   • Login: iaprojetos / Admjuliano1@"
else
    echo -e "${RED}❌ Erro durante o deploy!${NC}"
    exit 1
fi