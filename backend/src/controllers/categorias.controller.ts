import type { Request, Response } from 'express'
import { z } from 'zod'
import { categoriasService } from '../services/categorias.service'
import * as r from '../utils/response'

const schema = z.object({
  nombre:      z.string().min(1).max(80),
  descripcion: z.string().max(255).nullish(),
})

export const categoriasController = {

  async list(req: Request, res: Response): Promise<void> {
    const soloActivas = req.query['todas'] !== 'true'
    const categorias = await categoriasService.list(soloActivas)
    r.ok(res, categorias)
  },

  async create(req: Request, res: Response): Promise<void> {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const categoria = await categoriasService.create(parsed.data)
    r.created(res, categoria)
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const parsed = schema.partial().safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const categoria = await categoriasService.update(id, parsed.data)
    r.ok(res, categoria)
  },

  async delete(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    await categoriasService.delete(id)
    r.noContent(res)
  },
}
