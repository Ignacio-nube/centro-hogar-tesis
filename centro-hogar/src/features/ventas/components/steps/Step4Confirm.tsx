import { CheckCircle, Download, RotateCcw, List, UserX, Banknote, CreditCard, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { TicketPDF } from '@/features/reportes/pdf/TicketPDF'
import { PDFDownloadLink } from '@react-pdf/renderer'
import type { SaleWizardState, Venta } from '@/types/app.types'

interface Step4Props {
  state: SaleWizardState
  computed: { subtotal: number; base: number; interesMonto: number; totalFinal: number; cuotaMonto: number }
  completedVenta: Venta | null
  isLoading: boolean
  onConfirm: () => void
  onBack: () => void
  onNewSale: () => void
  onGoToVentas: () => void
}

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

const TARJETA_LABEL: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  naranja: 'Naranja X',
  debito: 'Débito',
}

export function Step4Confirm({
  state,
  computed,
  completedVenta,
  isLoading,
  onConfirm,
  onBack,
  onNewSale,
  onGoToVentas,
}: Step4Props) {
  /* ── SUCCESS SCREEN ──────────────────────────────────────────── */
  if (completedVenta) {
    const clientLabel = completedVenta.cliente
      ? `${(completedVenta.cliente as { nombre: string; apellido: string }).nombre} ${(completedVenta.cliente as { nombre: string; apellido: string }).apellido}`
      : 'Sin cliente'
    const methodLabel = METODO_LABEL[state.metodo_pago] ?? state.metodo_pago
    const tarjetaLabel = state.tarjeta_tipo ? TARJETA_LABEL[state.tarjeta_tipo] : null

    const subtitleParts = [
      tarjetaLabel ? `${methodLabel} · ${tarjetaLabel}` : methodLabel,
      completedVenta.cuotas > 1
        ? `${completedVenta.cuotas} cuotas de ${formatCurrency(completedVenta.total_final / completedVenta.cuotas)}`
        : null,
      clientLabel,
    ].filter(Boolean)

    return (
      <div className="flex flex-col items-center gap-8 max-w-md mx-auto text-center py-10 animate-in fade-in duration-300">
        {/* Animated check — brand coloured */}
        <div className="flex flex-col items-center gap-4">
          <div className="size-20 rounded-full bg-brand-muted flex items-center justify-center animate-pop-in">
            <CheckCircle className="size-10 text-brand" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">¡Venta registrada!</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Venta #{completedVenta.numero_venta} · {formatDateTime(completedVenta.created_at)}
            </p>
          </div>
        </div>

        {/* Total card */}
        <div className="w-full bg-brand-muted border border-brand/20 rounded-2xl px-10 py-6">
          <p className="text-xs uppercase tracking-widest text-brand/60 mb-1">Total cobrado</p>
          <p className="text-5xl font-bold text-zinc-900 tabular-nums">
            {formatCurrency(completedVenta.total_final)}
          </p>
          <p className="text-sm text-zinc-500 mt-2">{subtitleParts.join(' · ')}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 w-full">
          <PDFDownloadLink
            document={<TicketPDF venta={completedVenta} items={state.items} />}
            fileName={`ticket-${completedVenta.numero_venta}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" className="w-full h-11" disabled={loading}>
                <Download data-icon="inline-start" />
                {loading ? 'Generando...' : 'Descargar ticket'}
              </Button>
            )}
          </PDFDownloadLink>
          <Button
            className="w-full h-12 bg-brand hover:bg-brand-dark text-white font-semibold"
            onClick={onNewSale}
          >
            <RotateCcw data-icon="inline-start" />
            Nueva venta
          </Button>
          <Button variant="link" className="w-full text-sm text-muted-foreground" onClick={onGoToVentas}>
            <List className="size-3.5 mr-1.5" />
            Ver todas las ventas
          </Button>
        </div>
      </div>
    )
  }

  /* ── CONFIRM SCREEN ──────────────────────────────────────────── */
  const MetodoIcon = METODO_ICON[state.metodo_pago] ?? CreditCard
  const clienteInitials = state.cliente
    ? `${state.cliente.nombre[0] ?? ''}${state.cliente.apellido[0] ?? ''}`.toUpperCase()
    : null
  const metodoPagoLabel = METODO_LABEL[state.metodo_pago] ?? state.metodo_pago
  const tarjetaLabel = state.tarjeta_tipo ? TARJETA_LABEL[state.tarjeta_tipo] : null
  const clienteLabel = state.cliente
    ? `${state.cliente.nombre} ${state.cliente.apellido}`
    : 'Sin cliente'

  const metodoCombinado = tarjetaLabel
    ? `${metodoPagoLabel} · ${tarjetaLabel}`
    : metodoPagoLabel

  return (
    <div className="flex gap-6 w-full items-start">
      {/* Left column: summary cards (~60%) */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">

        {/* Client card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Cliente</p>
          {state.cliente ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-muted text-brand text-xs font-semibold flex items-center justify-center shrink-0">
                {clienteInitials}
              </div>
              <div>
                <p className="font-medium text-sm">{state.cliente.nombre} {state.cliente.apellido}</p>
                <p className="text-xs text-muted-foreground">
                  {[state.cliente.dni && `DNI ${state.cliente.dni}`, state.cliente.telefono && `Tel. ${state.cliente.telefono}`]
                    .filter(Boolean)
                    .join(' · ') || 'Sin datos de contacto'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <UserX className="size-5 opacity-50" />
              <p className="text-sm">Venta sin cliente asociado</p>
            </div>
          )}
        </div>

        {/* Products card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
            Productos ({state.items.length})
          </p>
          <div className="flex flex-col gap-2">
            {state.items.map((item) => (
              <div key={item.producto.id} className="flex items-center gap-3">
                <span className="font-mono text-sm text-zinc-400 shrink-0 w-6 text-right">
                  {item.cantidad}×
                </span>
                <span className="font-medium text-sm flex-1 min-w-0">{item.producto.nombre}</span>
                <span className="text-sm tabular-nums shrink-0 text-right">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
            <Separator className="my-1" />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(computed.subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Pago</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Método</span>
              <div className="flex items-center gap-1.5">
                <MetodoIcon className="size-4 text-zinc-500" />
                <span>{metodoCombinado}</span>
              </div>
            </div>
            {state.cuotas > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cuotas</span>
                <span className="tabular-nums">{state.cuotas}x de {formatCurrency(computed.cuotaMonto)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(computed.subtotal)}</span>
            </div>
            {state.descuento > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Descuento</span>
                <span className="tabular-nums">− {formatCurrency(state.descuento)}</span>
              </div>
            )}
            {state.interes_porcentaje > 0 && (
              <div className="flex items-center justify-between text-sm text-amber-600">
                <span>Interés ({state.interes_porcentaje}%)</span>
                <span className="tabular-nums">+ {formatCurrency(computed.interesMonto)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(computed.totalFinal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right column: dark sticky panel (~40%) */}
      <div className="w-80 shrink-0 sticky top-6">
        <div className="bg-zinc-950 rounded-2xl p-6 text-white flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-widest text-zinc-400">Total a cobrar</p>
            <p className="text-4xl font-bold text-white tabular-nums">
              {formatCurrency(computed.totalFinal)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-zinc-400">{metodoCombinado}</p>
            <p className="text-sm text-zinc-400">{clienteLabel}</p>
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex flex-col gap-2">
            <Button
              className="w-full h-14 text-base font-bold bg-brand hover:bg-brand-dark text-white rounded-xl transition-all hover:scale-[1.02]"
              onClick={onConfirm}
              disabled={isLoading}
            >
              <CheckCircle className="mr-2 size-5" />
              {isLoading ? 'Registrando...' : 'Confirmar venta'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={onBack}
              disabled={isLoading}
            >
              Atrás
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
