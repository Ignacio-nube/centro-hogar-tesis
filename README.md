# Centro Hogar — Panel de Gestión

Panel de administración web para una mueblería. Permite gestionar clientes, productos, ventas, reportes y usuarios desde una interfaz moderna. Desarrollado como proyecto de tesis universitaria.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Routing | React Router v7 |
| Estado servidor | TanStack Query v5 |
| Formularios | React Hook Form + Zod |
| Gráficos | Recharts |
| PDF | @react-pdf/renderer |
| Backend | Node.js + Express + TypeScript |
| Base de datos | MySQL 8 (gestionado con phpMyAdmin) |
| Autenticación | JWT + bcrypt |

---

## Estructura del monorepo

```
centro-hogar-tesis/
├── centro-hogar/   # Frontend — React SPA
├── backend/        # Backend — API REST Express
├── scripts/        # Scripts PowerShell para mover la DB entre PCs
├── database.sql    # Esquema MySQL completo
├── seed.sql        # Datos de prueba iniciales
└── datos.txt       # Credenciales de prueba
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL 8](https://www.mysql.com/) con [phpMyAdmin](https://www.phpmyadmin.net/) (recomendado usar [XAMPP](https://www.apachefriends.org/), [WAMP](https://www.wampserver.com/) o [Laragon](https://laragon.org/))
- npm v9 o superior

---

## Cómo levantar el proyecto en otra PC

### 1. Clonar el repositorio

```bash
git clone https://github.com/Ignacio-nube/centro-hogar-tesis.git
cd centro-hogar-tesis
```

### 2. Crear la base de datos

Hay dos formas: con el script (recomendado) o con phpMyAdmin (manual).

#### Opción A — Con el script (recomendado)

**Pre-requisito**: agregar `mysql.exe` al PATH. Si usás XAMPP:

```powershell
setx PATH "$env:PATH;C:\xampp\mysql\bin"
```

Cerrá la terminal y abrí una nueva para que tome el cambio.

Después corré el script único que crea la estructura y carga los datos de prueba (22 usuarios, 150 clientes, 120 productos, ~64.000 ventas):

```powershell
cd scripts
.\instalar-base-de-datos.ps1
```

Tarda 5-15 minutos en total. Si tu MySQL tiene credenciales:

```powershell
.\instalar-base-de-datos.ps1 -DbUser admin -DbPass "MiClave!2026"
```

Si querés la base vacía (sin datos de prueba) para empezar de cero:

```powershell
.\instalar-base-de-datos.ps1 -SoloEstructura
```

> Más detalles en [`scripts/README.md`](scripts/README.md).

#### Opción B — Manual con phpMyAdmin

1. Abrí phpMyAdmin (normalmente en `http://localhost/phpmyadmin`)
2. Creá una base de datos llamada **`centro_hogar`** con cotejamiento `utf8mb4_unicode_ci`
3. Seleccioná `centro_hogar` y andá a la pestaña **Importar**
4. Importá `database.sql` (estructura)
5. (Opcional) Importá `seed.sql` (datos de prueba)

> phpMyAdmin suele dar timeout antes de terminar las 64k ventas del seed. Si te falla, usá la Opción A.

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Editá el `.env` con tus credenciales MySQL:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=                        # vacío si usás XAMPP por defecto
DB_NAME=centro_hogar
JWT_SECRET=un-secreto-largo-de-minimo-32-caracteres
ADMIN_EMAIL=admin@centrohogar.com
ADMIN_PASSWORD=cambia-esta-clave
```

Instalá dependencias y levantá el servidor:

```bash
npm install
npm run dev
```

El backend corre en `http://localhost:3001`.

### 4. Configurar el frontend

```bash
cd ../centro-hogar
cp .env.example .env
```

El `.env` del frontend solo necesita la URL de la API:

```env
VITE_API_URL=http://localhost:3001/api
```

Instalá dependencias y levantá el servidor:

```bash
npm install
npm run dev
```

El frontend corre en `http://localhost:5173`. Entrá con el `ADMIN_EMAIL` / `ADMIN_PASSWORD` que pusiste en el `.env` del backend.

---

## Backups y mantenimiento

Una vez instalado, hay dos mecanismos complementarios para hacer copias de seguridad:

| Vía | Qué incluye | Cuándo usarla |
|-----|-------------|---------------|
| **Ajustes → Copia de seguridad** | Excel/CSV de todas las tablas, accesible desde la app | Para entregar al cliente o archivar mensualmente |
| **`scripts/db-export.ps1`** | Dump SQL nativo (estructura + datos + triggers) | Para migrar a otra PC o restaurar después de un crash |

También hay una sección de **Limpieza de ventas antiguas** dentro de Ajustes que permite borrar definitivamente ventas con más de N años (2/3/5/10) si la base crece demasiado.

---

## Variables de entorno — Backend

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `PORT` | Puerto del servidor | No (default: `3001`) |
| `NODE_ENV` | Entorno: `development` / `production` | No |
| `DB_HOST` | Host de MySQL | No (default: `localhost`) |
| `DB_PORT` | Puerto de MySQL | No (default: `3306`) |
| `DB_USER` | Usuario de MySQL | No (default: `root`) |
| `DB_PASSWORD` | Contraseña de MySQL | No |
| `DB_NAME` | Nombre de la base de datos | No (default: `centro_hogar`) |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mín. 32 caracteres) | **Sí** |
| `JWT_EXPIRES_IN` | Duración del token JWT | No (default: `8h`) |
| `FRONTEND_URL` | URL del frontend (para CORS) | No (default: `http://localhost:5173`) |
| `ADMIN_EMAIL` | Email del usuario admin inicial | **Sí** |
| `ADMIN_PASSWORD` | Contraseña del usuario admin inicial | **Sí** |

## Variables de entorno — Frontend

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API REST | `http://localhost:3001/api` |

---

## Credenciales de prueba

Estas funcionan solo si importaste `seed.sql`.

| Email | Contraseña | Rol |
|-------|------------|-----|
| `admin@centrohogar.com` | `test123` | Administrador |
| `elena.correa@centrohogar.com` | `test123` | Encargado de stock |
| `lucas.garcia@centrohogar.com` | `test123` | Vendedor |

---

## Permisos por rol

| Sección | admin | encargado_stock | vendedor |
|---------|-------|----------------|---------|
| Dashboard | ✓ | ✓ | ✓ |
| Clientes | lectura + escritura | lectura | lectura |
| Productos | lectura + escritura | lectura + escritura | lectura |
| Ventas | todas | todas | solo propias |
| Reportes | ✓ | ✓ | — |
| Usuarios | ✓ | — | — |
| Ajustes | ✓ | ✓ | — |

---

## Funcionalidades

- **Dashboard** — métricas del día, gráfico de ventas últimos 14 días, alertas de stock bajo, donut interactivo de productos por categoría con selector de período (7d / 30d / 90d / 1a) y panel lateral de detalle, top 5 vendedores
- **Clientes** — CRUD completo, historial de compras paginado por cliente
- **Productos** — CRUD con categorías, control de stock, top 5 más vendidos del último año por defecto
- **Ventas** — wizard multi-paso (cliente → carrito → pago → confirmar), descarga de ticket PDF, validación de stock al confirmar
- **Reportes** — KPIs por período, desglose por método de pago, exportación a PDF y Excel filtrados por rango de fechas
- **Usuarios** — alta/edición con roles (admin / encargado_stock / vendedor)
- **Ajustes** — gestión de categorías, backup completo (CSV/Excel), limpieza de ventas antiguas
