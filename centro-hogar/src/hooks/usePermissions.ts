import { useAuth } from '@/app/providers/AuthProvider'
import type { Rol } from '@/types/app.types'

const PERMISSIONS: Record<string, Rol[]> = {
  dashboard: ['admin', 'encargado_stock', 'vendedor'],
  clientes: ['admin', 'vendedor'],
  'clientes.write': ['admin', 'vendedor'],
  productos: ['admin', 'encargado_stock', 'vendedor'],
  'productos.write': ['admin', 'encargado_stock'],
  ventas: ['admin', 'vendedor'],
  'ventas.write': ['admin', 'vendedor'],
  reportes: ['admin', 'encargado_stock'],
  usuarios: ['admin'],
  'usuarios.write': ['admin'],
  ajustes: ['admin'],
  stock: ['admin', 'encargado_stock'],
}

export function usePermissions() {
  const { profile } = useAuth()

  function can(action: string): boolean {
    if (!profile) return false
    if (profile.rol === 'admin') return true
    const allowed = PERMISSIONS[action]
    if (!allowed) return false
    return allowed.includes(profile.rol)
  }

  function canAccess(section: string): boolean {
    return can(section)
  }

  return { can, canAccess, rol: profile?.rol }
}
