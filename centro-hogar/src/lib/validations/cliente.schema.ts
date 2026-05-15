import { z } from 'zod'

// Solo Nombre, Apellido y DNI son obligatorios. El resto es opcional y se puede
// enviar vacío: el backend normaliza '' → null antes de guardar.
export const clienteSchema = z.object({
  nombre:   z.string().trim().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().trim().min(1, 'El apellido es requerido').max(100),
  dni:      z.string().trim().min(1, 'El DNI es requerido').max(20),
  telefono: z.string().max(30).optional().nullable(),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  direccion: z.string().max(200).optional().nullable(),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
