import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Pencil,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  CalendarDays,
  Banknote,
  ArrowRightLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ClienteDialog } from '@/features/clientes/components/ClienteDialog'
import { clientesService } from '@/features/clientes/services/clientesService'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { QueryErrorState } from '@/components/ui/query-error-state'
import type { Venta } from '@/types/app.types'

/* ─── Badge helpers ─────────────────────────────────────────────────────── */
function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'completada') {
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200 font-medium">
        Completada
      </Badge>
    )
  }
  if (estado === 'cancelada') {
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-200 font-medium">
        Cancelada
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border border-amber-200 font-medium">
      Pendiente
    </Badge>
  )
}

/* ─── Metodo pago ────────────────────────────────────────────────────────── */
const METODO_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  efectivo: { label: 'Efectivo', icon: Banknote },
  tarjeta: { label: 'Tarjeta', icon: CreditCard },
  transferencia: { label: 'Transferencia', icon: ArrowRightLeft },
}

/* ─── KPI Card (same as dashboard pattern) ─────────────────────────────── */
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  highlighted = false,
}: {
  title: string
  value: string
  description?: string
  icon: React.ElementType
  highlighted?: boolean
}) {
  return (
    <Card
      className={cn('rounded-xl transition-shadow hover:shadow-md', highlighted && 'border-0')}
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
          <Icon className={cn('size-4', highlighted ? 'text-white' : 'text-brand')} />
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}

/* ─── Contact info mini-card ────────────────────────────────────────────── */
function ContactCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3"
      style={{
        backgroundColor: 'var(--brand-muted)',
        border: '1px solid oklch(0.61 0.146 52 / 0.15)',
      }}
    >
      <div
        className="rounded-lg p-2 shrink-0"
        style={{ backgroundColor: 'oklch(0.61 0.146 52 / 0.15)' }}
      >
        <Icon className="size-4 text-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-sm truncate">{value}</p>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = usePermissions()
  const canWrite = can('clientes.write')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: cliente, isLoading, isError, refetch } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesService.getById(id!),
    enabled: !!id,
  })

  const { data: historial, isLoading: loadingHistorial, isError: historialError, refetch: refetchHistorial } = useQuery({
    queryKey: ['cliente-historial', id],
    queryFn: () => clientesService.getHistorial(id!),
    enabled: !!id,
  })

  const toggleActivoMutation = useMutation({
    mutationFn: ({ activo }: { activo: boolean }) =>
      clientesService.toggleActivo(id!, activo),
    onSuccess: (updated) => {
      toast.success(updated.activo ? 'Cliente activado' : 'Cliente desactivado')
      qc.invalidateQueries({ queryKey: ['cliente', id] })
      qc.invalidateQueries({ queryKey: ['clientes'] })
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
  })

  const ventasCompletadas = (historial ?? []).filter((v) => v.estado === 'completada')
  const totalCompras = ventasCompletadas.reduce((acc, v) => acc + v.total_final, 0)
  const ticketPromedio = ventasCompletadas.length > 0 ? totalCompras / ventasCompletadas.length : 0

  const columns: Column<Venta>[] = [
    {
      key: 'numero_venta',
      header: '#',
      className: 'w-20',
      cell: (v) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(v.numero_venta).padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (v) => <span className="text-sm">{formatDateTime(v.created_at)}</span>,
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
        const cfg = METODO_CONFIG[v.metodo_pago]
        if (!cfg) return <span className="text-sm">{v.metodo_pago}</span>
        const Icon = cfg.icon
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Icon className="size-3.5 text-muted-foreground shrink-0" />
            {cfg.label}
          </div>
        )
      },
    },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right',
      cell: (v) => (
        <span className="font-bold text-green-600">{formatCurrency(v.total_final)}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (v) => <EstadoBadge estado={v.estado} />,
    },
  ]

  /* Loading state */
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-16">
        <QueryErrorState onRetry={() => refetch()} />
        <Button variant="outline" onClick={() => navigate('/clientes')}>
          <ArrowLeft data-icon="inline-start" />
          Volver a Clientes
        </Button>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-16">
        <p className="text-muted-foreground">Cliente no encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/clientes')}>
          <ArrowLeft data-icon="inline-start" />
          Volver a Clientes
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => navigate('/clientes')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {cliente.apellido}, {cliente.nombre}
            </h1>
            <button
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={toggleActivoMutation.isPending}
              title={cliente.activo ? 'Clic para desactivar' : 'Clic para activar'}
              onClick={() => {
                if (canWrite) toggleActivoMutation.mutate({ activo: !cliente.activo })
              }}
            >
              {cliente.activo ? (
                <Badge className="bg-green-100 text-green-700 border border-green-200 hover:opacity-80 transition-opacity font-medium">
                  Activo
                </Badge>
              ) : (
                <Badge className="bg-zinc-100 text-zinc-500 border border-zinc-200 hover:opacity-80 transition-opacity font-medium">
                  Inactivo
                </Badge>
              )}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
            <CalendarDays className="size-3.5 shrink-0" />
            Cliente desde {formatDate(cliente.created_at)}
          </p>
        </div>
        {canWrite && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-brand text-brand hover:bg-brand hover:text-white transition-colors"
            onClick={() => setDialogOpen(true)}
          >
            <Pencil data-icon="inline-start" className="size-3.5" />
            Editar
          </Button>
        )}
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Compras realizadas"
          value={String(ventasCompletadas.length)}
          description="ventas completadas"
          icon={ShoppingBag}
        />
        {/* Highlighted card */}
        <StatCard
          title="Total comprado"
          value={formatCurrency(totalCompras)}
          description="acumulado histórico"
          icon={TrendingUp}
          highlighted
        />
        <StatCard
          title="Ticket promedio"
          value={formatCurrency(ticketPromedio)}
          description="por compra"
          icon={ShoppingBag}
        />
      </div>

      {/* ── Contact info ────────────────────────────────────────────────── */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4 text-brand" />
            Información de contacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!cliente.dni && !cliente.telefono && !cliente.email && !cliente.direccion ? (
            <p className="text-sm text-muted-foreground">
              No hay datos de contacto registrados.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {cliente.dni && (
                <ContactCard icon={CreditCard} label="DNI" value={cliente.dni} />
              )}
              {cliente.telefono && (
                <ContactCard icon={Phone} label="Teléfono" value={cliente.telefono} />
              )}
              {cliente.email && (
                <ContactCard icon={Mail} label="Email" value={cliente.email} />
              )}
              {cliente.direccion && (
                <ContactCard icon={MapPin} label="Dirección" value={cliente.direccion} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* ── Purchase history ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Historial de compras</h2>
        {historialError ? (
          <QueryErrorState onRetry={() => refetchHistorial()} />
        ) : (
        <DataTable
          columns={columns}
          data={historial ?? []}
          isLoading={loadingHistorial}
          rowKey={(v) => v.id}
          emptyMessage="Este cliente no tiene compras registradas."
          onRowClick={(v) => navigate(`/ventas/${v.id}`)}
        />
        )}
      </div>

      <ClienteDialog
        open={dialogOpen}
        onOpenChange={(v) => setDialogOpen(v)}
        cliente={cliente}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['cliente', id] })
          qc.invalidateQueries({ queryKey: ['clientes'] })
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
