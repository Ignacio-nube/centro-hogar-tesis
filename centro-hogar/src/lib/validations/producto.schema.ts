import { z } from 'zod'

export const productoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(50),
  nombre: z.string().min(1, 'El nombre es requerido').max(150),
  descripcion: z.string().max(500).optional(),
  precio_costo: z.coerce.number().min(0, 'El precio debe ser positivo'),
  precio_venta: z.coerce.number().min(0, 'El precio debe ser positivo'),
  stock_actual: z.coerce.number().int().min(0),
  stock_minimo: z.coerce.number().int().min(0),
  categoria_id: z.string().optional().nullable(),
  imagen_url: z.string().url().optional().nullable(),
  activo: z.boolean().default(true),
})

export type ProductoFormValues = z.infer<typeof productoSchema>
