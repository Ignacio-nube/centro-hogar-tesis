import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, List, MoreHorizontal } from 'lucide-react'
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

  const [searchInput, setSearchInput]     = useState('')
  const [searchApplied, setSearchApplied] = useState('')

  // estado: solo activo / inactivo (sin "todos"). Default: activo
  const [estadoPend, setEstadoPend] = useState<'activo' | 'inactivo'>('activo')
  const [estado, setEstado]         = useState<'activo' | 'inactivo'>('activo')

  const [page, setPage] = useState(1)
  const [modo, setModo] = useState<Modo>('inicial')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const pageSize = modo === 'todos' ? PAGE_SIZE_TODOS : PAGE_SIZE_INICIAL

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientes', searchApplied, estado, page, modo],
    queryFn: () =>
      clientesService.list({
        search: searchApplied || undefined,
        activo: estado === 'activo',
        sort: modo === 'todos' ? 'nombre' : 'recientes',
        page,
        pageSize,
        skipCount: modo === 'inicial',
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
    onMutate: async ({ id, activo }) => {
      await qc.cancelQueries({ queryKey: ['clientes'] })
      const snapshots = qc.getQueriesData<{ data: Cliente[]; count: number }>({ queryKey: ['clientes'] })
      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData(key, {
          ...value,
          data: value.data.map((c) => (c.id === id ? { ...c, activo } : c)),
        })
      }
      return { snapshots }
    },
    onError: (_err, _vars, ctx) => {
      // Revertir
      if (ctx?.snapshots) {
        for (const [key, value] of ctx.snapshots) qc.setQueryData(key, value)
      }
      toast.error('No se pudo actualizar el estado')
    },
    onSuccess: (updated) => {
      toast.success(updated.activo ? 'Cliente activado' : 'Cliente desactivado')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
    },
  })

  function buscar() {
    const s = searchInput.trim()
    setSearchApplied(s)
    setEstado(estadoPend)
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
    setEstadoPend('activo')
    setEstado('activo')
    setPage(1)
  }

  const totalCount = data?.count ?? 0
  const mostrarPaginacion = modo !== 'inicial'

  const columns: Column<Cliente>[] = useMemo(() => [
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
        // Wrapper con stopPropagation para evitar que Radix deje burbujear
        // el click al row y navegue al detalle (mismo patrón que la columna actions).
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Switch
            size="sm"
            checked={c.activo}
            disabled={!canWrite || toggleActivoMutation.isPending}
            onCheckedChange={(checked) =>
              toggleActivoMutation.mutate({ id: c.id, activo: checked })
            }
          />
        </div>
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
  ], [canWrite, toggleActivoMutation])

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
            placeholder="Buscar por nombre, apellido o DNI... (Enter para buscar)"
            className="pl-9 focus-visible:border-brand"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') buscar() }}
          />
        </div>

        <Select value={estadoPend} onValueChange={(v) => setEstadoPend(v as 'activo' | 'inactivo')}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>

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
