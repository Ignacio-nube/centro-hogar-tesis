# ============================================================
# Centro Hogar — Instalar base de datos
# ============================================================
# Hace los dos pasos en orden:
#   1. Aplica database.sql -> crea la base 'centro_hogar' con
#      todas las tablas, vistas y triggers.
#   2. Aplica seed.sql -> carga 22 usuarios, 150 clientes, 120
#      productos y ~64.000 ventas con distribucion estacional.
#
# Tiempo estimado total: 5-15 minutos (el seed es lo lento).
#
# Pre-requisito: mysql.exe en el PATH.
#   XAMPP:  C:\xampp\mysql\bin
#   WAMP:   C:\wamp64\bin\mysql\mysqlX.Y.Z\bin
#
#   setx PATH "$env:PATH;C:\xampp\mysql\bin"
#   (cerrar y reabrir la terminal)
#
# Uso:
#   .\instalar-base-de-datos.ps1
#   .\instalar-base-de-datos.ps1 -DbUser admin -DbPass "miclave"
#   .\instalar-base-de-datos.ps1 -SoloEstructura     # sin datos de prueba
# ============================================================

param(
  [string]$DbHost = "localhost",
  [int]   $DbPort = 3306,
  [string]$DbUser = "root",
  [string]$DbPass = "",
  [string]$DbName = "centro_hogar",
  [switch]$SoloEstructura
)

$ErrorActionPreference = "Stop"

$root      = Split-Path -Parent $PSScriptRoot
$schemaSql = Join-Path $root "database.sql"
$seedSql   = Join-Path $root "seed.sql"

if (-not (Test-Path $schemaSql)) {
  Write-Error "No se encontro database.sql en $root"
  exit 1
}
if (-not $SoloEstructura -and -not (Test-Path $seedSql)) {
  Write-Error "No se encontro seed.sql en $root"
  exit 1
}

if (-not (Get-Command mysql.exe -ErrorAction SilentlyContinue)) {
  Write-Warning "mysql.exe no esta en el PATH."
  Write-Host "  XAMPP: agrega C:\xampp\mysql\bin al PATH y reabri la terminal."
  exit 1
}

$baseArgs = @("-h", $DbHost, "-P", "$DbPort", "-u", $DbUser, "--default-character-set=utf8mb4")
if ($DbPass) { $baseArgs += "-p$DbPass" }

Write-Host "=== Centro Hogar :: Instalar base de datos ===" -ForegroundColor Cyan
Write-Host "Host:    $DbHost`:$DbPort"
Write-Host "Usuario: $DbUser"
Write-Host "Base:    $DbName"
Write-Host "Modo:    $(if ($SoloEstructura) { 'Solo estructura (sin datos)' } else { 'Estructura + datos de prueba' })"
Write-Host ""

# 1. Verificar conexion
Write-Host "[1/3] Verificando conexion a MySQL..." -NoNewline
try {
  & mysql.exe @baseArgs -e "SELECT VERSION();" *>$null
  if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
  Write-Host " OK" -ForegroundColor Green
} catch {
  Write-Host " FALLO" -ForegroundColor Red
  Write-Error "No se pudo conectar al servidor MySQL. Revisa host/usuario/contrasena."
  exit 1
}

# 2. Aplicar el esquema
Write-Host "[2/3] Aplicando estructura desde database.sql..."
Get-Content $schemaSql -Raw | & mysql.exe @baseArgs
if ($LASTEXITCODE -ne 0) {
  Write-Error "Error al aplicar el esquema."
  exit 1
}
Write-Host "      Estructura creada." -ForegroundColor Green

# 3. Cargar datos de prueba (a menos que el usuario haya pasado -SoloEstructura)
if ($SoloEstructura) {
  Write-Host ""
  Write-Host "Listo. Base '$DbName' creada con estructura limpia." -ForegroundColor Green
  Write-Host "El admin inicial se crea automaticamente al arrancar el backend"
  Write-Host "con las variables ADMIN_EMAIL / ADMIN_PASSWORD del .env."
  exit 0
}

Write-Host "[3/3] Cargando datos de prueba desde seed.sql..."
Write-Host "      Esto genera ~64.000 ventas. Puede tardar 5-15 minutos."
$start = Get-Date
Get-Content $seedSql -Raw | & mysql.exe @baseArgs $DbName
if ($LASTEXITCODE -ne 0) {
  Write-Error "El seed fallo."
  exit 1
}
$elapsed = (Get-Date) - $start

Write-Host ""
Write-Host "Listo. Base '$DbName' instalada con datos de prueba." -ForegroundColor Green
Write-Host ("Duracion del seed: {0:mm} min {0:ss} seg" -f $elapsed)
Write-Host ""
Write-Host "Credenciales (todos con password 'test123'):"
Write-Host "  admin@centrohogar.com           - Administrador"
Write-Host "  elena.correa@centrohogar.com    - Encargado de stock"
Write-Host "  lucas.garcia@centrohogar.com    - Vendedor"
