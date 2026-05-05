import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().min(1, 'El apellido es requerido').max(100),
  dni: z.string().max(20).optional().nullable(),
  telefono: z.string().max(30).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  direccion: z.string().max(200).optional().nullable(),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
