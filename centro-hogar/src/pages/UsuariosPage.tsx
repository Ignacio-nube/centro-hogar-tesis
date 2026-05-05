import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { RoleBadge } from '@/components/common/RoleBadge'
import { UsuarioDialog } from '@/features/usuarios/components/UsuarioDialog'
import { authService } from '@/features/auth/services/authService'
import { formatDate } from '@/lib/utils'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { Profile } from '@/types/app.types'

export default function UsuariosPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => authService.listUsers(),
  })

  const toggleActivoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      authService.updateProfile(id, { activo }),
    onSuccess: () => {
      toast.success('Usuario actualizado')
      qc.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: () => toast.error('Error al actualizar el usuario'),
  })

  const columns: Column<Profile>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (u) => (
        <span className="font-medium">{u.nombre} {u.apellido}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (u) => (
        <span className="text-sm text-muted-foreground">{u.email ?? '—'}</span>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      cell: (u) => <RoleBadge rol={u.rol} />,
    },
    {
      key: 'activo',
      header: 'Estado',
      cell: (u) => (
        <button
          className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={u.activo ? 'Clic para desactivar' : 'Clic para activar'}
          disabled={toggleActivoMutation.isPending}
          onClick={(e) => {
            e.stopPropagation()
            toggleActivoMutation.mutate({ id: u.id, activo: !u.activo })
          }}
        >
          <Badge
            variant={u.activo ? 'default' : 'secondary'}
            className="hover:opacity-80 transition-opacity"
          >
            {u.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'created_at',
      header: 'Alta',
      cell: (u) => <span className="text-muted-foreground text-sm">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      cell: (u) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => { e.stopPropagation(); setEditingUser(u); setDialogOpen(true) }}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description={`${users?.length ?? 0} usuarios en el sistema`}
        action={
          <Button onClick={() => { setEditingUser(null); setDialogOpen(true) }}>
            <Plus data-icon="inline-start" />
            Nuevo usuario
          </Button>
        }
      />

      {isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={users ?? []}
          isLoading={isLoading}
          rowKey={(u) => u.id}
          emptyMessage="No hay usuarios registrados."
        />
      )}

      <UsuarioDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingUser(null) }}
        usuario={editingUser}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setDialogOpen(false) }}
      />
    </div>
  )
}
