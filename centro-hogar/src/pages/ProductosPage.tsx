import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, SlidersHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PaginationControls } from '@/components/common/PaginationControls'
import { ProductoDialog } from '@/features/productos/components/ProductoDialog'
import { productosService } from '@/features/productos/services/productosService'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency } from '@/lib/utils'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { Producto } from '@/types/app.types'

type Modo = 'inicial' | 'resultado'

const PAGE_SIZE_INICIAL   = 5
const PAGE_SIZE_RESULTADO = 15

export default function ProductosPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canWrite = can('productos.write')

  // --- búsqueda (NO dispara sola — se aplica con Enter o el botón) ---
  const [searchInput, setSearchInput]     = useState('')
  const [searchApplied, setSearchApplied] = useState('')

  // --- filtros pendientes (no aplicados aún) ---
  const [categoriaIdPend, setCategoriaIdPend] = useState<string>('')
  const [stockFilterPend, setStockFilterPend] = useState<string>('all')
  const [estadoPend, setEstadoPend] = useState<'activo' | 'inactivo'>('activo')

  // --- filtros aplicados (los que se mandan al backend) ---
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [estado, setEstado]           = useState<'activo' | 'inactivo'>('activo')

  const [page, setPage] = useState(1)
  const [modo, setModo] = useState<Modo>('inicial')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const pageSize = modo === 'inicial' ? PAGE_SIZE_INICIAL : PAGE_SIZE_RESULTADO

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['productos', modo, searchApplied, categoriaId, stockFilter, estado, page, pageSize],
    queryFn: () =>
      productosService.list({
        search: searchApplied || undefined,
        categoriaId: categoriaId || undefined,
        soloActivos:   estado === 'activo',
        soloInactivos: estado === 'inactivo',
        bajoStock: stockFilter === 'bajo',
        conStock:  stockFilter === 'con',
        sort: modo === 'inicial' ? 'top' : 'nombre',
        page,
        pageSize,
        skipCount: modo === 'inicial',
      }),
    staleTime: modo === 'inicial' ? 1000 * 60 * 5 : 0,
  })

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => productosService.listCategorias(),
    staleTime: 1000 * 60 * 10,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productosService.delete(id),
    onSuccess: () => {
      toast.success('Producto eliminado')
      qc.invalidateQueries({ queryKey: ['productos'] })
      setDeleteId(null)
    },
    onError: () => toast.error('No se pudo eliminar el producto'),
  })

  const toggleActivoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      productosService.toggleActivo(id, activo),
    onSuccess: (updated) => {
      toast.success(updated.activo ? 'Producto activado' : 'Producto desactivado')
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
  })

  function aplicar() {
    const s = searchInput.trim()
    setSearchApplied(s)
    setCategoriaId(categoriaIdPend)
    setStockFilter(stockFilterPend)
    setEstado(estadoPend)
    setPage(1)
    const hayAlgo = !!(s || categoriaIdPend || stockFilterPend !== 'all' || estadoPend !== 'activo')
    setModo(hayAlgo ? 'resultado' : 'inicial')
  }

  function limpiar() {
    setSearchInput('')
    setSearchApplied('')
    setCategoriaIdPend(''); setStockFilterPend('all'); setEstadoPend('activo')
    setCategoriaId('');     setStockFilter('all');     setEstado('activo')
    setPage(1)
    setModo('inicial')
  }

  const totalCount = data?.count ?? 0

  const columns: Column<Producto>[] = useMemo(() => [
    {
      key: 'codigo',
      header: 'Código',
      className: 'w-28',
      cell: (p) => (
        <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Producto',
      cell: (p) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{p.nombre}</span>
          {p.categoria && (
            <span className="inline-block w-fit bg-zinc-100 text-zinc-500 text-xs px-1.5 py-0.5 rounded">
              {p.categoria.nombre}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'precio_venta',
      header: 'Precio venta',
      className: 'text-right',
      cell: (p) => (
        <span className="font-semibold">{formatCurrency(p.precio_venta)}</span>
      ),
    },
    {
      key: 'precio_costo',
      header: 'Costo',
      className: 'text-right',
      cell: (p) => (
        <span className="text-muted-foreground">{formatCurrency(p.precio_costo)}</span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      className: 'text-center w-24',
      cell: (p) => {
        if (p.stock_actual === 0) {
          return (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 border border-red-200">
              {p.stock_actual}
            </span>
          )
        }
        if (p.stock_actual <= p.stock_minimo) {
          return (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              {p.stock_actual}
            </span>
          )
        }
        return <span className="text-sm">{p.stock_actual}</span>
      },
    },
    {
      key: 'activo',
      header: 'Estado',
      className: 'w-20',
      cell: (p) => (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Switch
            size="sm"
            checked={p.activo}
            disabled={!canWrite || toggleActivoMutation.isPending}
            onCheckedChange={(checked) =>
              toggleActivoMutation.mutate({ id: p.id, activo: checked })
            }
          />
        </div>
      ),
    },
    ...(canWrite
      ? [{
          key: 'actions',
          header: '',
          className: 'w-20',
          cell: (p: Producto) => (
            <div className="flex items-center gap-1 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={(e) => { e.stopPropagation(); setEditingProducto(p); setDialogOpen(true) }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); setDeleteId(p.id) }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ),
        }]
      : []),
  ], [canWrite, toggleActivoMutation])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Productos"
        description={
          modo === 'inicial'
            ? 'Top 5 más vendidos en el último año'
            : `${totalCount} productos encontrados`
        }
        action={
          canWrite ? (
            <Button onClick={() => { setEditingProducto(null); setDialogOpen(true) }}>
              <Plus data-icon="inline-start" />
              Nuevo producto
            </Button>
          ) : undefined
        }
      />

      {/* Buscador + filtros */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código... (Enter para buscar)"
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') aplicar() }}
            />
          </div>

          <Select
            value={categoriaIdPend || 'all'}
            onValueChange={(v) => setCategoriaIdPend(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {(categorias ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stockFilterPend}
            onValueChange={setStockFilterPend}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los stocks</SelectItem>
              <SelectItem value="con">Con stock</SelectItem>
              <SelectItem value="bajo">Bajo stock</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={estadoPend}
            onValueChange={(v) => setEstadoPend(v as 'activo' | 'inactivo')}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="inactivo">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" onClick={aplicar}>
            <SlidersHorizontal className="size-3.5 mr-1.5" />
            Aplicar filtros
          </Button>

          {modo === 'resultado' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={limpiar}
            >
              <X className="size-3.5 mr-1.5" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          rowKey={(p) => p.id}
          emptyMessage="No se encontraron productos."
          onRowClick={(p) => navigate(`/productos/${p.id}`)}
        />
      )}

      {modo === 'resultado' && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={totalCount}
          onPageChange={setPage}
        />
      )}

      <ProductoDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingProducto(null) }}
        producto={editingProducto}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['productos'] }); setDialogOpen(false) }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Eliminar producto"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
