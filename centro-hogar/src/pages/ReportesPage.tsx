import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, TrendingUp, ShoppingCart, CreditCard, Banknote, ArrowLeftRight, Download, Sheet,
  Calendar, CalendarDays, CalendarRange,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/common/PageHeader'
import { downloadReporteVentasPDF, downloadReporteStockPDF } from '@/features/reportes/pdf/lazyDownload'
import { reportesService } from '@/features/reportes/services/reportesService'
import { productosService } from '@/features/productos/services/productosService'
import { downloadBackupExcel } from '@/features/backup/backupService'
import { formatCurrency } from '@/lib/utils'
import {
  format, startOfMonth, startOfWeek, subDays, subMonths,
} from 'date-fns'
import { QueryErrorState } from '@/components/ui/query-error-state'

// ─── Tipos internos ───────────────────────────────────────────────────────────

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

// ─── Perfiles de período ──────────────────────────────────────────────────────

type PerfilId = 'hoy' | 'semana' | '7dias' | 'mes' | 'mesAnterior' | 'personalizado'

interface Perfil {
  id: PerfilId
  label: string
  icon: React.ElementType
  getRange: () => { desde: string; hasta: string }
}

const hoy = () => new Date()
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

const PERFILES: Perfil[] = [
  {
    id: 'hoy',
    label: 'Hoy',
    icon: Calendar,
    getRange: () => ({ desde: fmt(hoy()), hasta: fmt(hoy()) }),
  },
  {
    id: 'semana',
    label: 'Esta semana',
    icon: CalendarDays,
    getRange: () => ({ desde: fmt(startOfWeek(hoy(), { weekStartsOn: 1 })), hasta: fmt(hoy()) }),
  },
  {
    id: '7dias',
    label: 'Últimos 7 días',
    icon: CalendarDays,
    getRange: () => ({ desde: fmt(subDays(hoy(), 6)), hasta: fmt(hoy()) }),
  },
  {
    id: 'mes',
    label: 'Este mes',
    icon: CalendarRange,
    getRange: () => ({ desde: fmt(startOfMonth(hoy())), hasta: fmt(hoy()) }),
  },
  {
    id: 'mesAnterior',
    label: 'Mes anterior',
    icon: CalendarRange,
    getRange: () => {
      const mesAnt = subMonths(hoy(), 1)
      return {
        desde: fmt(startOfMonth(mesAnt)),
        hasta: fmt(new Date(mesAnt.getFullYear(), mesAnt.getMonth() + 1, 0)),
      }
    },
  },
  {
    id: 'personalizado',
    label: 'Personalizado',
    icon: CalendarRange,
    getRange: () => ({ desde: fmt(startOfMonth(hoy())), hasta: fmt(hoy()) }),
  },
]

// ─── StatCard ─────────────────────────────────────────────────────────────────

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

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const today = new Date()
  const [perfilActivo, setPerfilActivo] = useState<PerfilId>('mes')
  const [fechaDesde, setFechaDesde] = useState(fmt(startOfMonth(today)))
  const [fechaHasta, setFechaHasta] = useState(fmt(today))
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)
  const [isDownloadingVentasPDF, setIsDownloadingVentasPDF] = useState(false)
  const [isDownloadingStockPDF, setIsDownloadingStockPDF] = useState(false)

  // Cuando se elige un perfil predefinido, actualizamos fechas automáticamente
  function seleccionarPerfil(perfil: Perfil) {
    setPerfilActivo(perfil.id)
    if (perfil.id !== 'personalizado') {
      const { desde, hasta } = perfil.getRange()
      setFechaDesde(desde)
      setFechaHasta(hasta)
    }
  }

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: resumen, isLoading, isError, refetch } = useQuery({
    queryKey: ['reportes-resumen', fechaDesde, fechaHasta],
    queryFn: () => reportesService.getResumen(fechaDesde, fechaHasta),
    staleTime: 1000 * 60 * 2, // 2 min
  })

  const { data: productosData, isLoading: loadingProductos } = useQuery({
    queryKey: ['reportes-stock'],
    queryFn: () => productosService.list({ soloActivos: false, pageSize: 500 }),
    staleTime: 1000 * 60 * 10, // 10 min — el stock cambia poco
  })

  const productos = productosData?.data ?? []

  // Datos derivados para los PDFs (compatibilidad con ReporteVentasPDF)
  const statsForPDF = {
    totalVentas:  resumen?.resumen.total_ventas  ?? 0,
    montoTotal:   resumen?.resumen.ingreso_total ?? 0,
    ticketPromedio: resumen?.resumen.ticket_promedio ?? 0,
  }

  const handleExcelExport = async () => {
    setIsDownloadingExcel(true)
    try {
      await downloadBackupExcel()
    } catch {
      // el toast lo maneja el servicio
    } finally {
      setIsDownloadingExcel(false)
    }
  }

  const porMetodo = resumen?.por_metodo ?? []
  const isPersonalizado = perfilActivo === 'personalizado'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        description="Análisis de ventas y estado del stock"
      />

      {/* ── Perfiles de período ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 flex flex-col gap-4">
          {/* Botones de perfil rápido */}
          <div className="flex flex-wrap gap-2">
            {PERFILES.map((p) => (
              <Button
                key={p.id}
                variant={perfilActivo === p.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => seleccionarPerfil(p)}
              >
                <p.icon className="size-3.5 mr-1.5" />
                {p.label}
              </Button>
            ))}
          </div>

          {/* Date pickers — solo editables en modo personalizado */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                disabled={!isPersonalizado}
                onChange={(e) => { setFechaDesde(e.target.value) }}
                className="w-40 disabled:opacity-60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                disabled={!isPersonalizado}
                onChange={(e) => { setFechaHasta(e.target.value) }}
                className="w-40 disabled:opacity-60"
              />
            </div>

            <Separator orientation="vertical" className="h-9 hidden sm:block" />

            {/* Exportaciones */}
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button
                variant="outline"
                onClick={handleExcelExport}
                disabled={isDownloadingExcel}
              >
                <Sheet className="size-4 mr-1.5" />
                {isDownloadingExcel ? 'Generando...' : 'Exportar Excel'}
              </Button>
              <Button
                variant="outline"
                disabled={isDownloadingVentasPDF || isLoading}
                onClick={async () => {
                  setIsDownloadingVentasPDF(true)
                  try {
                    await downloadReporteVentasPDF([], fechaDesde, fechaHasta, statsForPDF)
                  } catch (err) {
                    toast.error(`No se pudo generar el reporte: ${(err as Error).message}`)
                  } finally {
                    setIsDownloadingVentasPDF(false)
                  }
                }}
              >
                <FileText className="size-4 mr-1.5" />
                {isDownloadingVentasPDF ? 'Generando...' : 'Reporte Ventas PDF'}
              </Button>
              <Button
                variant="outline"
                disabled={isDownloadingStockPDF || loadingProductos}
                onClick={async () => {
                  setIsDownloadingStockPDF(true)
                  try {
                    await downloadReporteStockPDF(productos)
                  } catch (err) {
                    toast.error(`No se pudo generar el reporte: ${(err as Error).message}`)
                  } finally {
                    setIsDownloadingStockPDF(false)
                  }
                }}
              >
                <Download className="size-4 mr-1.5" />
                {isDownloadingStockPDF ? 'Generando...' : 'Reporte Stock PDF'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      {isError ? (
        <QueryErrorState
          message="No se pudieron cargar los datos del período."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total ventas"
              value={String(resumen?.resumen.total_ventas ?? 0)}
              sub="transacciones completadas en el período"
              icon={ShoppingCart}
              isLoading={isLoading}
            />
            <StatCard
              title="Monto total"
              value={formatCurrency(resumen?.resumen.ingreso_total ?? 0)}
              sub="suma de ventas completadas"
              icon={TrendingUp}
              isLoading={isLoading}
            />
            <StatCard
              title="Ticket promedio"
              value={formatCurrency(resumen?.resumen.ticket_promedio ?? 0)}
              sub="por transacción"
              icon={TrendingUp}
              isLoading={isLoading}
            />
          </div>

          {/* ── Desglose por método ─────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desglose por método de pago</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 flex-1" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {porMetodo.map((m) => {
                    const key = m.metodo_pago.toLowerCase()
                    const Icon = METODO_ICON[key] ?? Banknote
                    return (
                      <div key={m.metodo_pago} className="flex items-center gap-3 rounded-lg border p-4">
                        <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Icon className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {METODO_LABEL[key] ?? m.metodo_pago}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {m.cantidad} ventas · {formatCurrency(m.total)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {porMetodo.length === 0 && !isLoading && (
                    <p className="text-sm text-muted-foreground col-span-3">
                      No hay ventas en el período seleccionado.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Top productos ───────────────────────────────────────────── */}
          {(resumen?.productos_top?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Productos más vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {resumen!.productos_top.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono w-5 text-muted-foreground">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground">{p.codigo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(p.ingreso_total)}</p>
                        <p className="text-xs text-muted-foreground">{p.unidades_vendidas} uds.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Top vendedores ──────────────────────────────────────────── */}
          {(resumen?.por_vendedor?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ventas por vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {resumen!.por_vendedor.map((v, i) => (
                    <div key={v.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono w-5 text-muted-foreground">{i + 1}</span>
                        <p className="font-medium text-sm">{v.vendedor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(v.monto_total)}</p>
                        <p className="text-xs text-muted-foreground">{v.total_ventas} ventas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
