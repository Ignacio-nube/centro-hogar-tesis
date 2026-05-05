import { useState, useCallback } from 'react'
import type { CartItem, Cliente } from '@/types/app.types'
import type { SaleWizardState } from '@/types/app.types'

const INITIAL_STATE: SaleWizardState = {
  step: 1,
  cliente: null,
  items: [],
  metodo_pago: 'efectivo',
  tarjeta_tipo: null,
  cuotas: 1,
  interes_porcentaje: 0,
  descuento: 0,
  notas: '',
}

export function useSaleWizard() {
  const [state, setState] = useState<SaleWizardState>(INITIAL_STATE)

  const setStep = useCallback((step: SaleWizardState['step']) => {
    setState((s) => ({ ...s, step }))
  }, [])

  const selectCliente = useCallback((cliente: Cliente | null) => {
    setState((s) => ({ ...s, cliente }))
  }, [])

  const addItem = useCallback((item: CartItem) => {
    setState((s) => {
      const existing = s.items.findIndex((i) => i.producto.id === item.producto.id)
      if (existing >= 0) {
        const updated = [...s.items]
        const qty = updated[existing].cantidad + item.cantidad
        updated[existing] = {
          ...updated[existing],
          cantidad: qty,
          subtotal: qty * updated[existing].precio_unitario,
        }
        return { ...s, items: updated }
      }
      return { ...s, items: [...s.items, item] }
    })
  }, [])

  const updateItemQty = useCallback((productoId: string, cantidad: number) => {
    setState((s) => {
      if (cantidad <= 0) {
        return { ...s, items: s.items.filter((i) => i.producto.id !== productoId) }
      }
      return {
        ...s,
        items: s.items.map((i) =>
          i.producto.id === productoId
            ? { ...i, cantidad, subtotal: cantidad * i.precio_unitario }
            : i
        ),
      }
    })
  }, [])

  const removeItem = useCallback((productoId: string) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.producto.id !== productoId) }))
  }, [])

  const setPayment = useCallback(
    (payment: Partial<Pick<SaleWizardState, 'metodo_pago' | 'tarjeta_tipo' | 'cuotas' | 'interes_porcentaje' | 'descuento' | 'notas'>>) => {
      setState((s) => ({ ...s, ...payment }))
    },
    []
  )

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  const subtotal = state.items.reduce((acc, i) => acc + i.subtotal, 0)
  const base = subtotal - state.descuento
  const interesMonto = base * (state.interes_porcentaje / 100)
  const totalFinal = base + interesMonto
  const cuotaMonto = state.cuotas > 1 ? totalFinal / state.cuotas : totalFinal

  return {
    state,
    setStep,
    selectCliente,
    addItem,
    updateItemQty,
    removeItem,
    setPayment,
    reset,
    computed: { subtotal, base, interesMonto, totalFinal, cuotaMonto },
  }
}
