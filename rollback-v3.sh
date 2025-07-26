#!/bin/bash

# Script de Rollback para JournalScope v3.0
echo "🔄 Iniciando rollback para JournalScope v3.0..."

# 1. Parar container atual
echo "🛑 Parando container atual..."
docker-compose down

# 2. Atualizar docker-compose para usar versão 3v
echo "📝 Atualizando configuração para v3.0..."
sed -i 's/periodicos:4v/periodicos:3v/g' docker-compose.yml

# 3. Subir container com versão anterior
echo "🔄 Iniciando container v3.0..."
docker-compose up -d

# 4. Verificar status
echo "✅ Verificando status do container..."
docker-compose ps

# 5. Mostrar logs
echo "📋 Últimos logs:"
docker-compose logs --tail=20

echo "🎉 Rollback concluído!"
echo "🌐 Aplicação disponível em:"
echo "   - https://periodicos.iaprojetos.com.br"
echo "   - https://periodicos.iatranscreve.com.br"
echo ""
echo "⚠️  LEMBRE-SE: Para voltar para v4.0, execute:"
echo "   sed -i 's/periodicos:3v/periodicos:4v/g' docker-compose.yml"
echo "   docker-compose up -d"