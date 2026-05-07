# ============================================================
# Centro Hogar — Importar un dump .sql en MySQL
# ============================================================
# Restaura un .sql generado con db-export.ps1 (o con phpMyAdmin).
#
# Uso:
#   .\db-import.ps1 -InFile "..\backups\centro_hogar_20260101_120000_completo.sql"
#   .\db-import.ps1 -InFile dump.sql -DbUser admin -DbPass "miclave"
# ============================================================

param(
  [Parameter(Mandatory=$true)]
  [string]$InFile,

  [string]$DbHost = "localhost",
  [int]   $DbPort = 3306,
  [string]$DbUser = "root",
  [string]$DbPass = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $InFile)) {
  Write-Error "No se encontro el archivo: $InFile"
  exit 1
}

if (-not (Get-Command mysql.exe -ErrorAction SilentlyContinue)) {
  Write-Error "mysql.exe no esta en el PATH."
  exit 1
}

$baseArgs = @("-h", $DbHost, "-P", "$DbPort", "-u", $DbUser)
if ($DbPass) { $baseArgs += "-p$DbPass" }
$baseArgs += "--default-character-set=utf8mb4"

$sizeMB = [math]::Round((Get-Item $InFile).Length / 1MB, 2)

Write-Host "=== Centro Hogar :: Importando dump ===" -ForegroundColor Cyan
Write-Host "Host:    $DbHost`:$DbPort"
Write-Host "Usuario: $DbUser"
Write-Host "Archivo: $InFile  ($sizeMB MB)"
Write-Host ""

$confirm = Read-Host "Esto puede sobrescribir datos existentes. Continuar? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
  Write-Host "Cancelado."
  exit 0
}

Write-Host "Importando (puede tardar)..."
Get-Content $InFile -Raw | & mysql.exe @baseArgs
if ($LASTEXITCODE -ne 0) {
  Write-Error "La importacion fallo."
  exit 1
}

Write-Host ""
Write-Host "Importacion completada." -ForegroundColor Green
