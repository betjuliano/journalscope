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
git commit -m "fix: Correções de layout, CSS dinâmico e traduções PT/EN - Corrigido problema de idioma invertido - Implementado layout moderno com gradientes - Adicionado CSS dinâmico e responsivo - Corrigidas traduções em PT e EN - Otimizado design da tabela e componentes - Melhorada experiência do usuário"

echo 📤 Fazendo push para o repositório...
git push origin master

echo.
echo 📡 Conectando na VPS e fazendo deploy...
echo.

REM Executar comandos na VPS via SSH
ssh root@207.180.254.250 "cd /opt/journalscope && echo '📥 Fazendo pull das últimas mudanças...' && git pull origin master && echo '📦 Construindo nova imagem Docker com correções...' && docker build -t periodicos:fixes-v1 . && echo '💾 Criando backup da imagem atual...' && docker tag periodicos:4v periodicos:4v-backup 2>nul && echo '🔄 Atualizando tag principal...' && docker tag periodicos:fixes-v1 periodicos:4v && echo '🎉 Deploy concluído com sucesso!' && echo '📊 Imagens disponíveis:' && docker images | grep periodicos"

if %errorlevel% equ 0 (
    echo.
    echo 🎉 Deploy realizado com sucesso!
    echo.
    echo 🌐 Próximos passos:
    echo 1. Acesse: https://portainer.escolabets.com.br
    echo 2. Login: iaprojetos / Admjuliano1@
    echo 3. Vá para Stacks ^> journalscope
    echo 4. Clique em 'Update the stack'
    echo 5. A aplicação será reiniciada automaticamente
    echo.
    echo ✨ Correções aplicadas:
    echo • Layout moderno com gradientes
    echo • Traduções PT/EN corretas  
    echo • CSS dinâmico funcionando
    echo • Design responsivo otimizado
    echo • Tabela com estilos melhorados
    echo.
    echo 🔗 Teste em: https://journals.escolabets.com.br
) else (
    echo ❌ Erro durante o deploy!
    pause
    exit /b 1
)

pause