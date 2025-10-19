@echo off
title Sistema SUB - Porta 3001
color 0A

echo.
echo ========================================
echo   Sistema de Gestao de Submissoes
echo   Iniciando na porta 3001
echo ========================================
echo.

cd sub

if not exist "node_modules" (
    echo [1/3] Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencias ja instaladas
)

if not exist "prisma\custom.db" (
    echo [2/3] Configurando banco de dados...
    call npm run db:generate
    call npm run db:push
    if errorlevel 1 (
        echo ERRO: Falha ao configurar banco
        pause
        exit /b 1
    )
) else (
    echo [OK] Banco de dados configurado
)

echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo  SERVIDOR RODANDO!
echo  Acesse: http://localhost:3001
echo.
echo  Pressione Ctrl+C para parar
echo ========================================
echo.

call npm run dev

