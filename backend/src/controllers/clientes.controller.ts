import type { Request, Response } from 'express'
import { z } from 'zod'
import { clientesService } from '../services/clientes.service'
import * as r from '../utils/response'

// '' o null/undefined → null; si no, el string sin tocar.
const emptyToNull = (v: unknown) =>
  v === '' || v === undefined ? null : v

const createSchema = z.object({
  nombre:    z.string().trim().min(1).max(100),
  apellido:  z.string().trim().min(1).max(100),
  dni:       z.string().trim().min(1, 'El DNI es requerido').max(20),
  telefono:  z.preprocess(emptyToNull, z.string().max(30).nullable()),
  email:     z.preprocess(emptyToNull, z.string().email('Email inválido').nullable()),
  direccion: z.preprocess(emptyToNull, z.string().max(255).nullable()),
})

export const clientesController = {

  async list(req: Request, res: Response): Promise<void> {
    const activoStr = req.query['activo'] as string | undefined
    const sortRaw   = req.query['sort'] as string | undefined
    const sort: 'recientes' | 'nombre' | undefined =
      sortRaw === 'recientes' ? 'recientes' : sortRaw === 'nombre' ? 'nombre' : undefined

    const result = await clientesService.list({
      search:    req.query['search'] as string | undefined,
      activo:    activoStr !== undefined ? activoStr !== 'false' : undefined,
      sort,
      page:      req.query['page']     ? parseInt(req.query['page'] as string, 10)     : 1,
      pageSize:  req.query['pageSize'] ? parseInt(req.query['pageSize'] as string, 10) : 20,
      skipCount: req.query['skipCount'] === 'true',
    })
    r.ok(res, result)
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const cliente = await clientesService.getById(id)
    if (!cliente) { r.notFound(res, 'Cliente no encontrado'); return }
    r.ok(res, cliente)
  },

  async create(req: Request, res: Response): Promise<void> {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const cliente = await clientesService.create(parsed.data)
    r.created(res, cliente)
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const parsed = createSchema.partial().extend({ activo: z.boolean().optional() }).safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const cliente = await clientesService.update(id, parsed.data)
    r.ok(res, cliente)
  },

  async search(req: Request, res: Response): Promise<void> {
    const q = req.query['q'] as string | undefined
    if (!q || q.trim().length < 2) { r.ok(res, []); return }

    const clientes = await clientesService.search(q.trim())
    r.ok(res, clientes)
  },

  async historial(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const historial = await clientesService.getHistorial(id, {
      page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : 1,
      pageSize: req.query['pageSize'] ? parseInt(req.query['pageSize'] as string, 10) : 10,
    })
    const stats = await clientesService.getHistorialStats(id)
    r.ok(res, { ...historial, stats })
  },
}
