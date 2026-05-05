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
tesis/
├── centro-hogar/   # Frontend — React SPA
├── backend/        # Backend — API REST Express
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

## Cómo levantar el proyecto localmente

### 1. Clonar el repositorio

```bash
git clone https://github.com/Ignacio-nube/centro-hogar-tesis.git
cd centro-hogar-tesis
```

### 2. Configurar la base de datos en phpMyAdmin

1. Abrí phpMyAdmin (normalmente en `http://localhost/phpmyadmin`)
2. Creá una nueva base de datos llamada **`centro_hogar`** con cotejamiento `utf8mb4_unicode_ci`
3. Seleccioná la base de datos `centro_hogar` y andá a la pestaña **Importar**
4. Importá el archivo `database.sql` (crea todas las tablas, vistas y triggers)
5. Importá el archivo `seed.sql` (carga los datos de prueba)

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
DB_PASSWORD=           # tu contraseña de MySQL (vacío si usás XAMPP por defecto)
DB_NAME=centro_hogar
JWT_SECRET=un-secreto-largo-y-seguro-de-minimo-32-caracteres
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

El frontend corre en `http://localhost:5173`.

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

- **Dashboard** — métricas del día, alertas de stock bajo, últimas ventas
- **Clientes** — CRUD completo, historial de compras por cliente
- **Productos** — CRUD con categorías, control de stock e imágenes
- **Ventas** — wizard multi-paso (cliente → carrito → pago → confirmar), descarga de ticket PDF
- **Reportes** — KPIs por período, desglose por método de pago, exportación a PDF y Excel
- **Usuarios** — alta/edición con roles (admin / encargado_stock / vendedor)
- **Ajustes** — gestión de categorías, backup completo en CSV y Excel
