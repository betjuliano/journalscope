@echo off
echo 🧹 Limpando cache e fazendo novo build...
echo.

echo 📁 Removendo pasta dist...
if exist "dist" rmdir /s /q "dist"

echo 📁 Removendo pasta node_modules/.vite...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"

echo 🔄 Fazendo novo build...
npm run build

if %errorlevel% equ 0 (
    echo.
    echo ✅ Build concluído com sucesso!
    echo.
    echo 📋 Próximos passos:
    echo 1. Fazer commit das mudanças
    echo 2. Deploy na VPS
    echo.
    echo 🚀 Executar deploy? (S/N)
    set /p deploy="Digite S para fazer deploy: "
    
    if /i "%deploy%"=="S" (
        echo.
        echo 📝 Fazendo commit...
        git add .
        git commit -m "fix: Corrigido Service Worker e CSS - Desabilitado SW para evitar cache - CSS com !important para garantir aplicação - Removidos erros de cache"
        
        echo 📤 Fazendo push...
        git push origin master
        
        echo 🏗️ Fazendo build na VPS...
        ssh root@207.180.254.250 "cd /opt/journalscope && git pull origin master && docker build --no-cache -f Dockerfile.v5 -t periodicos:5v-cache-fix ."
        
        echo 🔄 Atualizando serviço...
        ssh root@207.180.254.250 "docker service update --image periodicos:5v-cache-fix journalscope_journalscope-multidominio"
        
        echo.
        echo 🎉 Deploy concluído!
        echo 🌐 Teste a aplicação agora
    )
) else (
    echo ❌ Erro no build!
    pause
)

pause