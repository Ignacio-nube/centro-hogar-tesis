import { Badge } from '@/components/ui/badge'
import type { Rol } from '@/types/app.types'

const ROL_CONFIG: Record<Rol, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  encargado_stock: { label: 'Enc. Stock', variant: 'secondary' },
  vendedor: { label: 'Vendedor', variant: 'outline' },
}

export function RoleBadge({ rol }: { rol: Rol }) {
  const config = ROL_CONFIG[rol]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
