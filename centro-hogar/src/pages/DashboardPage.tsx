import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { TrendingUp, ShoppingCart, Users, AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ventasService } from '@/features/ventas/services/ventasService'
import { productosService } from '@/features/productos/services/productosService'
import { clientesService } from '@/features/clientes/services/clientesService'
import { reportesService } from '@/features/reportes/services/reportesService'
import type { DashboardData, DashboardPeriodo } from '@/features/reportes/services/reportesService'
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
// 12 paletas para soportar hasta 12 categorías distintas en el donut.
const CAT_PALETTES = [
  ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'], // indigo
  ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'], // amber
  ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'], // emerald
  ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'], // red
  ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'], // violet
  ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'], // cyan
  ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3'], // pink
  ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'], // teal
  ['#84cc16', '#a3e635', '#bef264', '#d9f99d', '#ecfccb'], // lime
  ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'], // rose
  ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'], // sky
  ['#d946ef', '#e879f9', '#f0abfc', '#f5d0fe', '#fae8ff'], // fuchsia
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

// ─── Active shape del donut (slice seleccionado se expande) ──────────────────
function ActiveSlice(props: any) {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle, fill,
  } = props

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const expandedOuter = outerRadius + 8
  const expandedInner = innerRadius - 2

  const cos1 = Math.cos(-toRad(startAngle))
  const sin1 = Math.sin(-toRad(startAngle))
  const cos2 = Math.cos(-toRad(endAngle))
  const sin2 = Math.sin(-toRad(endAngle))

  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  const ox1 = cx + expandedOuter * cos1
  const oy1 = cy + expandedOuter * sin1
  const ox2 = cx + expandedOuter * cos2
  const oy2 = cy + expandedOuter * sin2
  const ix1 = cx + expandedInner * cos2
  const iy1 = cy + expandedInner * sin2
  const ix2 = cx + expandedInner * cos1
  const iy2 = cy + expandedInner * sin1

  const d = [
    `M ${ox1} ${oy1}`,
    `A ${expandedOuter} ${expandedOuter} 0 ${largeArc} 0 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${expandedInner} ${expandedInner} 0 ${largeArc} 1 ${ix2} ${iy2}`,
    'Z',
  ].join(' ')

  return (
    <path
      d={d}
      fill={fill}
      stroke="white"
      strokeWidth={2}
    />
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

// ─── Custom tooltip donut con % ──────────────────────────────────────────────
function DonutTooltipPct({ active, payload, totalUnidades }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const pct = totalUnidades > 0 ? ((entry.value / totalUnidades) * 100).toFixed(1) : '0'
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: 'oklch(0.145 0 0)', border: `1px solid ${entry.payload.fill}`, color: 'white' }}
    >
      <p className="font-semibold mb-0.5">{entry.name}</p>
      <p className="text-white/70">{entry.value} unidades · {pct}%</p>
      {entry.payload.ingreso > 0 && (
        <p className="text-white/70">{formatCurrency(entry.payload.ingreso)}</p>
      )}
    </div>
  )
}

// ─── Gráfico: donut categorías + panel lateral productos ─────────────────────
const ALL_KEY = '__all__'

function GraficoCategorias({ data, isLoading, isError, onRetry, periodo }: {
  data: DashboardData | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  periodo: DashboardPeriodo
}) {
  const [selectedCat, setSelectedCat] = useState<string>(ALL_KEY)

  const handleSliceClick = useCallback((entry: any) => {
    setSelectedCat((prev) => prev === entry.name ? ALL_KEY : entry.name)
  }, [])

  const periodoLabel = periodo === 'semana' ? 'la última semana'
                     : periodo === 'mes' ? 'el último mes'
                     : periodo === 'trimestre' ? 'el último trimestre'
                     : 'el último año'

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

  const cats  = data.categorias_top
  const prods = data.productos_por_categoria

  if (cats.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Sin datos de ventas en {periodoLabel}
      </div>
    )
  }

  // Datos del donut (solo categorías) + totales para mostrar al centro / %
  const donutData = cats.map((c, i) => ({
    name:    c.categoria,
    value:   c.unidades,
    ingreso: c.ingreso,
    fill:    getCatColor(i, 0),
    index:   i,
  }))

  const totalUnidades = donutData.reduce((acc, d) => acc + d.value, 0)
  const totalIngreso  = donutData.reduce((acc, d) => acc + d.ingreso, 0)

  const activeIndex = donutData.findIndex((d) => d.name === selectedCat)

  // Datos del panel lateral
  const panelData: { producto: string; unidades: number; ingreso: number; fill: string }[] = (() => {
    if (selectedCat === ALL_KEY) {
      // Suma todas las unidades+ingreso por producto (excluyendo "Otros") y toma top 5
      const totals: Record<string, { unidades: number; ingreso: number }> = {}
      for (const p of prods) {
        if (p.producto === 'Otros') continue
        const cur = totals[p.producto] ?? { unidades: 0, ingreso: 0 }
        totals[p.producto] = { unidades: cur.unidades + p.unidades, ingreso: cur.ingreso + p.ingreso }
      }
      return Object.entries(totals)
        .sort((a, b) => b[1].unidades - a[1].unidades)
        .slice(0, 5)
        .map(([producto, t]) => ({ producto, unidades: t.unidades, ingreso: t.ingreso, fill: 'var(--brand)' }))
    }
    const catIdx = cats.findIndex((c) => c.categoria === selectedCat)
    return prods
      .filter((p) => p.categoria === selectedCat)
      .map((p, i) => ({
        producto: p.producto,
        unidades: p.unidades,
        ingreso:  p.ingreso,
        fill:     getCatColor(catIdx, i + 1),
      }))
  })()

  const panelTitle = selectedCat === ALL_KEY
    ? 'Más vendidos — todos'
    : `Top productos · ${selectedCat}`

  const maxUnidades = Math.max(...panelData.map((p) => p.unidades), 1)

  // Información para mostrar al centro del donut
  const centerInfo = activeIndex >= 0
    ? {
        label: donutData[activeIndex].name,
        unidades: donutData[activeIndex].value,
        ingreso:  donutData[activeIndex].ingreso,
        pct: totalUnidades > 0 ? Math.round((donutData[activeIndex].value / totalUnidades) * 100) : 0,
      }
    : {
        label: 'Total',
        unidades: totalUnidades,
        ingreso:  totalIngreso,
        pct: 100,
      }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-0">
      {/* ── Donut ── */}
      <div className="flex flex-col items-center sm:w-1/2">
        <div className="relative h-56 w-full max-w-xs">
          <ChartContainer config={{}} className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={3}
                  strokeWidth={0}
                  cursor="pointer"
                  {...(activeIndex >= 0 ? { activeIndex, activeShape: ActiveSlice } : {})}
                  onClick={handleSliceClick}
                >
                  {donutData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.fill}
                      opacity={selectedCat === ALL_KEY || selectedCat === entry.name ? 1 : 0.35}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<DonutTooltipPct totalUnidades={totalUnidades} />}
                  wrapperStyle={{ zIndex: 50, outline: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Total / categoría seleccionada al centro (z-0 para que el tooltip lo cubra) */}
          <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{centerInfo.label}</span>
            <span className="text-xl font-bold tabular-nums">{centerInfo.unidades} u</span>
            {centerInfo.ingreso > 0 && (
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {formatCurrency(centerInfo.ingreso)}
              </span>
            )}
            {selectedCat !== ALL_KEY && (
              <span className="text-[10px] text-muted-foreground mt-0.5">{centerInfo.pct}% del total</span>
            )}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-1">
          {donutData.map((entry) => (
            <button
              key={entry.name}
              onClick={() => setSelectedCat((prev) => prev === entry.name ? ALL_KEY : entry.name)}
              className={cn(
                'flex items-center gap-1.5 text-xs rounded px-1.5 py-0.5 transition-all',
                selectedCat === entry.name
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className="inline-block size-2.5 rounded-sm shrink-0 transition-all"
                style={{
                  backgroundColor: entry.fill,
                  opacity: selectedCat === ALL_KEY || selectedCat === entry.name ? 1 : 0.4,
                }}
              />
              {entry.name}
            </button>
          ))}
        </div>
        {selectedCat !== ALL_KEY && (
          <button
            onClick={() => setSelectedCat(ALL_KEY)}
            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Ver todos
          </button>
        )}
      </div>

      {/* ── Panel lateral ── */}
      <div className="flex flex-col sm:w-1/2 sm:border-l sm:pl-5 sm:ml-1">
        <p className="text-xs font-semibold text-foreground mb-3 truncate">{panelTitle}</p>
        {panelData.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin datos para esta categoría</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {panelData.map((p, i) => {
              const pct = Math.round((p.unidades / maxUnidades) * 100)
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-xs text-foreground truncate flex-1">{p.producto}</span>
                    <span className="text-xs font-semibold tabular-nums shrink-0">{p.unidades} u</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: p.fill }}
                      />
                    </div>
                    {p.ingreso > 0 && (
                      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0 w-[68px] text-right">
                        {formatCurrency(p.ingreso)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
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

  const [periodo, setPeriodo] = useState<DashboardPeriodo>('mes')

  const { data: dashData, isLoading: loadingDash, isError: errorDash, refetch: refetchDash } = useQuery({
    queryKey: ['dashboard-data', periodo],
    queryFn: () => reportesService.getDashboardData(periodo),
    staleTime: 1000 * 60 * 10,
    placeholderData: (prev) => prev,
  })

  const periodoLabel = periodo === 'semana' ? 'Última semana'
                     : periodo === 'mes' ? 'Último mes'
                     : periodo === 'trimestre' ? 'Últimos 90 días'
                     : 'Último año'

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
        {/* Donut categorías + panel productos */}
        <Card className="lg:col-span-2 rounded-xl">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base">Productos más vendidos por categoría</CardTitle>
              <p className="text-xs text-muted-foreground">
                {periodoLabel} · Click en una categoría para filtrar
              </p>
            </div>
            <div className="inline-flex rounded-md border bg-background p-0.5 shrink-0">
              {(['semana', 'mes', 'trimestre', 'anio'] as DashboardPeriodo[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                    periodo === p
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  style={periodo === p ? { backgroundColor: 'var(--brand)' } : undefined}
                >
                  {p === 'semana' ? '7d' : p === 'mes' ? '30d' : p === 'trimestre' ? '90d' : '1a'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <GraficoCategorias
              data={dashData}
              isLoading={loadingDash}
              isError={errorDash}
              onRetry={() => refetchDash()}
              periodo={periodo}
            />
          </CardContent>
        </Card>

        {/* Top 5 vendedores */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top vendedores</CardTitle>
            <p className="text-xs text-muted-foreground">Por monto total — {periodoLabel.toLowerCase()}</p>
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
