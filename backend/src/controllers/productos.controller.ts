import type { Request, Response } from 'express'
import { z } from 'zod'
import { productosService } from '../services/productos.service'
import * as r from '../utils/response'

const createSchema = z.object({
  codigo:       z.string().min(1).max(50),
  nombre:       z.string().min(1).max(150),
  descripcion:  z.string().nullish(),
  precio_costo: z.number().nonnegative(),
  precio_venta: z.number().nonnegative(),
  stock_actual: z.number().int().nonnegative(),
  stock_minimo: z.number().int().nonnegative(),
  categoria_id: z.number().int().positive().nullish(),
  imagen_url:   z.string().url().nullish(),
})

const stockSchema = z.object({
  delta:              z.number().int(),
  tipo_movimiento_id: z.number().int().positive(),
  motivo:             z.string().max(255).optional(),
})

export const productosController = {

  async list(req: Request, res: Response): Promise<void> {
    const sortRaw = req.query['sort'] as string | undefined
    const result = await productosService.list({
      search:        req.query['search']      as string | undefined,
      categoriaId:   req.query['categoriaId'] ? parseInt(req.query['categoriaId'] as string, 10) : undefined,
      soloActivos:   req.query['soloActivos']   !== 'false',
      soloInactivos: req.query['soloInactivos'] === 'true',
      bajoStock:     req.query['bajoStock']     === 'true',
      conStock:      req.query['conStock']      === 'true',
      sort:          sortRaw === 'top' ? 'top' : 'nombre',
      page:          req.query['page']     ? parseInt(req.query['page'] as string, 10) : 1,
      pageSize:      req.query['pageSize'] ? parseInt(req.query['pageSize'] as string, 10) : 20,
      skipCount:     req.query['skipCount']    === 'true',
    })
    r.ok(res, result)
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const producto = await productosService.getById(id)
    if (!producto) { r.notFound(res, 'Producto no encontrado'); return }
    r.ok(res, producto)
  },

  async create(req: Request, res: Response): Promise<void> {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const producto = await productosService.create(parsed.data)
    r.created(res, producto)
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const updateSchema = createSchema.partial().extend({ activo: z.boolean().optional() })
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const producto = await productosService.update(id, parsed.data)
    r.ok(res, producto)
  },

  async updateStock(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const parsed = stockSchema.safeParse(req.body)
    if (!parsed.success) { r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos'); return }

    const producto = await productosService.updateStock(
      id,
      parsed.data.delta,
      req.user!.sub,
      parsed.data.tipo_movimiento_id,
      parsed.data.motivo
    )
    r.ok(res, producto)
  },

  async bajoStock(_req: Request, res: Response): Promise<void> {
    const productos = await productosService.getBajoStock()
    r.ok(res, productos)
  },

  async topVendidos(req: Request, res: Response): Promise<void> {
    const horas = req.query['horas'] ? parseInt(req.query['horas'] as string, 10) : 24
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 5
    const productos = await productosService.topVendidosPeriodo(horas, limit)
    r.ok(res, productos)
  },
}
