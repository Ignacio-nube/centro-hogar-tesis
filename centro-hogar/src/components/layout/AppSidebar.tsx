import { NavLink, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { to: '/clientes', label: 'Clientes', icon: Users, permission: 'clientes' },
  { to: '/productos', label: 'Productos', icon: Package, permission: 'productos' },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart, permission: 'ventas' },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, permission: 'reportes' },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, permission: 'usuarios' },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, permission: 'ajustes' },
]

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  encargado_stock: 'Enc. de Stock',
  vendedor: 'Vendedor',
}

function SidebarToggleButton() {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'
  return (
    <button
      onClick={toggleSidebar}
      className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors shrink-0"
      title={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
    >
      {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
    </button>
  )
}

export function AppSidebar() {
  const { profile, signOut } = useAuth()
  const { canAccess } = usePermissions()
  const location = useLocation()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const initials = profile
    ? `${profile.nombre[0]}${profile.apellido[0]}`.toUpperCase()
    : 'CH'

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn('flex items-center py-3', isCollapsed ? 'justify-center px-0' : 'gap-3 px-2')}>
          <img src="/logo.svg" alt="Centro Hogar" className="size-8 shrink-0" />
          {!isCollapsed && (
            <>
              <div className="flex flex-col flex-1 min-w-0 leading-tight">
                <span className="font-semibold text-sm text-brand">Centro Hogar</span>
                <span className="text-xs text-sidebar-foreground/50">Panel de gestión</span>
              </div>
              <SidebarToggleButton />
            </>
          )}
        </div>
        {/* Toggle button row when collapsed — centered below logo */}
        {isCollapsed && (
          <div className="flex justify-center pb-2">
            <SidebarToggleButton />
          </div>
        )}
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs tracking-widest uppercase text-sidebar-foreground/40 px-2 mb-1">
            Navegación
          </SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.filter((item) => canAccess(item.permission)).map((item) => {
              const isActive = location.pathname.startsWith(item.to)
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    render={<NavLink to={item.to} />}
                    className={cn(
                      'transition-colors',
                      !isActive && 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'size-4',
                        isActive ? 'text-brand' : 'text-sidebar-foreground/70',
                      )}
                    />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Nueva venta CTA */}
        {canAccess('ventas') && (
          <SidebarGroup className="mt-auto pb-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Nueva venta"
                  render={<NavLink to="/ventas/nueva" />}
                  className={cn(
                    'transition-colors',
                    isCollapsed
                      ? 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      : 'bg-brand text-white hover:bg-brand-dark font-semibold',
                  )}
                >
                  <ShoppingCart className="size-4 shrink-0" />
                  <span>Nueva venta</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        {isCollapsed ? (
          /* Collapsed: avatar only, centered */
          <div className="flex justify-center p-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ backgroundColor: 'var(--brand)', color: 'white' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          /* Expanded: avatar + name/role + logout */
          <div className="flex items-center gap-3 p-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ backgroundColor: 'var(--brand)', color: 'white' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0 leading-tight">
              <span className="text-sm font-medium truncate text-sidebar-foreground">
                {profile ? `${profile.nombre} ${profile.apellido}` : 'Usuario'}
              </span>
              <span className="text-xs text-sidebar-foreground/50">
                {profile ? ROL_LABEL[profile.rol] : ''}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
