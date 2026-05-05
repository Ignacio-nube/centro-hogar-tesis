import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, Banknote, ArrowLeftRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency } from '@/lib/utils'
import { ventaSchema, type VentaFormValues } from '@/lib/validations/venta.schema'
import type { SaleWizardState } from '@/types/app.types'

interface Step3Props {
  state: SaleWizardState
  computed: { subtotal: number; base: number; interesMonto: number; totalFinal: number; cuotaMonto: number }
  onSetPayment: (p: Partial<SaleWizardState>) => void
  onBack: () => void
  onNext: () => void
}

const METODOS = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
] as const

const TARJETAS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'naranja', label: 'Naranja X' },
  { value: 'debito', label: 'Débito' },
] as const

const CUOTAS_OPTS = [1, 3, 6, 12, 18, 24]

export function Step3PaymentForm({ state, computed, onSetPayment, onBack, onNext }: Step3Props) {
  const form = useForm<VentaFormValues>({
    resolver: zodResolver(ventaSchema) as Resolver<VentaFormValues>,
    defaultValues: {
      metodo_pago: state.metodo_pago,
      tarjeta_tipo: state.tarjeta_tipo,
      cuotas: state.cuotas,
      interes_porcentaje: state.interes_porcentaje,
      descuento: state.descuento,
      notas: state.notas,
    },
  })

  const metodo = form.watch('metodo_pago')
  const cuotas = form.watch('cuotas') ?? 1
  const interesP = form.watch('interes_porcentaje') ?? 0
  const descuento = form.watch('descuento') ?? 0
  const tarjeta = form.watch('tarjeta_tipo')

  const [discountPct, setDiscountPct] = useState<string>(() => {
    const d = state.descuento ?? 0
    return d > 0 && computed.subtotal > 0
      ? ((d / computed.subtotal) * 100).toFixed(1)
      : ''
  })

  const base = computed.subtotal - descuento
  const interesMonto = base * (interesP / 100)
  const totalFinal = base + interesMonto
  const cuotaMonto = cuotas > 1 ? totalFinal / cuotas : totalFinal

  function handleDiscountAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value) || 0
    form.setValue('descuento', val)
    if (computed.subtotal > 0) {
      setDiscountPct(val > 0 ? ((val / computed.subtotal) * 100).toFixed(1) : '')
    }
  }

  function handleDiscountPctChange(e: React.ChangeEvent<HTMLInputElement>) {
    const pct = parseFloat(e.target.value) || 0
    setDiscountPct(e.target.value)
    const amount = parseFloat(((pct / 100) * computed.subtotal).toFixed(2))
    form.setValue('descuento', amount)
  }

  function handleSubmit(values: VentaFormValues) {
    onSetPayment({
      metodo_pago: values.metodo_pago,
      tarjeta_tipo: values.tarjeta_tipo ?? null,
      cuotas: values.cuotas ?? 1,
      interes_porcentaje: values.interes_porcentaje ?? 0,
      descuento: values.descuento ?? 0,
      notas: values.notas ?? '',
    })
    onNext()
  }

  return (
    <form
      id="step3-form"
      onSubmit={form.handleSubmit((values: VentaFormValues) => handleSubmit(values))}
      className="flex gap-6 w-full items-start"
    >
      {/* Left column: form fields (~58%) */}
      <div className="flex flex-col gap-5 flex-1 min-w-0">
        {/* Método de pago */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Método de pago</Label>
          <div className="flex gap-2">
            {METODOS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  form.setValue('metodo_pago', m.value)
                  if (m.value !== 'tarjeta') {
                    form.setValue('tarjeta_tipo', null)
                    form.setValue('cuotas', 1)
                    form.setValue('interes_porcentaje', 0)
                  }
                }}
                className={cn(
                  'h-16 flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-all duration-150',
                  metodo === m.value
                    ? 'border-2 border-brand bg-brand-muted text-brand'
                    : 'border border-zinc-200 hover:border-zinc-400 text-foreground',
                )}
              >
                <m.icon
                  className={cn('size-5', metodo === m.value ? 'text-brand' : 'text-muted-foreground')}
                />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta options */}
        {metodo === 'tarjeta' && (
          <>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Tipo de tarjeta</Label>
              <div className="grid grid-cols-4 gap-2">
                {TARJETAS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      form.setValue('tarjeta_tipo', t.value)
                      if (t.value === 'debito') {
                        form.setValue('cuotas', 1)
                        form.setValue('interes_porcentaje', 0)
                      }
                    }}
                    className={cn(
                      'rounded-lg border p-2 text-sm text-center cursor-pointer transition-all duration-150',
                      tarjeta === t.value
                        ? 'border-brand bg-brand-muted text-brand font-medium'
                        : 'border-zinc-200 hover:border-zinc-300',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {form.formState.errors.tarjeta_tipo && (
                <p className="text-xs text-destructive">{form.formState.errors.tarjeta_tipo.message}</p>
              )}
            </div>

            {tarjeta !== 'debito' && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Cuotas</Label>
                <div className="flex flex-wrap gap-2">
                  {CUOTAS_OPTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => form.setValue('cuotas', c)}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-sm transition-all duration-150',
                        cuotas === c
                          ? 'bg-brand text-white font-semibold'
                          : 'border border-zinc-200 hover:border-brand',
                      )}
                    >
                      {c === 1 ? 'Contado' : `${c}x`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cuotas > 1 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="interes" className="text-sm font-medium">
                    Interés % (del postnet)
                  </Label>
                  <span title="Ingresá el % que muestra el postnet al procesar la tarjeta">
                    <Info className="size-3.5 text-muted-foreground" />
                  </span>
                </div>
                <Input
                  id="interes"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  {...form.register('interes_porcentaje')}
                />
                <p className="text-xs text-muted-foreground">
                  Solo para registrar el costo financiero. El cobro lo realiza el postnet.
                </p>
              </div>
            )}
          </>
        )}

        {/* Descuento — dual inputs */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Descuento</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7"
                value={descuento || ''}
                onChange={handleDiscountAmountChange}
              />
            </div>
            <div className="relative w-28">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0.0"
                className="pr-7"
                value={discountPct}
                onChange={handleDiscountPctChange}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="notas" className="text-sm font-medium">
            Notas <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="notas"
            placeholder="Observaciones de la venta..."
            {...form.register('notas')}
          />
        </div>
      </div>

      {/* Right column: sticky summary (~42%) */}
      <div className="w-80 shrink-0 sticky top-6">
        <div className="bg-zinc-50 rounded-2xl p-5 flex flex-col gap-3">
          <h4 className="font-semibold text-sm text-zinc-700">Resumen de pago</h4>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(computed.subtotal)}</span>
            </div>

            {interesP > 0 && (
              <div className="flex items-center justify-between text-sm text-amber-600">
                <span>Interés ({interesP}%)</span>
                <span className="tabular-nums">+ {formatCurrency(interesMonto)}</span>
              </div>
            )}

            {descuento > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Descuento</span>
                <span className="tabular-nums">− {formatCurrency(descuento)}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-600">Total</span>
            <span className="text-2xl font-bold text-zinc-900 tabular-nums">
              {formatCurrency(totalFinal)}
            </span>
          </div>

          {cuotas > 1 && (
            <div className="bg-brand-muted rounded-lg px-3 py-2 text-sm text-brand font-medium">
              {cuotas} cuotas de {formatCurrency(cuotaMonto)}
            </div>
          )}

          <Separator />

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              onClick={onBack}
            >
              Atrás
            </Button>
            <Button
              type="submit"
              className="w-full h-11 bg-brand hover:bg-brand-dark font-semibold text-white"
            >
              Revisar venta
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
