import { useQuery } from '@tanstack/react-query'
import { TrendingUp, ShoppingCart, Users, AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ventasService } from '@/features/ventas/services/ventasService'
import { productosService } from '@/features/productos/services/productosService'
import { clientesService } from '@/features/clientes/services/clientesService'
import { reportesService } from '@/features/reportes/services/reportesService'
import type { DashboardData } from '@/features/reportes/services/reportesService'
import { formatCurrency } from '@/lib/utils'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

// ─── Paleta de colores para categorías ────────────────────────────────────────
// Cada posición tiene: [base, shade1, shade2, shade3, shade4 (Otros)]
const CAT_PALETTES = [
  ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'], // indigo
  ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'], // amber
  ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'], // emerald
  ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'], // red
  ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'], // violet
  ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'], // cyan
]

function getCatColor(catIndex: number, prodIndex: number): string {
  const palette = CAT_PALETTES[catIndex % CAT_PALETTES.length] ?? CAT_PALETTES[0]
  return palette[Math.min(prodIndex, palette.length - 1)] ?? palette[0]
}

const areaChartConfig: ChartConfig = {
  total: { label: 'Ventas', color: 'var(--brand)' },
}

// ─── Custom tooltip area chart ────────────────────────────────────────────────
function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: 'oklch(0.145 0 0)', border: '1px solid var(--brand)', color: 'white' }}
    >
      <p className="font-medium mb-1 text-white/70">{label}</p>
      <p className="font-semibold">{formatCurrency(Number(payload[0].value))}</p>
    </div>
  )
}

// ─── Custom tooltip donut ────────────────────────────────────────────────────
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: 'oklch(0.145 0 0)', border: `1px solid ${entry.payload.fill}`, color: 'white' }}
    >
      <p className="font-semibold">{entry.name}</p>
      <p className="text-white/70">{entry.value} unidades</p>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, description, icon: Icon, isLoading, isError, onRetry, highlighted = false,
}: {
  title: string; value: string; description?: string; icon: LucideIcon
  isLoading?: boolean; isError?: boolean; onRetry?: () => void; highlighted?: boolean
}) {
  return (
    <Card
      className={cn('rounded-xl transition-shadow hover:shadow-md', highlighted ? 'border-0 text-white' : 'hover:border-brand/30')}
      style={highlighted ? { backgroundColor: 'var(--brand)' } : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={cn('text-sm font-medium', highlighted ? 'text-white/80' : 'text-muted-foreground')}>
          {title}
        </CardTitle>
        <div
          className="rounded-lg p-2 shrink-0"
          style={{ backgroundColor: highlighted ? 'rgba(255,255,255,0.2)' : 'var(--brand-muted)' }}
        >
          <Icon className={cn('size-4', highlighted ? 'text-white' : 'text-brand')} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className={cn('h-9 w-32', highlighted && 'opacity-50')} />
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
            <div className={cn('text-3xl font-bold tracking-tight', highlighted ? 'text-white' : '')}>{value}</div>
            {description && (
              <p className={cn('text-xs mt-1', highlighted ? 'text-white/70' : 'text-muted-foreground')}>{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Donut anidado ────────────────────────────────────────────────────────────
function DonutCategorias({ data, isLoading, isError, onRetry }: {
  data: DashboardData | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  if (isLoading) return <Skeleton className="h-72 w-full" />
  if (isError) return (
    <div className="flex h-72 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <AlertTriangle className="size-5 text-destructive" />
      <span>Error al cargar el gráfico</span>
      <button onClick={onRetry} className="flex items-center gap-1 text-xs underline hover:text-foreground">
        <RefreshCw className="size-3" /> Reintentar
      </button>
    </div>
  )
  if (!data) return null

  const cats    = data.categorias_top
  const prods   = data.productos_por_categoria

  // Datos anillo interior (categorías)
  const innerData = cats.map((c, i) => ({
    name:  c.categoria,
    value: c.unidades,
    fill:  getCatColor(i, 0),
  }))

  // Datos anillo exterior (productos por categoría), coloreados por su categoría madre
  const outerData = prods.map((p) => {
    const catIdx = cats.findIndex((c) => c.categoria === p.categoria)
    const prodIdx = prods
      .filter((x) => x.categoria === p.categoria)
      .findIndex((x) => x.producto === p.producto)
    return {
      name:  p.producto === 'Otros' ? `Otros (${p.categoria})` : p.producto,
      value: p.unidades,
      fill:  getCatColor(catIdx, prodIdx + 1),
    }
  })

  // Leyenda solo para categorías (anillo interior)
  const renderLegend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
      {innerData.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block size-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.fill }} />
          {entry.name}
        </div>
      ))}
    </div>
  )

  const isEmpty = innerData.length === 0

  return (
    <div>
      {isEmpty ? (
        <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
          Sin datos de ventas aún
        </div>
      ) : (
        <>
          <ChartContainer config={{}} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Anillo interior — categorías */}
                <Pie
                  data={innerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="50%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {innerData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                {/* Anillo exterior — productos */}
                <Pie
                  data={outerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="54%"
                  outerRadius="72%"
                  paddingAngle={1}
                  strokeWidth={0}
                >
                  {outerData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          {renderLegend()}
        </>
      )}
    </div>
  )
}

// ─── Card Top Vendedores ──────────────────────────────────────────────────────
function CardVendedores({ data, isLoading, isError, onRetry }: {
  data: DashboardData | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const vendedores = data?.vendedores_top ?? []

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
          <AlertTriangle className="size-5 text-destructive" />
          <span>Error al cargar</span>
          <button onClick={onRetry} className="flex items-center gap-1 text-xs underline hover:text-foreground">
            <RefreshCw className="size-3" /> Reintentar
          </button>
        </div>
      ) : vendedores.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Sin datos de ventas aún</p>
      ) : (
        <div className="flex flex-col gap-1">
          {vendedores.map((v, i) => {
            const parts   = v.vendedor.trim().split(' ')
            const initials = parts.length >= 2
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              : v.vendedor.slice(0, 2).toUpperCase()
            return (
              <div key={i} className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-zinc-50 transition-colors">
                {/* Posición */}
                <span className="w-4 text-center text-xs font-bold text-muted-foreground shrink-0">{i + 1}</span>
                {/* Avatar */}
                <div
                  className="size-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ backgroundColor: CAT_PALETTES[i % CAT_PALETTES.length][3], color: CAT_PALETTES[i % CAT_PALETTES.length][0] }}
                >
                  {initials}
                </div>
                {/* Nombre + stats */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{v.vendedor}</span>
                  <span className="text-xs text-muted-foreground">{v.total_ventas} ventas</span>
                </div>
                <span className="text-sm font-bold text-green-600 shrink-0">{formatCurrency(v.monto_total)}</span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { profile } = useAuth()

  const { data: statsHoy, isLoading: loadingStats, isError: errorStats, refetch: refetchStats } = useQuery({
    queryKey: ['stats-hoy'],
    queryFn: () => ventasService.getStatsHoy(),
    staleTime: 1000 * 60 * 2,
  })

  const { data: ventasPorDia, isLoading: loadingChart, isError: errorChart, refetch: refetchChart } = useQuery({
    queryKey: ['ventas-por-dia'],
    queryFn: () => ventasService.getVentasPorDia(14),
    staleTime: 1000 * 60 * 5,
  })

  const { data: bajoStock, isLoading: loadingStock, isError: errorStock, refetch: refetchStock } = useQuery({
    queryKey: ['bajo-stock'],
    queryFn: () => productosService.getBajoStock(),
    staleTime: 1000 * 60 * 5,
  })

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-count'],
    queryFn: () => clientesService.list({ pageSize: 1 }),
    staleTime: 1000 * 60 * 10,
  })

  const { data: dashData, isLoading: loadingDash, isError: errorDash, refetch: refetchDash } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => reportesService.getDashboardData(),
    staleTime: 1000 * 60 * 10,
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

      {/* Fila 2: Area chart + Stock bajo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
              <ChartContainer config={areaChartConfig} className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ventasPorDia ?? []}>
                    <defs>
                      <linearGradient id="gradBrand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--brand)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
                    <XAxis dataKey="fecha" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<AreaTooltip />} cursor={{ stroke: 'var(--brand)', strokeWidth: 1, strokeDasharray: '4 2' }} />
                    <Area type="monotone" dataKey="total" stroke="var(--brand)" fill="url(#gradBrand)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Stock bajo mínimo */}
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
              <Badge className="shrink-0 bg-red-100 text-red-700 border border-red-200 font-semibold">
                {bajoStock!.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {loadingStock ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
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

      {/* Fila 3: Donut anidado + Top vendedores */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Donut: categorías (interior) + productos (exterior) */}
        <Card className="lg:col-span-2 rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Productos más vendidos por categoría</CardTitle>
            <p className="text-xs text-muted-foreground">
              Último mes · Anillo interior: categorías · Anillo exterior: productos
            </p>
          </CardHeader>
          <CardContent>
            <DonutCategorias
              data={dashData}
              isLoading={loadingDash}
              isError={errorDash}
              onRetry={() => refetchDash()}
            />
          </CardContent>
        </Card>

        {/* Top 5 vendedores */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top vendedores</CardTitle>
            <p className="text-xs text-muted-foreground">Por monto total — último mes</p>
          </CardHeader>
          <CardContent>
            <CardVendedores
              data={dashData}
              isLoading={loadingDash}
              isError={errorDash}
              onRetry={() => refetchDash()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
