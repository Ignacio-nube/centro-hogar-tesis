import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, SlidersHorizontal, List, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PaginationControls } from '@/components/common/PaginationControls'
import { ClienteDialog } from '@/features/clientes/components/ClienteDialog'
import { clientesService } from '@/features/clientes/services/clientesService'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { Cliente } from '@/types/app.types'

type Modo = 'inicial' | 'buscando' | 'todos'

const PAGE_SIZE_INICIAL = 5
const PAGE_SIZE_TODOS   = 15

export default function ClientesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canWrite = can('clientes.write')

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // filtros pendientes
  const [activoFilterPend, setActivoFilterPend] = useState<string>('activo')
  // filtros aplicados
  const [activoFilter, setActivoFilter] = useState<string>('activo')

  const [page, setPage] = useState(1)
  const [modo, setModo] = useState<Modo>('inicial')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const pageSize = modo === 'todos' ? PAGE_SIZE_TODOS : PAGE_SIZE_INICIAL

  const activoParam =
    activoFilter === 'activo' ? true : activoFilter === 'inactivo' ? false : undefined

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientes', debouncedSearch, activoFilter, page, modo],
    queryFn: () =>
      clientesService.list({
        search: debouncedSearch || undefined,
        activo: activoParam,
        sort: modo === 'todos' ? 'nombre' : 'recientes',
        page,
        pageSize,
      }),
    staleTime: modo === 'inicial' ? 1000 * 60 * 5 : 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientesService.delete(id),
    onSuccess: () => {
      toast.success('Cliente eliminado')
      qc.invalidateQueries({ queryKey: ['clientes'] })
      setDeleteId(null)
    },
    onError: () => toast.error('No se pudo eliminar el cliente'),
  })

  const toggleActivoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      clientesService.toggleActivo(id, activo),
    onSuccess: (updated) => {
      toast.success(updated.activo ? 'Cliente activado' : 'Cliente desactivado')
      qc.invalidateQueries({ queryKey: ['clientes'] })
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
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

  const columns: Column<Cliente>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (c) => <span className="font-medium">{c.apellido}, {c.nombre}</span>,
    },
    {
      key: 'dni',
      header: 'DNI',
      cell: (c) => c.dni ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      cell: (c) => c.telefono ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (c) => c.email ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'activo',
      header: 'Estado',
      className: 'w-20',
      cell: (c) => (
        <Switch
          size="sm"
          checked={c.activo}
          disabled={!canWrite || toggleActivoMutation.isPending}
          onCheckedChange={(checked) =>
            toggleActivoMutation.mutate({ id: c.id, activo: checked })
          }
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Alta',
      cell: (c) => (
        <span className="text-muted-foreground text-sm">{formatDate(c.created_at)}</span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            cell: (c: Cliente) => (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
                      tabIndex={-1}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => { setEditingCliente(c); setDialogOpen(true) }}
                    >
                      <Pencil className="size-3.5 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteId(c.id)}
                    >
                      <Trash2 className="size-3.5 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description={
          modo === 'inicial'
            ? '5 clientes más recientes'
            : `${totalCount} clientes encontrados`
        }
        action={
          canWrite ? (
            <Button onClick={() => { setEditingCliente(null); setDialogOpen(true) }}>
              <Plus data-icon="inline-start" />
              Nuevo cliente
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o DNI..."
            className="pl-9 focus-visible:border-brand"
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
          rowKey={(c) => c.id}
          emptyMessage="No se encontraron clientes."
          onRowClick={(c) => navigate(`/clientes/${c.id}`)}
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

      <ClienteDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingCliente(null) }}
        cliente={editingCliente}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['clientes'] }); setDialogOpen(false) }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Eliminar cliente"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
