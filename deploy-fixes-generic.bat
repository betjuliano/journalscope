@echo off
echo 🚀 Iniciando deploy das correções do JournalScope...
echo.

echo 📋 Resumo das correções aplicadas:
echo ✅ Problema de idioma invertido corrigido
echo ✅ Layout moderno implementado  
echo ✅ CSS dinâmico funcionando
echo ✅ Traduções PT/EN corretas
echo ✅ Design responsivo otimizado
echo.

REM Verificar se o build foi feito
if not exist "dist" (
    echo ❌ Pasta 'dist' não encontrada!
    echo Execute: npm run build
    pause
    exit /b 1
)

echo ✅ Build encontrado, continuando...
echo.

echo 📝 Fazendo commit das mudanças...
git add .
git commit -m "fix: Correções de layout, CSS dinâmico e traduções PT/EN"

echo 📤 Fazendo push para o repositório...
git push origin master

echo.
echo 📡 Agora você precisa fazer o deploy na sua VPS
echo.
echo 🔧 Comandos para executar na VPS:
echo.
echo cd /caminho/do/seu/projeto
echo git pull origin master
echo docker build -t journalscope:latest .
echo.
echo 💡 Ou use seu script de deploy existente:
echo ./deploy-vps.sh
echo.

echo 🎉 Código atualizado no repositório!
echo.
echo ✨ Correções aplicadas:
echo • Layout moderno com gradientes
echo • Traduções PT/EN corretas  
echo • CSS dinâmico funcionando
echo • Design responsivo otimizado
echo • Tabela com estilos melhorados
echo.

pause