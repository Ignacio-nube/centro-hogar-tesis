# Centro Hogar — API REST (Backend)

API REST construida con Node.js + Express + TypeScript que sirve de backend para el panel de gestión de Centro Hogar. Se conecta a una base de datos MySQL gestionada con phpMyAdmin.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express v4 |
| Lenguaje | TypeScript 5 |
| Base de datos | MySQL 8 (driver `mysql2`) |
| Autenticación | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validación | Zod |
| Seguridad | `helmet` + `cors` + `express-rate-limit` |
| Exportación | `xlsx` + `jszip` |
| Dev server | `ts-node-dev` |

---

## Estructura del proyecto

```
backend/
├── .env.example          # Plantilla de variables de entorno
├── src/
│   ├── index.ts          # Punto de entrada (conecta DB, inicia servidor)
│   ├── app.ts            # Configuración de Express
│   ├── config/
│   │   ├── database.ts   # Pool de conexiones MySQL
│   │   └── env.ts        # Carga y validación de variables de entorno
│   ├── controllers/      # Lógica de cada endpoint
│   ├── middleware/       # Auth JWT, roles, manejo de errores
│   ├── models/           # Interfaces TypeScript / tipos de la DB
│   ├── routes/           # Definición de rutas Express
│   ├── services/         # Lógica de negocio
│   └── utils/            # JWT, passwords, respuestas, paginación
```

---

## Endpoints disponibles

Todos los endpoints están bajo el prefijo `/api`.

| Prefijo | Módulo |
|---------|--------|
| `POST /api/auth/login` | Autenticación |
| `GET/POST/PUT/DELETE /api/usuarios` | Gestión de usuarios |
| `GET/POST/PUT/DELETE /api/clientes` | Gestión de clientes |
| `GET/POST/PUT/DELETE /api/productos` | Gestión de productos |
| `GET/POST/PUT/DELETE /api/categorias` | Gestión de categorías |
| `GET/POST /api/ventas` | Gestión de ventas |
| `GET /api/reportes` | Reportes y KPIs |
| `GET /api/reportes/backup` | Exportación de datos |
| `GET/POST /api/integraciones` | Integración Google Sheets |
| `GET /health` | Health check (sin autenticación) |

---

## Configuración de la base de datos (phpMyAdmin)

1. Abrí phpMyAdmin en `http://localhost/phpmyadmin`
2. Creá una nueva base de datos llamada **`centro_hogar`** con cotejamiento `utf8mb4_unicode_ci`
3. Seleccioná la base de datos y andá a la pestaña **Importar**
4. Importá `../database.sql` — crea todas las tablas, vistas, triggers e índices
5. Importá `../seed.sql` — carga los datos de prueba (usuarios, productos, clientes)

---

## Variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp .env.example .env
```

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `PORT` | Puerto del servidor (default: `3001`) | No |
| `NODE_ENV` | Entorno: `development` o `production` | No |
| `DB_HOST` | Host de MySQL (default: `localhost`) | No |
| `DB_PORT` | Puerto de MySQL (default: `3306`) | No |
| `DB_USER` | Usuario de MySQL (default: `root`) | No |
| `DB_PASSWORD` | Contraseña de MySQL | No |
| `DB_NAME` | Nombre de la base de datos (default: `centro_hogar`) | No |
| `JWT_SECRET` | Secreto para firmar tokens JWT (mínimo 32 caracteres) | **Sí** |
| `JWT_EXPIRES_IN` | Duración del token (default: `8h`) | No |
| `FRONTEND_URL` | URL del frontend para CORS (default: `http://localhost:5173`) | No |
| `ADMIN_EMAIL` | Email del administrador inicial | **Sí** |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial | **Sí** |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email de cuenta de servicio Google (integración opcional) | No |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Clave privada de cuenta de servicio Google (integración opcional) | No |

> **Nota sobre XAMPP/WAMP:** Si usás MySQL de XAMPP sin contraseña, dejá `DB_PASSWORD` vacío.

---

## Cómo correr en desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales MySQL

# 3. Asegurarse de que MySQL esté corriendo y la DB importada

# 4. Iniciar servidor en modo desarrollo (hot-reload)
npm run dev
```

El servidor queda disponible en `http://localhost:3001`.

### Otros comandos

```bash
npm run build   # Compila TypeScript a JavaScript en /dist
npm start       # Corre el build compilado (producción)
npm run lint    # Analiza el código con ESLint
```

---

## Notas

- Al iniciar, el servidor verifica la conexión a MySQL. Si falla, se detiene con error.
- Si el usuario administrador configurado en `.env` no existe en la DB, se crea automáticamente al arrancar.
- La integración con Google Sheets es opcional. Si no se configuran las variables `GOOGLE_SERVICE_ACCOUNT_*`, la funcionalidad de sincronización estará deshabilitada.
- El pool de MySQL opera con timezone `UTC-3` (Argentina) y charset `utf8mb4`.
