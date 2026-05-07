# Scripts de base de datos — Centro Hogar

Scripts PowerShell para llevar la base `centro_hogar` a otra PC sin pasar por
phpMyAdmin manualmente.

## Requisitos previos

1. **MySQL/MariaDB instalado** en la PC destino (XAMPP, WAMP, MySQL Server).
2. **`mysql.exe` y `mysqldump.exe` en el PATH**. Si usás XAMPP:
   ```
   setx PATH "%PATH%;C:\xampp\mysql\bin"
   ```
   Después abrí una terminal nueva.

## Casos de uso

### A) Llevar la app a una PC nueva — solo estructura, sin datos

Ideal para empezar limpio. El admin inicial se crea automáticamente cuando
arrancás el backend (mirá `ADMIN_EMAIL` / `ADMIN_PASSWORD` en `backend/.env`).

```powershell
cd scripts
.\db-setup.ps1
```

Por defecto se conecta a `localhost:3306` con usuario `root` sin contraseña.
Si tu MySQL tiene credenciales:

```powershell
.\db-setup.ps1 -DbUser admin -DbPass "miclave"
```

### B) Llevar la app con todos los datos reales

En la PC actual, exportá un dump completo:

```powershell
cd scripts
.\db-export.ps1
```

Eso genera `backups/centro_hogar_<fecha>_completo.sql` (incluye estructura,
datos, triggers y vistas). Copiá ese archivo a la PC nueva.

En la PC nueva:

```powershell
cd scripts
.\db-import.ps1 -InFile "..\backups\centro_hogar_20260101_120000_completo.sql"
```

> **Nota:** el dump incluye `CREATE DATABASE IF NOT EXISTS centro_hogar` y
> `USE centro_hogar`, así que no hace falta crear la base a mano antes.

### C) Backup periódico (solo datos actuales)

```powershell
.\db-export.ps1 -OutFile "D:\backups\ch_$(Get-Date -Format yyyyMMdd).sql"
```

### D) Solo estructura (para desarrollo)

```powershell
.\db-export.ps1 -SoloEstructura
```

Genera `_estructura.sql` sin filas — útil si querés un schema limpio para
diff o para revisar índices.

## Después del setup

1. Copiá `backend/.env.example` a `backend/.env` y completá:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` — credenciales del MySQL local
   - `JWT_SECRET` — string aleatorio de al menos 32 caracteres
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credenciales del primer admin
2. `cd backend && npm install && npm run dev`
3. `cd centro-hogar && npm install && npm run dev`

El backend, al arrancar, detecta que no hay admin en la base y crea uno con
las variables `ADMIN_*`.

## Solución de problemas

- **`mysql.exe no esta en el PATH`**: agregá la carpeta `bin` de tu MySQL al
  PATH del sistema y reabrí la terminal.
- **`Access denied for user 'root'@'localhost'`**: pasá `-DbUser` y `-DbPass`
  con tus credenciales reales.
- **El dump pesa mucho**: con 60k+ ventas el `.sql` puede pasar 100 MB. Es
  esperable; para reducir tamaño usá `-SoloEstructura`.
- **Errores de charset**: los scripts usan `utf8mb4` siempre. Si ves
  caracteres raros, asegurate de que tu MySQL esté en `utf8mb4_unicode_ci`.
