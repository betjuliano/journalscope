@echo off
echo ========================================
echo   Deploy JournalScope v4.0 para VPS
echo ========================================
echo.

echo 1. Conectando na VPS e configurando projeto...
ssh root@207.180.254.250 "cd /opt && rm -rf journalscope && git clone https://github.com/julianoalvescode/journalscope.git && cd journalscope"

echo.
echo 2. Agora execute manualmente na VPS:
echo    ssh root@207.180.254.250
echo    cd /opt/journalscope  
echo    docker build -t periodicos:4v .
echo.
echo 3. Depois acesse o Portainer:
echo    https://portainer.escolabets.com.br
echo    Login: iaprojetos / Admjuliano1@
echo    Atualize a stack para usar: periodicos:4v
echo.
pause