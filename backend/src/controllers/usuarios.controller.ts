import type { Request, Response } from 'express'
import { z } from 'zod'
import { usuariosService } from '../services/usuarios.service'
import { authService } from '../services/auth.service'
import * as r from '../utils/response'

const createSchema = z.object({
  nombre:   z.string().min(1).max(80),
  apellido: z.string().min(1).max(80),
  email:    z.string().email(),
  password: z.string().min(8),
  rol:      z.enum(['admin', 'encargado_stock', 'vendedor']),
})

const updateSchema = z.object({
  nombre:   z.string().min(1).max(80).optional(),
  apellido: z.string().min(1).max(80).optional(),
  email:    z.string().email().optional(),
  rol:      z.enum(['admin', 'encargado_stock', 'vendedor']).optional(),
  activo:   z.boolean().optional(),
})

export const usuariosController = {

  async list(_req: Request, res: Response): Promise<void> {
    const usuarios = await usuariosService.list()
    r.ok(res, usuarios)
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const usuario = await usuariosService.getById(id)
    if (!usuario) { r.notFound(res, 'Usuario no encontrado'); return }
    r.ok(res, usuario)
  },

  async create(req: Request, res: Response): Promise<void> {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const { rol, ...rest } = parsed.data
    const rol_id = authService.getRolId(rol)
    const usuario = await usuariosService.create({ ...rest, rol_id })
    r.created(res, usuario)
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const { rol, ...rest } = parsed.data
    const data: Parameters<typeof usuariosService.update>[1] = { ...rest }
    if (rol) data.rol_id = authService.getRolId(rol)

    const usuario = await usuariosService.update(id, data)
    r.ok(res, usuario)
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const { newPassword } = req.body as { newPassword?: string }
    if (!newPassword || newPassword.length < 8) {
      r.badRequest(res, 'newPassword debe tener al menos 8 caracteres')
      return
    }
    await usuariosService.changePassword(id, newPassword)
    r.ok(res, { message: 'Contraseña actualizada' })
  },

  async toggleActivo(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const { activo } = req.body as { activo?: boolean }
    if (activo === undefined) { r.badRequest(res, 'Campo activo requerido'); return }

    const usuario = await usuariosService.toggleActivo(id, activo)
    r.ok(res, usuario)
  },
}
