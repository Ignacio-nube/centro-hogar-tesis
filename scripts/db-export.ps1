# ============================================================
# Centro Hogar — Exportar dump completo de la base
# ============================================================
# Genera un .sql con estructura + datos para llevar a otra PC.
# Por defecto guarda en backups/centro_hogar_<fecha>.sql
#
# Uso:
#   .\db-export.ps1
#   .\db-export.ps1 -DbUser admin -DbPass "miclave"
#   .\db-export.ps1 -OutFile "C:\temp\midump.sql"
#   .\db-export.ps1 -SoloEstructura          # sin datos (solo schema)
# ============================================================

param(
  [string]$DbHost = "localhost",
  [int]   $DbPort = 3306,
  [string]$DbUser = "root",
  [string]$DbPass = "",
  [string]$DbName = "centro_hogar",
  [string]$OutFile = "",
  [switch]$SoloEstructura
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command mysqldump.exe -ErrorAction SilentlyContinue)) {
  Write-Error "mysqldump.exe no esta en el PATH. Ver db-setup.ps1 para configurarlo."
  exit 1
}

$root = Split-Path -Parent $PSScriptRoot
if (-not $OutFile) {
  $backupsDir = Join-Path $root "backups"
  if (-not (Test-Path $backupsDir)) { New-Item -ItemType Directory -Path $backupsDir | Out-Null }
  $stamp   = Get-Date -Format "yyyyMMdd_HHmmss"
  $sufijo  = if ($SoloEstructura) { "_estructura" } else { "_completo" }
  $OutFile = Join-Path $backupsDir "centro_hogar_${stamp}${sufijo}.sql"
}

$dumpArgs = @(
  "-h", $DbHost, "-P", "$DbPort", "-u", $DbUser
)
if ($DbPass) { $dumpArgs += "-p$DbPass" }

# Flags clave:
#  --routines           incluye stored procedures
#  --triggers           incluye triggers (esta activado por defecto)
#  --single-transaction lectura consistente sin lockear (InnoDB)
#  --default-character-set=utf8mb4
$dumpArgs += @(
  "--routines",
  "--triggers",
  "--single-transaction",
  "--default-character-set=utf8mb4",
  "--add-drop-database",
  "--databases", $DbName
)

if ($SoloEstructura) { $dumpArgs += "--no-data" }

Write-Host "=== Centro Hogar :: Exportando base ===" -ForegroundColor Cyan
Write-Host "Host:   $DbHost`:$DbPort"
Write-Host "Base:   $DbName"
Write-Host "Modo:   $(if ($SoloEstructura) { 'Solo estructura' } else { 'Estructura + datos' })"
Write-Host "Salida: $OutFile"
Write-Host ""
Write-Host "Generando dump (esto puede tardar con muchas ventas)..."

& mysqldump.exe @dumpArgs | Out-File -FilePath $OutFile -Encoding utf8
if ($LASTEXITCODE -ne 0) {
  Write-Error "mysqldump fallo."
  exit 1
}

$sizeMB = [math]::Round((Get-Item $OutFile).Length / 1MB, 2)
Write-Host ""
Write-Host "Dump generado correctamente." -ForegroundColor Green
Write-Host "  $OutFile  ($sizeMB MB)"
Write-Host ""
Write-Host "Para restaurarlo en otra PC: .\db-import.ps1 -InFile `"$OutFile`""
