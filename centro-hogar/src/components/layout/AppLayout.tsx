import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  const [open, setOpen] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    // stored = 'true' means collapsed → open = false
    return stored === 'true' ? false : true
  })

  function handleOpenChange(value: boolean) {
    setOpen(value)
    // When closed (collapsed), store 'true'; when open, remove key
    if (!value) {
      localStorage.setItem('sidebar-collapsed', 'true')
    } else {
      localStorage.removeItem('sidebar-collapsed')
    }
  }

  return (
    <SidebarProvider
      open={open}
      onOpenChange={handleOpenChange}
      style={
        {
          '--sidebar-width': '14rem',
          '--sidebar-width-icon': '3.5rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-col flex-1 p-6 gap-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
