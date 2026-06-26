import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Search, List, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PaginationControls } from '@/components/common/PaginationControls'
import { RoleBadge } from '@/components/common/RoleBadge'
import { UsuarioDialog } from '@/features/usuarios/components/UsuarioDialog'
import { ResetPasswordDialog } from '@/features/usuarios/components/ResetPasswordDialog'
import { authService } from '@/features/auth/services/authService'
import { formatDate } from '@/lib/utils'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { Profile } from '@/types/app.types'

type Modo = 'inicial' | 'buscando' | 'todos'

const PAGE_SIZE_INICIAL = 5
const PAGE_SIZE_TODOS   = 15

export default function UsuariosPage() {
  const qc = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [resetUser, setResetUser] = useState<Profile | null>(null)

  const [searchInput, setSearchInput]     = useState('')
  const [searchApplied, setSearchApplied] = useState('')

  const [page, setPage] = useState(1)
  const [modo, setModo] = useState<Modo>('inicial')

  const pageSize = modo === 'todos' ? PAGE_SIZE_TODOS : PAGE_SIZE_INICIAL

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['usuarios', searchApplied, page, modo],
    queryFn: () =>
      authService.listUsers({
        search: searchApplied || undefined,
        activo: true,
        page,
        pageSize,
      }),
    staleTime: modo === 'inicial' ? 1000 * 60 * 5 : 0,
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

  function buscar() {
    const s = searchInput.trim()
    setSearchApplied(s)
    setPage(1)
    if (modo !== 'todos') setModo(s ? 'buscando' : 'inicial')
  }

  function handleVerTodos() {
    setModo('todos')
    setPage(1)
  }

  function handleMostrarMenos() {
    setModo('inicial')
    setSearchInput('')
    setSearchApplied('')
    setPage(1)
  }

  const totalCount = data?.count ?? 0
  const mostrarPaginacion = modo !== 'inicial'

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
      className: 'w-20',
      cell: (u) => (
        <Switch
          size="sm"
          checked={u.activo}
          disabled={toggleActivoMutation.isPending}
          onCheckedChange={(checked) =>
            toggleActivoMutation.mutate({ id: u.id, activo: checked })
          }
          onClick={(e) => e.stopPropagation()}
        />
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
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Restablecer contraseña"
            onClick={(e) => { e.stopPropagation(); setResetUser(u) }}
          >
            <KeyRound className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Editar usuario"
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
        description={
          modo === 'inicial'
            ? '5 usuarios más recientes'
            : `${totalCount} usuarios encontrados`
        }
        action={
          <Button onClick={() => { setEditingUser(null); setDialogOpen(true) }}>
            <Plus data-icon="inline-start" />
            Nuevo usuario
          </Button>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o email... (Enter para buscar)"
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') buscar() }}
          />
        </div>

        <Button size="sm" onClick={buscar}>
          <Search className="size-3.5 mr-1.5" />
          Buscar
        </Button>

        {modo !== 'todos' ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={handleVerTodos}
          >
            <List className="size-3.5 mr-1.5" />
            Ver todos
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={handleMostrarMenos}
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

      {mostrarPaginacion && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={totalCount}
          onPageChange={setPage}
        />
      )}

      <UsuarioDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingUser(null) }}
        usuario={editingUser}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setDialogOpen(false) }}
      />

      <ResetPasswordDialog
        open={!!resetUser}
        onOpenChange={(v) => { if (!v) setResetUser(null) }}
        usuario={resetUser}
      />
    </div>
  )
}
