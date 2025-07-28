#!/bin/bash

# Deploy Simples - JournalScope v5
echo "🚀 Deploy JournalScope v5 - VPS 207.180.254.250"

ssh root@207.180.254.250 << 'EOF'
cd /opt/journalscope
git pull origin master
docker build -f Dockerfile.v5 -t periodicos:5v .
docker-compose down
docker-compose up -d
docker-compose ps
echo "✅ Deploy v5 concluído!"
EOF