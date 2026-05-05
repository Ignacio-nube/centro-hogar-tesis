import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Search, List } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { RoleBadge } from '@/components/common/RoleBadge'
import { UsuarioDialog } from '@/features/usuarios/components/UsuarioDialog'
import { authService } from '@/features/auth/services/authService'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { Profile } from '@/types/app.types'

const PAGE_SIZE_DEFAULT  = 5
const PAGE_SIZE_EXPANDED = 10

export default function UsuariosPage() {
  const qc = useQueryClient()

  const [dialogOpen, setDialogOpen]     = useState(false)
  const [editingUser, setEditingUser]   = useState<Profile | null>(null)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [verTodos, setVerTodos]         = useState(false)

  const debouncedSearch = useDebounce(search, 300)
  const pageSize = verTodos ? PAGE_SIZE_EXPANDED : PAGE_SIZE_DEFAULT

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['usuarios', debouncedSearch, page, pageSize],
    queryFn: () => authService.listUsers({ search: debouncedSearch, page, pageSize }),
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
      cell: (u) => <span className="font-medium">{u.nombre} {u.apellido}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (u) => <span className="text-sm text-muted-foreground">{u.email ?? '—'}</span>,
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

  const totalCount = data?.count ?? 0
  const hayMas = page * pageSize < totalCount

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description={`${totalCount} usuarios en el sistema`}
        action={
          <Button onClick={() => { setEditingUser(null); setDialogOpen(true) }}>
            <Plus data-icon="inline-start" />
            Nuevo usuario
          </Button>
        }
      />

      {/* Búsqueda + Ver todos */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {!verTodos && totalCount > PAGE_SIZE_DEFAULT && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => { setVerTodos(true); setPage(1) }}
          >
            <List className="size-3.5 mr-1.5" />
            Ver todos
          </Button>
        )}
        {verTodos && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={() => { setVerTodos(false); setPage(1) }}
          >
            Mostrar menos
          </Button>
        )}
      </div>

      {isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          rowKey={(u) => u.id}
          emptyMessage="No hay usuarios registrados."
        />
      )}

      {/* Paginación */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {Math.min((page - 1) * pageSize + 1, totalCount)}–
            {Math.min(page * pageSize, totalCount)} de {totalCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hayMas}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
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
