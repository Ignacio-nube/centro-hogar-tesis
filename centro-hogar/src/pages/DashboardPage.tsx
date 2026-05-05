import { useQuery } from '@tanstack/react-query'
import { TrendingUp, ShoppingCart, Users, AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ventasService } from '@/features/ventas/services/ventasService'
import { productosService } from '@/features/productos/services/productosService'
import { clientesService } from '@/features/clientes/services/clientesService'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/app/providers/AuthProvider'
import { ChartContainer } from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const chartConfig: ChartConfig = {
  total: { label: 'Ventas', color: 'var(--brand)' },
}

/* ─── Custom chart tooltip ──────────────────────────────────────────────── */
function ChartCustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{
        backgroundColor: 'oklch(0.145 0 0)',
        border: '1px solid var(--brand)',
        color: 'white',
      }}
    >
      <p className="font-medium mb-1 text-white/70">{label}</p>
      <p className="font-semibold">{formatCurrency(Number(payload[0].value))}</p>
    </div>
  )
}

/* ─── KPI Card ──────────────────────────────────────────────────────────── */
function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  isError,
  onRetry,
  highlighted = false,
}: {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  highlighted?: boolean
}) {
  return (
    <Card
      className={cn(
        'rounded-xl transition-shadow hover:shadow-md',
        highlighted
          ? 'border-0 text-white'
          : 'hover:border-brand/30',
      )}
      style={highlighted ? { backgroundColor: 'var(--brand)' } : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle
          className={cn(
            'text-sm font-medium',
            highlighted ? 'text-white/80' : 'text-muted-foreground',
          )}
        >
          {title}
        </CardTitle>
        <div
          className="rounded-lg p-2 shrink-0"
          style={{
            backgroundColor: highlighted ? 'rgba(255,255,255,0.2)' : 'var(--brand-muted)',
          }}
        >
          <Icon
            className={cn('size-4', highlighted ? 'text-white' : 'text-brand')}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton
            className={cn('h-9 w-32', highlighted && 'opacity-50')}
          />
        ) : isError ? (
          <div className="flex items-center gap-2">
            <span className={cn('text-xs', highlighted ? 'text-white/70' : 'text-destructive')}>Error</span>
            {onRetry && (
              <button onClick={onRetry} className={cn('flex items-center gap-1 text-xs underline', highlighted ? 'text-white/80' : 'text-destructive')}>
                <RefreshCw className="size-3" /> Reintentar
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={cn(
                'text-3xl font-bold tracking-tight',
                highlighted ? 'text-white' : '',
              )}
            >
              {value}
            </div>
            {description && (
              <p
                className={cn(
                  'text-xs mt-1',
                  highlighted ? 'text-white/70' : 'text-muted-foreground',
                )}
              >
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { profile } = useAuth()

  const { data: statsHoy, isLoading: loadingStats, isError: errorStats, refetch: refetchStats } = useQuery({
    queryKey: ['stats-hoy'],
    queryFn: () => ventasService.getStatsHoy(),
  })

  const { data: ventasPorDia, isLoading: loadingChart, isError: errorChart, refetch: refetchChart } = useQuery({
    queryKey: ['ventas-por-dia'],
    queryFn: () => ventasService.getVentasPorDia(14),
  })

  const { data: bajoStock, isLoading: loadingStock, isError: errorStock, refetch: refetchStock } = useQuery({
    queryKey: ['bajo-stock'],
    queryFn: () => productosService.getBajoStock(),
  })

  const { data: ultimasVentas, isLoading: loadingVentas, isError: errorVentas, refetch: refetchVentas } = useQuery({
    queryKey: ['ultimas-ventas'],
    queryFn: () => ventasService.list({ page: 1, pageSize: 5 }),
  })

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-count'],
    queryFn: () => clientesService.list({ pageSize: 1 }),
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-semibold">
          Buen día, {profile?.nombre} 👋
        </h2>
        <p className="text-sm text-muted-foreground">Resumen del día de hoy</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ventas hoy"
          value={String(statsHoy?.totalVentas ?? 0)}
          description="transacciones completadas"
          icon={ShoppingCart}
          isLoading={loadingStats}
          isError={errorStats}
          onRetry={() => refetchStats()}
        />
        {/* Recaudado — card destacada */}
        <KpiCard
          title="Recaudado hoy"
          value={formatCurrency(statsHoy?.montoTotal ?? 0)}
          description="monto total"
          icon={TrendingUp}
          isLoading={loadingStats}
          isError={errorStats}
          onRetry={() => refetchStats()}
          highlighted
        />
        <KpiCard
          title="Ticket promedio"
          value={formatCurrency(statsHoy?.ticketPromedio ?? 0)}
          description="por venta"
          icon={TrendingUp}
          isLoading={loadingStats}
          isError={errorStats}
          onRetry={() => refetchStats()}
        />
        <KpiCard
          title="Clientes"
          value={String(clientesData?.count ?? 0)}
          description="registrados en el sistema"
          icon={Users}
        />
      </div>

      {/* Chart + Bajo stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Area chart */}
        <Card className="lg:col-span-2 rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Ventas últimos 14 días</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingChart ? (
              <Skeleton className="h-48 w-full" />
            ) : errorChart ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="size-5 text-destructive" />
                <span>Error al cargar el gráfico</span>
                <button onClick={() => refetchChart()} className="flex items-center gap-1 text-xs underline hover:text-foreground">
                  <RefreshCw className="size-3" /> Reintentar
                </button>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ventasPorDia ?? []}>
                    <defs>
                      <linearGradient id="gradBrand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={(v) => v.slice(5)}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<ChartCustomTooltip />} cursor={{ stroke: 'var(--brand)', strokeWidth: 1, strokeDasharray: '4 2' }} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--brand)"
                      fill="url(#gradBrand)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Stock bajo mínimo — alert card */}
        <Card
          className="rounded-xl border-l-4"
          style={{ borderLeftColor: '#EF4444', backgroundColor: 'oklch(0.998 0.005 27)' }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" />
              Stock bajo mínimo
            </CardTitle>
            {(bajoStock?.length ?? 0) > 0 && (
              <Badge
                className="shrink-0 bg-red-100 text-red-700 border border-red-200 font-semibold"
              >
                {bajoStock!.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {loadingStock ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : errorStock ? (
              <div className="flex flex-col items-center gap-1.5 py-4 text-sm text-muted-foreground">
                <AlertTriangle className="size-4 text-destructive" />
                <span className="text-xs">Error al cargar</span>
                <button onClick={() => refetchStock()} className="flex items-center gap-1 text-xs underline hover:text-foreground">
                  <RefreshCw className="size-3" /> Reintentar
                </button>
              </div>
            ) : bajoStock?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todo el stock está OK ✓</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(bajoStock ?? []).slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-foreground">{p.nombre}</span>
                    <Badge
                      className={cn(
                        'shrink-0 ml-2 font-semibold',
                        p.stock_actual === 0
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-orange-100 text-orange-700 border border-orange-200',
                      )}
                    >
                      {p.stock_actual}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas ventas */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Últimas ventas</CardTitle>
          <CardDescription>Las 5 ventas más recientes</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingVentas ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : errorVentas ? (
            <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
              <AlertTriangle className="size-5 text-destructive" />
              <span>Error al cargar las últimas ventas</span>
              <button onClick={() => refetchVentas()} className="flex items-center gap-1 text-xs underline hover:text-foreground">
                <RefreshCw className="size-3" /> Reintentar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {(ultimasVentas?.data ?? []).map((venta) => (
                <div
                  key={venta.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-zinc-50 transition-colors text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{String(venta.numero_venta).padStart(4, '0')}
                    </span>
                    <span className="font-medium">
                      {venta.cliente
                        ? `${venta.cliente.nombre} ${venta.cliente.apellido}`
                        : 'Cliente ocasional'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(venta.created_at)}
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(venta.total_final)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
