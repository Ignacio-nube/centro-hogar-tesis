# ============================================================
# Centro Hogar — Setup de base de datos en una PC nueva
# ============================================================
# Crea la base 'centro_hogar' y aplica el esquema (database.sql)
# en una instalacion limpia de MySQL/MariaDB.
#
# Requisitos:
#   - mysql.exe en el PATH (XAMPP/WAMP/MySQL Server)
#   - Permisos de root (o un usuario con CREATE DATABASE)
#
# Uso:
#   .\db-setup.ps1                                  # localhost, root sin pass
#   .\db-setup.ps1 -DbUser admin -DbPass "miclave"
#   .\db-setup.ps1 -DbHost 192.168.1.50 -DbPort 3306
# ============================================================

param(
  [string]$DbHost = "localhost",
  [int]   $DbPort = 3306,
  [string]$DbUser = "root",
  [string]$DbPass = "",
  [string]$DbName = "centro_hogar"
)

$ErrorActionPreference = "Stop"

$root      = Split-Path -Parent $PSScriptRoot
$schemaSql = Join-Path $root "database.sql"

if (-not (Test-Path $schemaSql)) {
  Write-Error "No se encontro database.sql en $root"
  exit 1
}

if (-not (Get-Command mysql.exe -ErrorAction SilentlyContinue)) {
  Write-Warning "mysql.exe no esta en el PATH."
  Write-Host   "  - XAMPP: agrega C:\xampp\mysql\bin al PATH"
  Write-Host   "  - WAMP:  agrega C:\wamp64\bin\mysql\mysqlX.Y.Z\bin al PATH"
  exit 1
}

$baseArgs = @("-h", $DbHost, "-P", "$DbPort", "-u", $DbUser)
if ($DbPass) { $baseArgs += "-p$DbPass" }

Write-Host "=== Centro Hogar :: Setup de base de datos ===" -ForegroundColor Cyan
Write-Host "Host:   $DbHost`:$DbPort"
Write-Host "Usuario: $DbUser"
Write-Host "Base:   $DbName"
Write-Host ""

# 1. Verificar conexion
Write-Host "[1/2] Verificando conexion a MySQL..." -NoNewline
try {
  & mysql.exe @baseArgs -e "SELECT VERSION();" *>$null
  Write-Host " OK" -ForegroundColor Green
} catch {
  Write-Host " FALLO" -ForegroundColor Red
  Write-Error "No se pudo conectar al servidor MySQL. Revisa host/usuario/contrasena."
  exit 1
}

# 2. Aplicar el esquema (database.sql ya hace CREATE DATABASE IF NOT EXISTS + USE)
Write-Host "[2/2] Aplicando esquema desde database.sql..."
Get-Content $schemaSql -Raw | & mysql.exe @baseArgs
if ($LASTEXITCODE -ne 0) {
  Write-Error "Error al aplicar el esquema."
  exit 1
}

Write-Host ""
Write-Host "Listo. Base '$DbName' creada y esquema aplicado." -ForegroundColor Green
Write-Host "El admin inicial se crea automaticamente al arrancar el backend (variables ADMIN_* en backend/.env)."
