@echo off
echo Fazendo upload dos arquivos essenciais...

REM Criar diretório na VPS
ssh root@207.180.254.250 "mkdir -p /opt/journalscope"

REM Upload dos arquivos principais um por vez
echo [1/8] Uploading Dockerfile...
scp Dockerfile root@207.180.254.250:/opt/journalscope/

echo [2/8] Uploading package.json...
scp package.json root@207.180.254.250:/opt/journalscope/

echo [3/8] Uploading package-lock.json...
scp package-lock.json root@207.180.254.250:/opt/journalscope/

echo [4/8] Uploading vite.config.js...
scp vite.config.js root@207.180.254.250:/opt/journalscope/

echo [5/8] Uploading nginx.conf...
scp nginx.conf root@207.180.254.250:/opt/journalscope/

echo [6/8] Uploading src folder...
scp -r src root@207.180.254.250:/opt/journalscope/

echo [7/8] Uploading public folder...
scp -r public root@207.180.254.250:/opt/journalscope/

echo [8/8] Uploading scripts folder...
scp -r scripts root@207.180.254.250:/opt/journalscope/

echo.
echo ✅ Upload concluído!
echo.
echo Agora execute na VPS:
echo ssh root@207.180.254.250
echo cd /opt/journalscope
echo docker build -t periodicos:5v .