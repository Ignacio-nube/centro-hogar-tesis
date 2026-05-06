import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Search, SlidersHorizontal, List } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PaginationControls } from '@/components/common/PaginationControls'
import { RoleBadge } from '@/components/common/RoleBadge'
import { UsuarioDialog } from '@/features/usuarios/components/UsuarioDialog'
import { authService } from '@/features/auth/services/authService'
import { useDebounce } from '@/hooks/useDebounce'
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

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // filtros pendientes
  const [activoFilterPend, setActivoFilterPend] = useState<string>('activo')
  // filtros aplicados
  const [activoFilter, setActivoFilter] = useState<string>('activo')

  const [page, setPage] = useState(1)
  const [modo, setModo] = useState<Modo>('inicial')

  const pageSize = modo === 'todos' ? PAGE_SIZE_TODOS : PAGE_SIZE_INICIAL

  const activoParam =
    activoFilter === 'activo' ? true : activoFilter === 'inactivo' ? false : undefined

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['usuarios', debouncedSearch, activoFilter, page, modo],
    queryFn: () =>
      authService.listUsers({
        search: debouncedSearch || undefined,
        activo: activoParam,
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

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
    setModo(value.trim() ? 'buscando' : 'inicial')
  }

  function handleAplicarFiltros() {
    setActivoFilter(activoFilterPend)
    setPage(1)
  }

  function handleVerTodos() {
    setModo('todos')
    setPage(1)
  }

  function handleMostrarMenos() {
    setModo('inicial')
    setSearch('')
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
            placeholder="Buscar por nombre, apellido o email..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <Select value={activoFilterPend} onValueChange={setActivoFilterPend}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleAplicarFiltros}>
          <SlidersHorizontal className="size-3.5 mr-1.5" />
          Aplicar filtros
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
    </div>
  )
}
