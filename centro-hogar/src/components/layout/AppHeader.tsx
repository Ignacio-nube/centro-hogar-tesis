import { useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface PageConfig {
  title: string
  icon: LucideIcon
}

const PAGE_CONFIG: Record<string, PageConfig> = {
  '/dashboard': { title: 'Dashboard', icon: LayoutDashboard },
  '/clientes': { title: 'Clientes', icon: Users },
  '/productos': { title: 'Productos', icon: Package },
  '/ventas': { title: 'Ventas', icon: ShoppingCart },
  '/reportes': { title: 'Reportes', icon: BarChart3 },
  '/usuarios': { title: 'Usuarios', icon: UserCog },
  '/ajustes': { title: 'Ajustes', icon: Settings },
}

function resolveConfig(pathname: string): PageConfig {
  // Exact match first
  if (PAGE_CONFIG[pathname]) return PAGE_CONFIG[pathname]
  // Prefix match for nested routes (e.g. /clientes/:id)
  const prefix = Object.keys(PAGE_CONFIG).find((k) => pathname.startsWith(k + '/'))
  if (prefix) return PAGE_CONFIG[prefix]
  return { title: 'Centro Hogar', icon: LayoutDashboard }
}

export function AppHeader() {
  const { pathname } = useLocation()
  const { title, icon: Icon } = resolveConfig(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <div className="md:hidden">
        <SidebarTrigger className="-ml-1" />
      </div>
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Icon className="size-4 text-brand shrink-0" />
      <h1 className="text-sm font-semibold">{title}</h1>
    </header>
  )
}
