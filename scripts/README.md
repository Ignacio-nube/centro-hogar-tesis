# Scripts — Centro Hogar

Un único script para dejar la base de datos lista en una PC nueva.

## `instalar-base-de-datos.ps1`

Hace los dos pasos en orden, sin que tengas que ejecutar nada más:

1. Aplica `database.sql` → crea la base `centro_hogar` con todas las tablas,
   vistas y triggers.
2. Aplica `seed.sql` → carga 22 usuarios, 150 clientes, 120 productos y
   ~64.000 ventas con distribución estacional realista.

Tarda 5-15 minutos en total (el seed es lo lento).

### Pre-requisito

`mysql.exe` debe estar en el PATH. Si usás XAMPP:

```powershell
setx PATH "$env:PATH;C:\xampp\mysql\bin"
```

Cerrá la terminal y abrí una nueva para que tome el cambio.

### Uso

```powershell
cd scripts
.\instalar-base-de-datos.ps1
```

Por defecto se conecta a `localhost:3306` con usuario `root` sin contraseña.
Si tu MySQL tiene otras credenciales:

```powershell
.\instalar-base-de-datos.ps1 -DbUser admin -DbPass "MiClave!2026"
```

### Si querés la base vacía (sin datos de prueba)

```powershell
.\instalar-base-de-datos.ps1 -SoloEstructura
```

En ese caso, al arrancar el backend se crea automáticamente el usuario admin
con las variables `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`.

### Credenciales (cuando cargás datos de prueba)

Todos los usuarios tienen password `test123`.

| Email | Rol |
|-------|-----|
| `admin@centrohogar.com` | Administrador |
| `elena.correa@centrohogar.com` | Encargado de stock |
| `lucas.garcia@centrohogar.com` | Vendedor |

### Argumentos disponibles

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `-DbHost` | `localhost` | Host del servidor MySQL |
| `-DbPort` | `3306` | Puerto |
| `-DbUser` | `root` | Usuario |
| `-DbPass` | (vacío) | Contraseña |
| `-DbName` | `centro_hogar` | Nombre de la base |
| `-SoloEstructura` | (off) | Salta el seed y deja la base vacía |

## Backups

Para hacer backups, andá a la app: **Ajustes → Copia de seguridad** te
descarga todo en CSV (ZIP) o Excel. Es lo más simple. Si necesitás un dump
SQL nativo (por ejemplo, para migrar a otro servidor), usá `mysqldump`
directamente:

```powershell
mysqldump -u root --routines --triggers --single-transaction `
  --default-character-set=utf8mb4 centro_hogar > backup.sql
```

Y para restaurarlo:

```powershell
mysql -u root centro_hogar < backup.sql
```
