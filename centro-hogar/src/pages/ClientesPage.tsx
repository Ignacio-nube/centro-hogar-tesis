import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, MoreHorizontal, List } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { ClienteDialog } from '@/features/clientes/components/ClienteDialog'
import { clientesService } from '@/features/clientes/services/clientesService'
import { usePermissions } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { Cliente } from '@/types/app.types'

const PAGE_SIZE_DEFAULT = 5
const PAGE_SIZE_EXPANDED = 10

export default function ClientesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canWrite = can('clientes.write')

  const [search, setSearch] = useState('')
  const [activoFilter, setActivoFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [verTodos, setVerTodos] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const pageSize = verTodos ? PAGE_SIZE_EXPANDED : PAGE_SIZE_DEFAULT

  const activoParam =
    activoFilter === 'activo' ? true : activoFilter === 'inactivo' ? false : undefined

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientes', debouncedSearch, activoFilter, page, pageSize],
    queryFn: () =>
      clientesService.list({ search: debouncedSearch, activo: activoParam, page, pageSize }),
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
      className: 'w-28',
      cell: (c) => (
        <button
          className="cursor-pointer"
          title={c.activo ? 'Clic para desactivar' : 'Clic para activar'}
          onClick={(e) => {
            e.stopPropagation()
            if (canWrite) toggleActivoMutation.mutate({ id: c.id, activo: !c.activo })
          }}
        >
          {c.activo ? (
            <Badge className="bg-green-100 text-green-700 border border-green-200 hover:opacity-80 transition-opacity font-medium">
              Activo
            </Badge>
          ) : (
            <Badge className="bg-zinc-100 text-zinc-500 border border-zinc-200 hover:opacity-80 transition-opacity font-medium">
              Inactivo
            </Badge>
          )}
        </button>
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
                      onClick={() => {
                        setEditingCliente(c)
                        setDialogOpen(true)
                      }}
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

  const totalCount = data?.count ?? 0
  const hayMas = page * pageSize < totalCount

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description={
          <span className="inline-flex items-center gap-1.5">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--brand-muted)',
                color: 'var(--brand)',
                border: '1px solid oklch(0.61 0.146 52 / 0.2)',
              }}
            >
              {totalCount}
            </span>
            <span className="text-sm text-muted-foreground">clientes registrados</span>
          </span>
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

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o DNI..."
            className="pl-9 focus-visible:border-brand"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select
          value={activoFilter}
          onValueChange={(v) => { setActivoFilter(v as string); setPage(1) }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>

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
          rowKey={(c) => c.id}
          emptyMessage="No se encontraron clientes."
          onRowClick={(c) => navigate(`/clientes/${c.id}`)}
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
