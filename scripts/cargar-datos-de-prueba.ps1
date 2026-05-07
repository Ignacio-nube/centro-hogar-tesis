# ============================================================
# Centro Hogar — Cargar datos de prueba (seed.sql)
# ============================================================
# Ejecuta seed.sql en la base 'centro_hogar': crea 22 usuarios,
# 150 clientes, 120 productos y ~64.000 ventas con distribucion
# estacional realista (2024-2026).
#
# Pre-requisito: la base ya debe existir con su estructura.
#   Si todavia no existe, antes corre: .\crear-base-vacia.ps1
#
# Tiempo estimado: 5 a 15 minutos segun hardware.
#
# Uso:
#   .\cargar-datos-de-prueba.ps1
#   .\cargar-datos-de-prueba.ps1 -DbUser admin -DbPass "miclave"
# ============================================================

param(
  [string]$DbHost = "localhost",
  [int]   $DbPort = 3306,
  [string]$DbUser = "root",
  [string]$DbPass = "",
  [string]$DbName = "centro_hogar"
)

$ErrorActionPreference = "Stop"

$root    = Split-Path -Parent $PSScriptRoot
$seedSql = Join-Path $root "seed.sql"

if (-not (Test-Path $seedSql)) {
  Write-Error "No se encontro seed.sql en $root"
  exit 1
}

if (-not (Get-Command mysql.exe -ErrorAction SilentlyContinue)) {
  Write-Error "mysql.exe no esta en el PATH. Ver scripts/README.md."
  exit 1
}

$baseArgs = @("-h", $DbHost, "-P", "$DbPort", "-u", $DbUser, "--default-character-set=utf8mb4")
if ($DbPass) { $baseArgs += "-p$DbPass" }

Write-Host "=== Centro Hogar :: Cargar datos de prueba ===" -ForegroundColor Cyan
Write-Host "Host:   $DbHost`:$DbPort"
Write-Host "Base:   $DbName"
Write-Host ""

# 1. Verificar que la base existe
Write-Host "[1/3] Verificando que la base '$DbName' existe..." -NoNewline
$check = & mysql.exe @baseArgs -N -e "SHOW DATABASES LIKE '$DbName';" 2>$null
if (-not $check -or $check.Trim() -ne $DbName) {
  Write-Host " FALLO" -ForegroundColor Red
  Write-Error "La base '$DbName' no existe. Corre primero .\crear-base-vacia.ps1"
  exit 1
}
Write-Host " OK" -ForegroundColor Green

# 2. Aviso de tiempo
Write-Host "[2/3] El seed genera ~64.000 ventas. Puede tardar 5-15 minutos."
$confirm = Read-Host "Continuar? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
  Write-Host "Cancelado."
  exit 0
}

# 3. Ejecutar seed.sql contra la base seleccionada
Write-Host "[3/3] Ejecutando seed.sql (no cierres la terminal)..."
$start = Get-Date
Get-Content $seedSql -Raw | & mysql.exe @baseArgs $DbName
if ($LASTEXITCODE -ne 0) {
  Write-Error "El seed fallo. Revisa la estructura con .\crear-base-vacia.ps1 antes de reintentar."
  exit 1
}
$elapsed = (Get-Date) - $start

Write-Host ""
Write-Host "Datos de prueba cargados correctamente." -ForegroundColor Green
Write-Host ("Duracion: {0:mm} min {0:ss} seg" -f $elapsed)
Write-Host ""
Write-Host "Credenciales (todos con password 'test123'):"
Write-Host "  admin@centrohogar.com           - Administrador"
Write-Host "  elena.correa@centrohogar.com    - Encargado de stock"
Write-Host "  lucas.garcia@centrohogar.com    - Vendedor"
