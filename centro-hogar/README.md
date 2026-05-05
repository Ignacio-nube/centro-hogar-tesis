# Centro Hogar — Frontend

Interfaz web del panel de gestión para una mueblería. Desarrollado con React 19 + Vite + TypeScript. Consume la API REST del backend ubicado en `/backend`.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + Vite + TypeScript |
| UI | shadcn/ui (nova preset) + Tailwind CSS v4 |
| Routing | React Router v7 |
| Estado servidor | TanStack Query v5 |
| Formularios | React Hook Form + Zod |
| Gráficos | Recharts |
| PDF | @react-pdf/renderer |
| Iconos | Lucide React |
| Notificaciones | Sonner |

---

## Cómo correr en desarrollo

> Requiere que el backend esté corriendo en `http://localhost:3001`. Ver instrucciones en [`/backend/README.md`](../backend/README.md).

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variable de entorno
cp .env.example .env
# VITE_API_URL=http://localhost:3001/api

# 3. Iniciar servidor de desarrollo
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API REST | `http://localhost:3001/api` |

---

## Funcionalidades

- **Dashboard** — métricas del día, alertas de stock bajo, últimas ventas
- **Clientes** — CRUD, historial de compras por cliente
- **Productos** — CRUD con categorías, control de stock, imágenes
- **Ventas** — wizard de nueva venta (cliente → carrito → pago → confirmar), listado con filtros, descarga de ticket PDF
- **Reportes** — KPIs del período, desglose por método de pago, exportación a PDF y Excel
- **Usuarios** — alta/edición de usuarios con cambio de email y contraseña, roles (admin / encargado_stock / vendedor)
- **Ajustes** — gestión de categorías, backup completo en CSV y Excel

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

## Estructura del proyecto

```
src/
├── app/
│   ├── App.tsx               # Raíz de la aplicación
│   ├── Router.tsx            # Definición de rutas
│   └── providers/            # AuthProvider, QueryProvider
├── components/
│   ├── common/               # PageHeader, DataTable, ConfirmDialog, etc.
│   ├── layout/               # AppLayout, Sidebar, Header
│   └── ui/                   # Componentes shadcn/ui
├── features/
│   ├── auth/                 # authService, LoginForm
│   ├── clientes/             # clientesService
│   ├── productos/            # productosService
│   ├── ventas/               # ventasService, SaleWizard, PDF ticket
│   ├── backup/               # descarga de backups CSV/Excel
│   ├── reportes/             # PDF reportes
│   └── usuarios/             # UsuarioDialog
├── hooks/                    # usePermissions, useDebounce
├── lib/                      # api.ts, utils.ts, validaciones Zod
├── pages/                    # Una página por ruta
└── types/                    # app.types.ts
```
