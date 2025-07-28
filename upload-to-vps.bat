@echo off
echo Fazendo upload dos arquivos essenciais para a VPS...

REM Criar diretório na VPS
ssh root@207.180.254.250 "mkdir -p /opt/journalscope"

REM Upload apenas dos arquivos essenciais (sem node_modules, .git, etc)
echo Uploading Dockerfile...
scp Dockerfile root@207.180.254.250:/opt/journalscope/

echo Uploading package files...
scp package.json root@207.180.254.250:/opt/journalscope/
scp package-lock.json root@207.180.254.250:/opt/journalscope/

echo Uploading source code...
scp -r src root@207.180.254.250:/opt/journalscope/
scp -r public root@207.180.254.250:/opt/journalscope/
scp -r scripts root@207.180.254.250:/opt/journalscope/

echo Uploading config files...
scp vite.config.js root@207.180.254.250:/opt/journalscope/
scp nginx.conf root@207.180.254.250:/opt/journalscope/
scp docker-compose.yml root@207.180.254.250:/opt/journalscope/

echo Upload concluído!
echo.
echo Próximos passos:
echo 1. ssh root@207.180.254.250
echo 2. cd /opt/journalscope
echo 3. docker build -t periodicos:4v .
echo 4. Atualizar via Portainer