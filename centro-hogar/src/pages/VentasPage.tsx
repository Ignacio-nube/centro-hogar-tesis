import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Download, Banknote, CreditCard, ArrowLeftRight, SlidersHorizontal, Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PaginationControls } from '@/components/common/PaginationControls'
import { downloadTicketPDF } from '@/features/reportes/pdf/lazyDownload'
import { ventasService } from '@/features/ventas/services/ventasService'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'sonner'
import type { Venta } from '@/types/app.types'

type Modo = 'inicial' | 'resultado'
type EstadoVenta = 'completada' | 'cancelada'

const PAGE_SIZE_INICIAL = 5
const PAGE_SIZE_RESULTADO = 15

const ESTADO_BADGE: Record<string, string> = {
  completada: 'bg-green-100 text-green-700 border border-green-200',
  pendiente:  'bg-zinc-100 text-zinc-500 border border-zinc-200',
  cancelada:  'bg-red-100 text-red-600 border border-red-200',
}

const METODO_LABEL: Record<string, string> = {
  efectivo:      'Efectivo',
  tarjeta:       'Tarjeta',
  transferencia: 'Transf.',
}

const METODO_ICON: Record<string, React.ElementType> = {
  efectivo:      Banknote,
  tarjeta:       CreditCard,
  transferencia: ArrowLeftRight,
}

// Presets de rango de fechas (mismo patrón que ReportesPage)
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
const PRESETS: { label: string; getRange: () => { desde: string; hasta: string } }[] = [
  { label: 'Hoy',          getRange: () => ({ desde: fmt(new Date()), hasta: fmt(new Date()) }) },
  { label: 'Esta semana',  getRange: () => ({ desde: fmt(startOfWeek(new Date(), { weekStartsOn: 1 })), hasta: fmt(new Date()) }) },
  { label: 'Este mes',     getRange: () => ({ desde: fmt(startOfMonth(new Date())), hasta: fmt(new Date()) }) },
  { label: 'Últimos 30 días', getRange: () => ({ desde: fmt(subDays(new Date(), 29)), hasta: fmt(new Date()) }) },
  {
    label: 'Mes anterior',
    getRange: () => {
      const mesAnt = subMonths(new Date(), 1)
      return {
        desde: fmt(startOfMonth(mesAnt)),
        hasta: fmt(new Date(mesAnt.getFullYear(), mesAnt.getMonth() + 1, 0)),
      }
    },
  },
]

export default function VentasPage() {
  const { can } = usePermissions()
  const navigate = useNavigate()
  const canWrite = can('ventas.write')

  const [modo, setModo] = useState<Modo>('inicial')
  const [page, setPage] = useState(1)

  // búsqueda (NO dispara sola — se aplica con Enter o el botón)
  const [searchInput, setSearchInput]   = useState('')
  const [searchApplied, setSearchApplied] = useState('')

  // filtros pendientes (lo que el usuario está editando)
  const [desdePend, setDesdePend]           = useState('')
  const [hastaPend, setHastaPend]           = useState('')
  const [metodoPagoPend, setMetodoPagoPend] = useState('')
  const [vendedorIdPend, setVendedorIdPend] = useState('')
  const [estadoPend, setEstadoPend]         = useState<EstadoVenta>('completada')
  // filtros aplicados (lo que va al backend)
  const [desde, setDesde]           = useState('')
  const [hasta, setHasta]           = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const [estado, setEstado]         = useState<EstadoVenta>('completada')

  const pageSize = modo === 'inicial' ? PAGE_SIZE_INICIAL : PAGE_SIZE_RESULTADO

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['ventas', modo, searchApplied, estado, desde, hasta, metodoPago, vendedorId, page, pageSize],
    queryFn: () =>
      ventasService.list({
        page,
        pageSize,
        search:     searchApplied || undefined,
        estado,
        metodoPago: metodoPago || undefined,
        vendedorId: vendedorId || undefined,
        fechaDesde: desde ? `${desde} 00:00:00` : undefined,
        fechaHasta: hasta ? `${hasta} 23:59:59` : undefined,
        // Modo "inicial": preview liviano sin COUNT(*) sobre 64k+ filas.
        skipCount:  modo === 'inicial',
      }),
    staleTime: modo === 'inicial' ? 1000 * 60 * 5 : 0,
  })

  const { data: usuarios } = useQuery({
    queryKey: ['ventas-vendedores'],
    queryFn: () => ventasService.listVendedores(),
    staleTime: 1000 * 60 * 10,
  })

  function aplicar() {
    const s = searchInput.trim()
    setSearchApplied(s)
    setDesde(desdePend)
    setHasta(hastaPend)
    setMetodoPago(metodoPagoPend)
    setVendedorId(vendedorIdPend)
    setEstado(estadoPend)
    setPage(1)
    const hayAlgo = !!(s || desdePend || hastaPend || metodoPagoPend || vendedorIdPend || estadoPend !== 'completada')
    setModo(hayAlgo ? 'resultado' : 'inicial')
  }

  function limpiar() {
    setSearchInput('')
    setSearchApplied('')
    setDesdePend(''); setHastaPend(''); setMetodoPagoPend(''); setVendedorIdPend(''); setEstadoPend('completada')
    setDesde('');     setHasta('');     setMetodoPago('');     setVendedorId('');     setEstado('completada')
    setPage(1)
    setModo('inicial')
  }

  function aplicarPreset(getRange: () => { desde: string; hasta: string }) {
    const { desde: d, hasta: h } = getRange()
    setDesdePend(d)
    setHastaPend(h)
  }

  const totalCount = data?.count ?? 0

  const columns: Column<Venta>[] = useMemo(() => [
    {
      key: 'numero',
      header: '#',
      className: 'w-20',
      cell: (v) => <span className="font-mono text-muted-foreground">#{v.numero_venta}</span>,
    },
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (v) => <span className="text-sm">{formatDateTime(v.created_at)}</span>,
    },
    {
      key: 'cliente',
      header: 'Cliente',
      cell: (v) =>
        v.cliente ? (
          <span className="font-medium">{v.cliente.nombre} {v.cliente.apellido}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
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
      key: 'metodo',
      header: 'Pago',
      cell: (v) => {
        const MetodoIcon = METODO_ICON[v.metodo_pago]
        return (
          <div className="flex items-center gap-1.5 text-sm">
            {MetodoIcon && <MetodoIcon className="size-3.5 text-muted-foreground shrink-0" />}
            {METODO_LABEL[v.metodo_pago]}
          </div>
        )
      },
    },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right font-semibold',
      cell: (v) => formatCurrency(v.total_final),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (v) => (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            ESTADO_BADGE[v.estado] ?? 'bg-zinc-100 text-zinc-500 border border-zinc-200',
          )}
        >
          {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
        </span>
      ),
    },
    {
      key: 'ticket',
      header: '',
      className: 'w-12',
      cell: (v) => <TicketDownloadButton venta={v} />,
    },
  ], [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ventas"
        description={
          modo === 'inicial'
            ? '5 ventas más recientes'
            : `${totalCount} ventas encontradas`
        }
        action={
          canWrite ? (
            <Button render={<Link to="/ventas/nueva" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              Nueva venta
            </Button>
          ) : undefined
        }
      />

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nº de venta o nombre de cliente... (Enter para buscar)"
          className="pl-9"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') aplicar() }}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Desde</label>
            <Input
              type="date"
              className="w-40"
              value={desdePend}
              max={hastaPend || undefined}
              onChange={(e) => setDesdePend(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <Input
              type="date"
              className="w-40"
              value={hastaPend}
              min={desdePend || undefined}
              onChange={(e) => setHastaPend(e.target.value)}
            />
          </div>

          <Select
            value={vendedorIdPend || 'all'}
            onValueChange={(v) => setVendedorIdPend(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vendedores</SelectItem>
              {(usuarios ?? []).map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>{u.nombre} {u.apellido}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={metodoPagoPend || 'all'}
            onValueChange={(v) => setMetodoPagoPend(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos los métodos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los métodos</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="tarjeta">Tarjeta</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={estadoPend}
            onValueChange={(v) => setEstadoPend(v as EstadoVenta)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" onClick={aplicar}>
            <SlidersHorizontal className="size-3.5 mr-1.5" />
            Aplicar filtros
          </Button>

          {modo === 'resultado' && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={limpiar}>
              <X className="size-3.5 mr-1.5" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => aplicarPreset(p.getRange)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          rowKey={(v) => v.id}
          emptyMessage="No se encontraron ventas con esos filtros."
          onRowClick={(v) => navigate(`/ventas/${v.id}`)}
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
    </div>
  )
}

// ─── Botón de descarga de ticket (lazy) ───────────────────────────────────────
// Carga @react-pdf/renderer (~1.5MB) sólo al hacer clic, no al renderizar la lista.
function TicketDownloadButton({ venta }: { venta: Venta }) {
  const [loading, setLoading] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const full = await ventasService.getById(venta.id)
      const items = (full.items ?? []).map((item) => ({
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
      await downloadTicketPDF(full, items)
    } catch (err) {
      toast.error(`No se pudo generar el ticket: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
      title="Descargar ticket"
      onClick={handleClick}
      disabled={loading}
    >
      <Download className={`size-3.5 ${loading ? 'opacity-50 animate-pulse' : ''}`} />
    </Button>
  )
}
