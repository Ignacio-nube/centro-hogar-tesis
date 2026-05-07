import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaleWizard } from '../hooks/useSaleWizard'
import { ventasService } from '../services/ventasService'
import { productosService } from '@/features/productos/services/productosService'
import { useAuth } from '@/app/providers/AuthProvider'
import { Step1ClienteSelect } from './steps/Step1ClienteSelect'
import { Step2CartBuilder } from './steps/Step2CartBuilder'
import { Step3PaymentForm } from './steps/Step3PaymentForm'
import { Step4Confirm } from './steps/Step4Confirm'
import type { Venta } from '@/types/app.types'

const STEPS = [
  { number: 1, label: 'Cliente' },
  { number: 2, label: 'Carrito' },
  { number: 3, label: 'Pago' },
  { number: 4, label: 'Confirmar' },
]

export function SaleWizard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()
  const wizard = useSaleWizard()
  const [completedVenta, setCompletedVenta] = useState<Venta | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      ventasService.create({
        vendedor_id: user?.id ?? '',
        items: wizard.state.items,
        cliente_id: wizard.state.cliente?.id ?? null,
        descuento: wizard.state.descuento,
        metodo_pago: wizard.state.metodo_pago,
        tarjeta_tipo: wizard.state.tarjeta_tipo,
        cuotas: wizard.state.cuotas,
        interes_porcentaje: wizard.state.interes_porcentaje,
        notas: wizard.state.notas,
      }),
    onSuccess: (venta) => {
      setCompletedVenta(venta)
      toast.success(`Venta #${venta.numero_venta} registrada correctamente`)
      qc.invalidateQueries({ queryKey: ['ventas'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['stats-hoy'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Error al registrar la venta'),
  })

  // Refetch stock antes de confirmar para evitar fallar con mensaje crudo
  // si el stock cambió desde que se armó el carrito.
  const handleConfirm = async (): Promise<void> => {
    try {
      const fresh = await Promise.all(
        wizard.state.items.map((it) => productosService.getById(it.producto.id))
      )
      const problemas: string[] = []
      for (let i = 0; i < wizard.state.items.length; i++) {
        const item = wizard.state.items[i]
        const prod = fresh[i]
        if (!item || !prod) continue
        if (!prod.activo) {
          problemas.push(`"${prod.nombre}" ya no está activo`)
        } else if (prod.stock_actual < item.cantidad) {
          problemas.push(`"${prod.nombre}": stock disponible ${prod.stock_actual}, solicitado ${item.cantidad}`)
        }
      }
      if (problemas.length > 0) {
        toast.error(`No se puede completar la venta: ${problemas.join('; ')}`)
        qc.invalidateQueries({ queryKey: ['productos'] })
        return
      }
    } catch (err) {
      toast.error(`No se pudo revalidar el stock: ${(err as Error).message}`)
      return
    }
    mutation.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper */}
      <nav aria-label="Pasos de la venta">
        <ol className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const isCompleted = wizard.state.step > step.number
            const isCurrent = wizard.state.step === step.number
            return (
              <li key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={cn(
                      'size-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300',
                      isCompleted && 'bg-brand border-brand text-white',
                      isCurrent && 'border-brand text-brand bg-brand-muted',
                      !isCompleted && !isCurrent && 'bg-zinc-200 border-zinc-200 text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="size-4" /> : step.number}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium transition-all duration-300',
                      isCurrent ? 'text-brand' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mb-5 transition-all duration-300',
                      wizard.state.step > step.number ? 'bg-brand' : 'bg-zinc-200',
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Steps */}
      {wizard.state.step === 1 && (
        <Step1ClienteSelect
          selectedCliente={wizard.state.cliente}
          onSelect={(c) => { wizard.selectCliente(c); wizard.setStep(2) }}
          onSkip={() => { wizard.selectCliente(null); wizard.setStep(2) }}
        />
      )}
      {wizard.state.step === 2 && (
        <Step2CartBuilder
          items={wizard.state.items}
          onAddItem={wizard.addItem}
          onUpdateQty={wizard.updateItemQty}
          onRemoveItem={wizard.removeItem}
          onBack={() => wizard.setStep(1)}
          onNext={() => wizard.setStep(3)}
          subtotal={wizard.computed.subtotal}
        />
      )}
      {wizard.state.step === 3 && (
        <Step3PaymentForm
          state={wizard.state}
          computed={wizard.computed}
          onSetPayment={wizard.setPayment}
          onBack={() => wizard.setStep(2)}
          onNext={() => wizard.setStep(4)}
        />
      )}
      {wizard.state.step === 4 && (
        <Step4Confirm
          state={wizard.state}
          computed={wizard.computed}
          completedVenta={completedVenta}
          isLoading={mutation.isPending}
          onConfirm={handleConfirm}
          onBack={() => wizard.setStep(3)}
          onNewSale={() => { wizard.reset(); setCompletedVenta(null) }}
          onGoToVentas={() => navigate('/ventas')}
        />
      )}
    </div>
  )
}
