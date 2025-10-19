# Script PowerShell para iniciar o Sistema SUB
# Compatível com PowerShell 5.1+ e PowerShell Core

param(
    [switch]$Force
)

# Configurações
$Host.UI.RawUI.WindowTitle = "Sistema SUB - Porta 3001"
$ErrorActionPreference = "Stop"

# Cores
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }

# Banner
Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Sistema de Gestão de Submissões" -ForegroundColor Blue
Write-Host "  Iniciando na porta 3001" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Navegar para pasta sub
if (-not (Test-Path "sub")) {
    if (Test-Path ".\sub") {
        Set-Location ".\sub"
    } else {
        Write-Error "Pasta 'sub' não encontrada!"
        Write-Host "Execute este script na pasta raiz do projeto journalscope"
        exit 1
    }
} else {
    Set-Location "sub"
}

try {
    # Verificar se node_modules existe
    if (-not (Test-Path "node_modules") -or $Force) {
        Write-Info "[1/3] Instalando dependências..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao instalar dependências"
        }
        Write-Success "✅ Dependências instaladas"
    } else {
        Write-Success "✅ Dependências já instaladas"
    }

    # Verificar se banco existe
    if (-not (Test-Path "db\custom.db") -or $Force) {
        Write-Info "[2/3] Configurando banco de dados..."
        npm run db:generate
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao gerar cliente Prisma"
        }
        npm run db:push
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao criar banco de dados"
        }
        Write-Success "✅ Banco de dados configurado"
    } else {
        Write-Success "✅ Banco de dados já configurado"
    }

    Write-Info "[3/3] Iniciando servidor..."
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  🚀 SERVIDOR INICIANDO!" -ForegroundColor Green
    Write-Host "  📍 Acesse: http://localhost:3001" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ⏹️  Pressione Ctrl+C para parar" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""

    # Iniciar servidor
    npm run dev

} catch {
    Write-Error "❌ ERRO: $($_.Exception.Message)"
    Write-Host ""
    Write-Warning "Soluções comuns:"
    Write-Host "1. Verifique se Node.js está instalado: node --version"
    Write-Host "2. Tente executar com -Force: .\start-sub.ps1 -Force"
    Write-Host "3. Execute manualmente:"
    Write-Host "   cd sub"
    Write-Host "   npm install"
    Write-Host "   npm run db:push"
    Write-Host "   npm run dev"
    Write-Host ""
    Write-Host "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

