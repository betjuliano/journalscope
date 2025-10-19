# Script de Deploy PowerShell - JournalScope v6 + SUB
Write-Host "🚀 Iniciando deploy do JournalScope v6 + SUB na VPS..." -ForegroundColor Green

# Informações da VPS
$VPS_HOST = "207.180.254.250"
$VPS_USER = "root"

Write-Host "📡 Conectando na VPS e fazendo deploy..." -ForegroundColor Yellow

# Comandos para executar na VPS
$commands = @"
cd /opt/journalscope
echo "📥 Fazendo pull do GitHub..."
git pull origin master
echo "🛑 Parando containers antigos..."
docker-compose -f docker-compose-simple.yml down 2>/dev/null || true
docker-compose -f docker-compose-production.yml down 2>/dev/null || true
echo "📦 Construindo imagem JournalScope v6..."
docker build -f Dockerfile.v6 -t periodicos:6v .
echo "📦 Construindo imagem SUB v1..."
cd sub && docker build -t sub-system:1v . && cd ..
echo "✅ Verificando imagens criadas..."
docker images | grep -E "(periodicos:6v|sub-system:1v)"
echo "🚀 Subindo containers em produção..."
docker-compose -f docker-compose-production.yml up -d
echo "⏳ Aguardando inicialização dos serviços..."
sleep 30
echo "🔍 Verificando status dos containers..."
docker-compose -f docker-compose-production.yml ps
echo "🏥 Executando health checks..."
curl -f http://localhost:8080 > /dev/null 2>&1 && echo "✅ JournalScope OK" || echo "❌ JournalScope ERRO"
curl -f http://localhost:8081/api/health > /dev/null 2>&1 && echo "✅ SUB OK" || echo "❌ SUB ERRO"
echo "📋 Logs recentes dos containers:"
docker logs --tail=10 journalscope-v6 2>/dev/null || echo "Container JournalScope ainda não criado"
docker logs --tail=10 sub-system-v1 2>/dev/null || echo "Container SUB ainda não criado"
echo "🎉 Deploy concluído!"
echo "🌐 Acessos:"
echo "- JournalScope: http://207.180.254.250:8080"
echo "- Sistema SUB: http://207.180.254.250:8081"
"@

# Executar comandos via SSH
try {
    Write-Host "Conectando via SSH..." -ForegroundColor Yellow
    $commands | ssh "$VPS_USER@$VPS_HOST"
    
    Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Acesse: https://portainer.escolabets.com.br"
    Write-Host "2. Login: iaprojetos / Admjuliano1@"
    Write-Host "3. Verifique se os containers estão rodando"
    Write-Host "4. Configure domínios se necessário:"
    Write-Host "   - periodicos.iaprojetos.com.br → porta 8080"
    Write-Host "   - sub.iaprojetos.com.br → porta 8081"
}
catch {
    Write-Host "❌ Erro durante o deploy: $_" -ForegroundColor Red
    Write-Host "Tente executar manualmente os comandos do arquivo deploy-commands-vps.sh"
}
