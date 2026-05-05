import { z } from 'zod'

export const ventaSchema = z.object({
  cliente_id: z.string().optional().nullable(),
  descuento: z.coerce.number().min(0).default(0),
  metodo_pago: z.enum(['efectivo', 'tarjeta', 'transferencia']),
  tarjeta_tipo: z.enum(['visa', 'mastercard', 'naranja', 'debito']).optional().nullable(),
  cuotas: z.coerce.number().int().min(1).default(1),
  interes_porcentaje: z.coerce.number().min(0).max(100).default(0),
  notas: z.string().max(500).optional(),
}).refine(
  (data) => {
    if (data.metodo_pago === 'tarjeta') return !!data.tarjeta_tipo
    return true
  },
  { message: 'Seleccioná el tipo de tarjeta', path: ['tarjeta_tipo'] }
)

export type VentaFormValues = z.infer<typeof ventaSchema>
