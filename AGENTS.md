# Centro Hogar — Instrucciones para agentes de IA

Este documento describe el stack tecnológico y las convenciones del proyecto para que cualquier agente de IA pueda contribuir correctamente.

---

## Stack tecnológico

### Frontend (`/centro-hogar`)

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | React 19 + Vite + TypeScript | |
| UI | shadcn/ui + Radix UI | Usar componentes de `@/components/ui/` |
| Estilos | Tailwind CSS v4 | NO usar v3. Usar clases de Tailwind v4 |
| Routing | React Router v7 | Rutas en `src/app/Router.tsx` |
| Estado servidor | TanStack Query v5 | `useQuery` / `useMutation` |
| Formularios | React Hook Form v7 + Zod v4 | Siempre validar con Zod |
| Gráficos | Recharts v3 | |
| PDF | @react-pdf/renderer v4 | PDFs en `src/features/reportes/pdf/` |
| Iconos | Lucide React | |
| Notificaciones | Sonner (`toast`) | |

### Backend (`/backend`)

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Runtime | Node.js 18+ + TypeScript | |
| Framework | Express v4 | |
| Base de datos | MySQL 8 via `mysql2` | Pool en `src/config/database.ts` |
| Auth | JWT + bcryptjs | Middleware en `src/middleware/auth.middleware.ts` |
| Validación | Zod v3 | Siempre validar el body con Zod antes de procesar |
| Respuestas | `src/utils/response.ts` | Usar `r.ok()`, `r.badRequest()`, `r.notFound()`, etc. |

### Base de datos

- **Motor**: MySQL 8, InnoDB, charset `utf8mb4`, timezone `UTC-3` (Argentina)
- **Schema**: `database.sql` en la raíz del repo (importar en phpMyAdmin)
- **Seed**: `seed.sql` en la raíz del repo

---

## Estructura del proyecto

```
tesis/
├── centro-hogar/        # Frontend React SPA
│   └── src/
│       ├── app/         # Router, providers (Auth, Query)
│       ├── components/  # common/, layout/, ui/ (shadcn)
│       ├── features/    # Un folder por dominio (auth, clientes, productos, ventas, etc.)
│       ├── hooks/       # usePermissions, useDebounce
│       ├── lib/         # api.ts (cliente HTTP), utils.ts, validaciones Zod
│       ├── pages/       # Una página por ruta
│       └── types/       # app.types.ts (todos los tipos del dominio)
├── backend/             # API REST Express
│   └── src/
│       ├── config/      # database.ts (pool MySQL), env.ts (variables)
│       ├── controllers/ # Lógica de endpoints
│       ├── middleware/  # auth, roles, errores
│       ├── models/      # tipos TypeScript de la DB
│       ├── routes/      # Rutas Express (index.ts registra todo)
│       ├── services/    # Lógica de negocio
│       └── utils/       # jwt, password, response, pagination
├── database.sql         # Schema MySQL completo
└── seed.sql             # Datos de prueba
```

---

## Convenciones

### Frontend

- Los servicios de API viven en `src/features/<dominio>/services/<dominio>Service.ts`
- Las páginas se llaman `<Nombre>Page.tsx` y viven en `src/pages/`
- Los tipos del dominio van en `src/types/app.types.ts`
- Usar el cliente HTTP `api` de `@/lib/api` (no usar `fetch` ni `axios` directamente)
- Los alias de paths están configurados: usar `@/` en lugar de rutas relativas largas
- Siempre usar componentes de `@/components/ui/` para UI (Button, Card, Input, etc.)

### Backend

- Toda respuesta pasa por las helpers de `src/utils/response.ts`
- Los controladores solo orquestan; la lógica va en `src/services/`
- Las rutas se registran en `src/routes/index.ts`
- Variables de entorno se leen desde `src/config/env.ts` (nunca leer `process.env` directamente)
- Los endpoints protegidos requieren `authMiddleware` y opcionalmente `soloAdmin` / `soloEncargadoOAdmin`

### Base de datos

- No modificar el schema sin actualizar `database.sql`
- Las vistas disponibles son: `v_ventas`, `v_productos`, `v_movimientos_stock`
- Los campos `total_final` y `subtotal` son columnas GENERATED (no insertarlas)
- `numero_venta` se genera con un trigger BEFORE INSERT

---

## Lo que NO existe en este proyecto

- No hay Supabase, PostgREST ni ningún Backend-as-a-Service
- No hay integración con Google Sheets (fue eliminada)
- No hay PostgreSQL (solo MySQL)
- No hay @insforge/sdk ni ningún SDK de BaaS
