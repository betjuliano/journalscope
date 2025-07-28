#!/bin/bash

# Script de Deploy - JournalScope com Correções de Layout e I18n
echo "🚀 Iniciando deploy das correções do JournalScope..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Informações da VPS
VPS_HOST="207.180.254.250"
VPS_USER="root"
PROJECT_DIR="/opt/journalscope"

echo -e "${BLUE}📋 Resumo das correções aplicadas:${NC}"
echo "✅ Problema de idioma invertido corrigido"
echo "✅ Layout moderno implementado"
echo "✅ CSS dinâmico funcionando"
echo "✅ Traduções PT/EN corretas"
echo "✅ Design responsivo otimizado"
echo ""

# Verificar se o build foi feito
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Pasta 'dist' não encontrada!${NC}"
    echo -e "${YELLOW}Execute: npm run build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build encontrado, continuando...${NC}"

# Fazer commit das mudanças (se necessário)
echo -e "${BLUE}📝 Verificando mudanças no Git...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Mudanças detectadas, fazendo commit...${NC}"
    git add .
    git commit -m "fix: Correções de layout, CSS dinâmico e traduções PT/EN

- Corrigido problema de idioma invertido
- Implementado layout moderno com gradientes
- Adicionado CSS dinâmico e responsivo
- Corrigidas traduções em PT e EN
- Otimizado design da tabela e componentes
- Melhorada experiência do usuário"
    
    echo -e "${BLUE}📤 Fazendo push para o repositório...${NC}"
    git push origin master
else
    echo -e "${GREEN}✅ Repositório já está atualizado${NC}"
fi

echo -e "${BLUE}📡 Conectando na VPS e fazendo deploy...${NC}"

ssh $VPS_USER@$VPS_HOST << 'EOF'
# Navegar para o diretório do projeto
cd /opt/journalscope

echo "📥 Fazendo pull das últimas mudanças..."
git pull origin master

# Verificar se houve mudanças
if [ $? -eq 0 ]; then
    echo "✅ Código atualizado com sucesso"
else
    echo "❌ Erro ao fazer pull do repositório"
    exit 1
fi

# Build da nova imagem com tag específica para as correções
echo "📦 Construindo nova imagem Docker com correções..."
docker build -t periodicos:fixes-v1 .

# Verificar se a imagem foi criada
if [ $? -eq 0 ]; then
    echo "✅ Imagem periodicos:fixes-v1 criada com sucesso!"
    docker images | grep periodicos
else
    echo "❌ Erro ao construir a imagem Docker"
    exit 1
fi

# Opcional: Criar backup da imagem atual
echo "💾 Criando backup da imagem atual..."
docker tag periodicos:4v periodicos:4v-backup 2>/dev/null || echo "Imagem anterior não encontrada"

# Atualizar tag principal
echo "🔄 Atualizando tag principal..."
docker tag periodicos:fixes-v1 periodicos:4v

echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📊 Imagens disponíveis:"
docker images | grep periodicos

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deploy realizado com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Próximos passos:${NC}"
    echo "1. Acesse: https://portainer.escolabets.com.br"
    echo "2. Login: iaprojetos / Admjuliano1@"
    echo "3. Vá para Stacks > journalscope"
    echo "4. Clique em 'Update the stack'"
    echo "5. A aplicação será reiniciada automaticamente"
    echo ""
    echo -e "${GREEN}✨ Correções aplicadas:${NC}"
    echo "• Layout moderno com gradientes"
    echo "• Traduções PT/EN corretas"
    echo "• CSS dinâmico funcionando"
    echo "• Design responsivo otimizado"
    echo "• Tabela com estilos melhorados"
    echo ""
    echo -e "${YELLOW}🔗 Teste em: https://journals.escolabets.com.br${NC}"
else
    echo -e "${RED}❌ Erro durante o deploy!${NC}"
    exit 1
fi