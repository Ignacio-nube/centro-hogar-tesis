import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Package, Tag, TrendingUp, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ProductoDialog } from '@/features/productos/components/ProductoDialog'
import { productosService } from '@/features/productos/services/productosService'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useState } from 'react'
import { QueryErrorState } from '@/components/ui/query-error-state'

export default function ProductoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = usePermissions()
  const canWrite = can('productos.write')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: producto, isLoading, isError, refetch } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => productosService.getById(id!),
    enabled: !!id,
  })

  const toggleActivoMutation = useMutation({
    mutationFn: ({ activo }: { activo: boolean }) =>
      productosService.toggleActivo(id!, activo),
    onSuccess: (updated) => {
      toast.success(updated.activo ? 'Producto activado' : 'Producto desactivado')
      qc.invalidateQueries({ queryKey: ['producto', id] })
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-16">
        <QueryErrorState onRetry={() => refetch()} />
        <Button variant="outline" onClick={() => navigate('/productos')}>
          <ArrowLeft data-icon="inline-start" />
          Volver a Productos
        </Button>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-16">
        <p className="text-muted-foreground">Producto no encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/productos')}>
          <ArrowLeft data-icon="inline-start" />
          Volver a Productos
        </Button>
      </div>
    )
  }

  const stockBajo = producto.stock_actual <= producto.stock_minimo
  const stockWarning = !stockBajo && producto.stock_actual <= producto.stock_minimo * 1.5
  const margen = producto.precio_costo > 0
    ? ((producto.precio_venta - producto.precio_costo) / producto.precio_costo) * 100
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigate('/productos')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{producto.nombre}</h1>
            <button
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={toggleActivoMutation.isPending}
              title={producto.activo ? 'Clic para desactivar' : 'Clic para activar'}
              onClick={() => {
                if (canWrite) toggleActivoMutation.mutate({ activo: !producto.activo })
              }}
            >
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-opacity',
                  canWrite && 'hover:opacity-80',
                  producto.activo
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200',
                )}
              >
                {producto.activo ? 'Activo' : 'Inactivo'}
              </span>
            </button>
            {stockBajo && (
              <Badge variant="destructive" className="gap-1.5">
                {/* Pulsating dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-200" />
                </span>
                Stock bajo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-sm text-muted-foreground">{producto.codigo}</span>
            {producto.categoria && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{producto.categoria.nombre}</span>
              </>
            )}
          </div>
        </div>
        {canWrite && (
          <Button
            variant="outline"
            size="sm"
            className="border-brand text-brand hover:bg-brand hover:text-white transition-colors"
            onClick={() => setDialogOpen(true)}
          >
            <Pencil data-icon="inline-start" className="size-3.5" />
            Editar
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Precio de venta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precio de venta</CardTitle>
            <Tag className="size-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(producto.precio_venta)}</div>
          </CardContent>
        </Card>

        {/* Precio de costo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precio de costo</CardTitle>
            <Tag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(producto.precio_costo)}</div>
          </CardContent>
        </Card>

        {/* Margen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margen</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {margen !== null ? `${margen.toFixed(1)}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">sobre costo</p>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card className={cn(stockBajo ? 'bg-red-50 border-red-200' : '')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock</CardTitle>
            <Package className={cn('size-4', stockBajo ? 'text-red-400' : 'text-muted-foreground')} />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-3xl font-bold',
                stockBajo ? 'text-red-600' : stockWarning ? 'text-amber-600' : '',
              )}
            >
              {producto.stock_actual}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mínimo: {producto.stock_minimo}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details — 2-col grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="size-4" />
              Información del producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Código</span>
                <span className="font-mono font-medium">{producto.codigo}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Categoría</span>
                <span className="font-medium">{producto.categoria?.nombre ?? '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descripción</span>
                <span className="text-right max-w-48 font-medium">
                  {producto.descripcion ?? <span className="text-muted-foreground font-normal">—</span>}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Alta</span>
                <span className="font-medium">{formatDate(producto.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Última actualización</span>
                <span className="font-medium">{formatDate(producto.updated_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4" />
              Stock y precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock actual</span>
                <span className={cn('font-semibold', stockBajo ? 'text-red-600' : '')}>
                  {producto.stock_actual} unidades
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock mínimo</span>
                <span className="font-medium">{producto.stock_minimo} unidades</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Precio de costo</span>
                <span className="font-medium">{formatCurrency(producto.precio_costo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Precio de venta</span>
                <span className="font-bold">{formatCurrency(producto.precio_venta)}</span>
              </div>
              {margen !== null && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia por unidad</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(producto.precio_venta - producto.precio_costo)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Margen</span>
                    <span className="font-semibold text-green-600">{margen.toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProductoDialog
        open={dialogOpen}
        onOpenChange={(v) => setDialogOpen(v)}
        producto={producto}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['producto', id] })
          qc.invalidateQueries({ queryKey: ['productos'] })
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
