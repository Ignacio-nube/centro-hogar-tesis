import type { Request, Response } from 'express'
import { z } from 'zod'
import { authService } from '../services/auth.service'
import * as r from '../utils/response'

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
})

export const authController = {

  async login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, 'Email y contraseña requeridos'); return }

    try {
      const result = await authService.login(parsed.data.email, parsed.data.password)
      r.ok(res, result)
    } catch (err) {
      r.unauthorized(res, (err as Error).message)
    }
  },

  async me(req: Request, res: Response): Promise<void> {
    const userId = req.user!.sub
    const usuario = await authService.getById(userId)
    if (!usuario) { r.notFound(res, 'Usuario no encontrado'); return }
    r.ok(res, usuario)
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    const parsed = changePasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      r.badRequest(res, 'currentPassword y newPassword (mín. 8 caracteres) son requeridos')
      return
    }
    try {
      await authService.changeOwnPassword(
        req.user!.sub,
        parsed.data.currentPassword,
        parsed.data.newPassword
      )
      r.ok(res, { message: 'Contraseña actualizada' })
    } catch (err) {
      r.badRequest(res, (err as Error).message)
    }
  },
}
