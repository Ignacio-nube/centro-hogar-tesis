import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { usePermissions } from '@/hooks/usePermissions'
import { AppLayout } from '@/components/layout/AppLayout'
import { Skeleton } from '@/components/ui/skeleton'

// Pages (lazy loaded)
const LoginPage = React.lazy(() => import('@/pages/LoginPage'))
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'))
const ClientesPage = React.lazy(() => import('@/pages/ClientesPage'))
const ClienteDetailPage = React.lazy(() => import('@/pages/ClienteDetailPage'))
const ProductosPage = React.lazy(() => import('@/pages/ProductosPage'))
const ProductoDetailPage = React.lazy(() => import('@/pages/ProductoDetailPage'))
const VentasPage = React.lazy(() => import('@/pages/VentasPage'))
const VentaDetailPage = React.lazy(() => import('@/pages/VentaDetailPage'))
const NuevaVentaPage = React.lazy(() => import('@/pages/NuevaVentaPage'))
const ReportesPage = React.lazy(() => import('@/pages/ReportesPage'))
const UsuariosPage = React.lazy(() => import('@/pages/UsuariosPage'))
const AjustesPage = React.lazy(() => import('@/pages/AjustesPage'))

function PageLoader() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RequirePermission({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { isLoading } = useAuth()
  const { can } = usePermissions()

  if (isLoading) return <PageLoader />
  if (!can(permission)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function Router() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuth>
                <LoginPage />
              </RedirectIfAuth>
            }
          />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/:id" element={<ClienteDetailPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/productos/:id" element={<ProductoDetailPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/ventas/nueva" element={<NuevaVentaPage />} />
            <Route path="/ventas/:id" element={<VentaDetailPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route
              path="/usuarios"
              element={
                <RequirePermission permission="usuarios">
                  <UsuariosPage />
                </RequirePermission>
              }
            />
            <Route
              path="/ajustes"
              element={
                <RequirePermission permission="ajustes">
                  <AjustesPage />
                </RequirePermission>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  )
}
