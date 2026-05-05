import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, TrendingUp, ShoppingCart, CreditCard, Banknote, ArrowLeftRight, Download, Sheet } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ReporteVentasPDF } from '@/features/reportes/pdf/ReporteVentasPDF'
import { ReporteStockPDF } from '@/features/reportes/pdf/ReporteStockPDF'
import { ventasService } from '@/features/ventas/services/ventasService'
import { productosService } from '@/features/productos/services/productosService'
import { downloadBackupExcel } from '@/features/backup/backupService'
import { formatCurrency, formatDate } from '@/lib/utils'
import { format, startOfMonth } from 'date-fns'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { Venta } from '@/types/app.types'

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

const METODO_ICON: Record<string, React.ElementType> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: ArrowLeftRight,
}

function StatCard({ title, value, sub, icon: Icon, isLoading }: {
  title: string
  value: string
  sub?: string
  icon: React.ElementType
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completada: 'default',
  pendiente: 'secondary',
  cancelada: 'destructive',
}

export default function ReportesPage() {
  const today = new Date()
  const [fechaDesde, setFechaDesde] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [fechaHasta, setFechaHasta] = useState(format(today, 'yyyy-MM-dd'))
  const [metodoPago, setMetodoPago] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const [estado, setEstado] = useState('')
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)

  const { data: ventasData, isLoading: loadingVentas, isError: errorVentas, refetch: refetchVentas } = useQuery({
    queryKey: ['reportes-ventas', fechaDesde, fechaHasta, metodoPago, vendedorId, estado],
    queryFn: () =>
      ventasService.list({
        fechaDesde: new Date(fechaDesde).toISOString(),
        fechaHasta: new Date(fechaHasta + 'T23:59:59').toISOString(),
        metodoPago: metodoPago || undefined,
        vendedorId: vendedorId || undefined,
        estado: estado || undefined,
        pageSize: 500,
      }),
  })

  const { data: usuariosData } = useQuery({
    queryKey: ['ventas-vendedores'],
    queryFn: () => ventasService.listVendedores(),
  })

  const { data: productosData, isLoading: loadingProductos } = useQuery({
    queryKey: ['reportes-stock'],
    queryFn: () => productosService.list({ soloActivos: false, pageSize: 500 }),
  })
  const ventas = ventasData?.data ?? []
  const productos = productosData?.data ?? []

  const handleExcelExport = async () => {
    setIsDownloadingExcel(true)
    try {
      await downloadBackupExcel()
    } catch {
      // error silencioso — el toast lo maneja el servicio
    } finally {
      setIsDownloadingExcel(false)
    }
  }

  // Computed stats
  const totalVentas = ventas.length
  const montoTotal = ventas.reduce((acc, v) => acc + v.total_final, 0)
  const ticketPromedio = totalVentas > 0 ? montoTotal / totalVentas : 0

  // Breakdown por método de pago
  const byMetodo = ventas.reduce<Record<string, { count: number; total: number }>>((acc, v) => {
    const key = v.metodo_pago
    if (!acc[key]) acc[key] = { count: 0, total: 0 }
    acc[key].count += 1
    acc[key].total += v.total_final
    return acc
  }, {})

  const columns: Column<Venta>[] = [
    {
      key: 'numero_venta',
      header: '#',
      className: 'w-16',
      cell: (v) => (
        <span className="font-mono text-muted-foreground text-sm">
          {String(v.numero_venta).padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha',
      cell: (v) => <span className="text-sm">{formatDate(v.created_at)}</span>,
    },
    {
      key: 'cliente',
      header: 'Cliente',
      cell: (v) =>
        v.cliente ? (
          <span>{v.cliente.nombre} {v.cliente.apellido}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'vendedor',
      header: 'Vendedor',
      cell: (v) =>
        v.vendedor ? (
          <span className="text-sm">{v.vendedor.nombre} {v.vendedor.apellido}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'metodo_pago',
      header: 'Método',
      cell: (v) => (
        <Badge variant="outline">{METODO_LABEL[v.metodo_pago]}</Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (v) => (
        <Badge variant={ESTADO_VARIANT[v.estado] ?? 'outline'}>
          {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'total_final',
      header: 'Total',
      className: 'text-right',
      cell: (v) => <span className="font-semibold">{formatCurrency(v.total_final)}</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        description="Análisis de ventas y estado del stock"
      />

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Select
                value={estado || 'all'}
                onValueChange={(v) => setEstado((v as string) === 'all' ? '' : (v as string))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Método de pago</Label>
              <Select
                value={metodoPago || 'all'}
                onValueChange={(v) => setMetodoPago((v as string) === 'all' ? '' : (v as string))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Vendedor</Label>
              <Select
                value={vendedorId || 'all'}
                onValueChange={(v) => setVendedorId((v as string) === 'all' ? '' : (v as string))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(usuariosData ?? []).map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.nombre} {u.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator orientation="vertical" className="h-9 hidden sm:block" />
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={handleExcelExport}
                disabled={isDownloadingExcel}
              >
                <Sheet data-icon="inline-start" />
                {isDownloadingExcel ? 'Generando...' : 'Exportar Excel'}
              </Button>
              <PDFDownloadLink
                document={
                  <ReporteVentasPDF
                    ventas={ventas}
                    fechaDesde={fechaDesde}
                    fechaHasta={fechaHasta}
                    stats={{ totalVentas, montoTotal, ticketPromedio }}
                  />
                }
                fileName={`reporte-ventas-${fechaDesde}-${fechaHasta}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" disabled={loading || loadingVentas}>
                    <FileText data-icon="inline-start" />
                    {loading ? 'Generando...' : 'Reporte Ventas PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
              <PDFDownloadLink
                document={<ReporteStockPDF productos={productos} />}
                fileName={`reporte-stock-${format(today, 'yyyy-MM-dd')}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" disabled={loading || loadingProductos}>
                    <Download data-icon="inline-start" />
                    {loading ? 'Generando...' : 'Reporte Stock PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {errorVentas ? (
        <QueryErrorState
          message="No se pudieron cargar los datos de ventas."
          onRetry={() => refetchVentas()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total ventas"
              value={String(totalVentas)}
              sub="transacciones en el período"
              icon={ShoppingCart}
              isLoading={loadingVentas}
            />
            <StatCard
              title="Monto total"
              value={formatCurrency(montoTotal)}
              sub="suma de ventas completadas"
              icon={TrendingUp}
              isLoading={loadingVentas}
            />
            <StatCard
              title="Ticket promedio"
              value={formatCurrency(ticketPromedio)}
              sub="por transacción"
              icon={TrendingUp}
              isLoading={loadingVentas}
            />
          </div>

          {/* Breakdown por método */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desglose por método de pago</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVentas ? (
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 flex-1" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {Object.entries(byMetodo).map(([metodo, stats]) => {
                    const Icon = METODO_ICON[metodo] ?? Banknote
                    return (
                      <div
                        key={metodo}
                        className="flex items-center gap-3 rounded-lg border p-4"
                      >
                        <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Icon className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{METODO_LABEL[metodo]}</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.count} ventas · {formatCurrency(stats.total)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(byMetodo).length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-3">
                      No hay ventas en el período seleccionado.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla de ventas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle de ventas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={ventas}
                isLoading={loadingVentas}
                rowKey={(v) => v.id}
                emptyMessage="No hay ventas en el período seleccionado."
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
