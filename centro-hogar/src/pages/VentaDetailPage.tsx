import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, User, CreditCard, Banknote, ArrowLeftRight, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { TicketPDF } from '@/features/reportes/pdf/TicketPDF'
import { ventasService } from '@/features/ventas/services/ventasService'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { CartItem, VentaItem } from '@/types/app.types'

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completada: 'default',
  pendiente: 'secondary',
  cancelada: 'destructive',
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

const TARJETA_LABEL: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  naranja: 'Naranja X',
  debito: 'Débito',
}

const METODO_ICON: Record<string, React.ElementType> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: ArrowLeftRight,
}

function ventaItemsToCartItems(items: VentaItem[]): CartItem[] {
  return items.map((item) => ({
    producto: item.producto ?? {
      id: item.producto_id,
      codigo: '',
      nombre: 'Producto',
      precio_venta: item.precio_unitario,
      descripcion: null,
      categoria_id: null,
      categoria: undefined,
      precio_costo: 0,
      stock_actual: 0,
      stock_minimo: 0,
      imagen_url: null,
      activo: true,
      created_at: '',
      updated_at: '',
    },
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    subtotal: item.subtotal,
  }))
}

export default function VentaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = usePermissions()
  const canWrite = can('ventas.write')

  const { data: venta, isLoading, isError, refetch } = useQuery({
    queryKey: ['venta', id],
    queryFn: () => ventasService.getById(id!),
    enabled: !!id,
  })

  const cancelarMutation = useMutation({
    mutationFn: () => ventasService.cancelar(id!),
    onSuccess: () => {
      toast.success('Venta cancelada')
      qc.invalidateQueries({ queryKey: ['venta', id] })
      qc.invalidateQueries({ queryKey: ['ventas'] })
    },
    onError: () => toast.error('No se pudo cancelar la venta'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-16">
        <QueryErrorState onRetry={() => refetch()} />
        <Button variant="outline" onClick={() => navigate('/ventas')}>
          <ArrowLeft data-icon="inline-start" />
          Volver a Ventas
        </Button>
      </div>
    )
  }

  if (!venta) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-16">
        <p className="text-muted-foreground">Venta no encontrada.</p>
        <Button variant="outline" onClick={() => navigate('/ventas')}>
          <ArrowLeft data-icon="inline-start" />
          Volver a Ventas
        </Button>
      </div>
    )
  }

  const items = ventaItemsToCartItems(venta.items ?? [])
  const MetodoIcon = METODO_ICON[venta.metodo_pago] ?? Banknote
  const cuotaMonto = venta.cuotas > 1 ? venta.total_final / venta.cuotas : null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigate('/ventas')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              Venta #{String(venta.numero_venta).padStart(4, '0')}
            </h1>
            <Badge variant={ESTADO_VARIANT[venta.estado] ?? 'outline'}>
              {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDateTime(venta.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PDFDownloadLink
            document={<TicketPDF venta={venta} items={items} />}
            fileName={`ticket-${venta.numero_venta}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" size="sm" disabled={loading}>
                <Download data-icon="inline-start" className="size-3.5" />
                {loading ? 'Generando...' : 'Descargar ticket'}
              </Button>
            )}
          </PDFDownloadLink>
          {canWrite && venta.estado !== 'cancelada' && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => cancelarMutation.mutate()}
              disabled={cancelarMutation.isPending}
            >
              Cancelar venta
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna principal: items */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="size-4" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-6 py-3 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.producto.codigo && (
                          <span className="font-mono mr-1">{item.producto.codigo}</span>
                        )}
                        {formatCurrency(item.precio_unitario)} × {item.cantidad}
                      </p>
                    </div>
                    <span className="font-semibold shrink-0">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground px-6 py-4">Sin items.</p>
                )}
              </div>

              <Separator />

              {/* Totales */}
              <div className="px-6 py-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(venta.subtotal)}</span>
                </div>
                {venta.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span className="text-destructive">— {formatCurrency(venta.descuento)}</span>
                  </div>
                )}
                {venta.interes_porcentaje > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Interés ({venta.interes_porcentaje}%)</span>
                    <span>+ {formatCurrency(venta.interes_monto)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(venta.total_final)}</span>
                </div>
                {cuotaMonto && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{venta.cuotas} cuotas de</span>
                    <span>{formatCurrency(cuotaMonto)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral: info */}
        <div className="flex flex-col gap-4">
          {/* Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MetodoIcon className="size-4" />
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">{METODO_LABEL[venta.metodo_pago]}</span>
              </div>
              {venta.tarjeta_tipo && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tarjeta</span>
                  <span>{TARJETA_LABEL[venta.tarjeta_tipo]}</span>
                </div>
              )}
              {venta.cuotas > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cuotas</span>
                  <span>{venta.cuotas}x de {formatCurrency(cuotaMonto ?? 0)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="size-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {venta.cliente ? (
                <div className="flex flex-col gap-1">
                  <Button
                    variant="link"
                    className="h-auto p-0 justify-start font-medium"
                    render={<Link to={`/clientes/${venta.cliente.id}`} />}
                    nativeButton={false}
                  >
                    {venta.cliente.nombre} {venta.cliente.apellido}
                  </Button>
                  {(venta.cliente as { dni?: string }).dni && (
                    <p className="text-xs text-muted-foreground">
                      DNI: {(venta.cliente as { dni?: string }).dni}
                    </p>
                  )}
                  {(venta.cliente as { telefono?: string }).telefono && (
                    <p className="text-xs text-muted-foreground">
                      Tel: {(venta.cliente as { telefono?: string }).telefono}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Venta sin cliente (mostrador)</p>
              )}
            </CardContent>
          </Card>

          {/* Vendedor */}
          {venta.vendedor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-4" />
                  Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{venta.vendedor.nombre} {venta.vendedor.apellido}</p>
              </CardContent>
            </Card>
          )}

          {/* Notas */}
          {venta.notas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{venta.notas}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
