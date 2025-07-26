#!/bin/bash

# Script de Deploy para JournalScope v4.0
echo "🚀 Iniciando deploy do JournalScope v4.0..."

# 1. Build da imagem Docker
echo "📦 Construindo imagem Docker..."
docker build -t periodicos:4v .

# 2. Parar e remover container anterior (se existir)
echo "🛑 Parando container anterior..."
docker-compose down

# 3. Subir novo container
echo "🔄 Iniciando novo container..."
docker-compose up -d

# 4. Verificar status
echo "✅ Verificando status do container..."
docker-compose ps

# 5. Mostrar logs
echo "📋 Últimos logs:"
docker-compose logs --tail=20

echo "🎉 Deploy concluído!"
echo "🌐 Aplicação disponível em:"
echo "   - https://periodicos.iaprojetos.com.br"
echo "   - https://periodicos.iatranscreve.com.br"