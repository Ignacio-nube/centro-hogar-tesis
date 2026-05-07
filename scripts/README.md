# Scripts de base de datos — Centro Hogar

Scripts PowerShell para crear y mover la base `centro_hogar` entre PCs sin
pasar por phpMyAdmin manualmente.

## Scripts disponibles

| Script | Para qué sirve |
|--------|----------------|
| `crear-base-vacia.ps1` | Crea la base `centro_hogar` con la **estructura sola** (tablas, vistas, triggers). Sin datos. |
| `cargar-datos-de-prueba.ps1` | Ejecuta `seed.sql` y carga 22 usuarios, 150 clientes, 120 productos y ~64.000 ventas con distribución estacional realista. Tarda 5-15 min. |
| `exportar-base-completa.ps1` | Genera un `.sql` con la **estructura + datos reales actuales** (mediante `mysqldump`). Útil para llevarse la base con todo a otra PC. |
| `importar-base-completa.ps1` | Restaura un `.sql` exportado previamente (o cualquier dump compatible). |

## Requisitos previos

1. **MySQL/MariaDB instalado** (XAMPP, WAMP, MySQL Server).
2. **`mysql.exe` y `mysqldump.exe` en el PATH**. Si usás XAMPP:
   ```powershell
   setx PATH "$env:PATH;C:\xampp\mysql\bin"
   ```
   Cerrá la terminal y abrí una nueva.

## Casos de uso

### A) PC nueva con datos de prueba (recomendado para tesis/desarrollo)

Crea la estructura y carga los 64k registros del `seed.sql`:

```powershell
cd scripts
.\crear-base-vacia.ps1
.\cargar-datos-de-prueba.ps1
```

Te quedan los 3 usuarios de prueba (todos con password `test123`):

| Email | Rol |
|-------|-----|
| `admin@centrohogar.com` | Administrador |
| `elena.correa@centrohogar.com` | Encargado de stock |
| `lucas.garcia@centrohogar.com` | Vendedor |

### B) PC nueva sin datos (empezar de cero)

Solo crea la estructura. El admin inicial se genera automáticamente al
arrancar el backend (toma `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`):

```powershell
cd scripts
.\crear-base-vacia.ps1
```

### C) Migrar la base actual con todos los datos a otra PC

En la PC origen:

```powershell
cd scripts
.\exportar-base-completa.ps1
```

Esto genera `backups/centro_hogar_<fecha>_completo.sql` (estructura + datos
reales + triggers + vistas). Copiá ese archivo a la PC destino.

En la PC destino:

```powershell
cd scripts
.\importar-base-completa.ps1 -InFile "..\backups\centro_hogar_20260101_120000_completo.sql"
```

> El dump incluye `CREATE DATABASE IF NOT EXISTS centro_hogar`, así que
> no hace falta crear la base a mano antes.

### D) Backup periódico

```powershell
.\exportar-base-completa.ps1 -OutFile "D:\backups\ch_$(Get-Date -Format yyyyMMdd).sql"
```

### E) Solo estructura (para diff/revisión de schema)

```powershell
.\exportar-base-completa.ps1 -SoloEstructura
```

## Argumentos comunes

Todos los scripts aceptan estos parámetros (con defaults útiles para XAMPP):

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `-DbHost` | `localhost` | Host del servidor MySQL |
| `-DbPort` | `3306` | Puerto |
| `-DbUser` | `root` | Usuario |
| `-DbPass` | (vacío) | Contraseña — pasá entre comillas si tiene caracteres especiales |
| `-DbName` | `centro_hogar` | Nombre de la base |

Ejemplo con credenciales:

```powershell
.\crear-base-vacia.ps1 -DbUser admin -DbPass "MiClave!2026"
```

## Solución de problemas

- **`mysql.exe no esta en el PATH`**: agregá la carpeta `bin` de tu MySQL al
  PATH del sistema y reabrí la terminal.
- **`Access denied for user 'root'@'localhost'`**: pasá `-DbUser` y `-DbPass`
  con tus credenciales reales.
- **El dump pesa mucho**: con 64k+ ventas el `.sql` puede pasar 100 MB. Es
  esperable; para reducir tamaño usá `-SoloEstructura`.
- **`cargar-datos-de-prueba.ps1` falla con "Table doesn't exist"**: corré
  primero `.\crear-base-vacia.ps1` para tener la estructura.
- **Errores de charset / acentos raros**: los scripts usan `utf8mb4` siempre.
  Si ves caracteres incorrectos, asegurate de que tu MySQL esté en
  `utf8mb4_unicode_ci`.
