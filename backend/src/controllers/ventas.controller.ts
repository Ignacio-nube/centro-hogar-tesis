import type { Request, Response } from 'express'
import { z } from 'zod'
import { ventasService } from '../services/ventas.service'
import { usuariosService } from '../services/usuarios.service'
import * as r from '../utils/response'

const createSchema = z.object({
  cliente_id:          z.number().int().positive().nullish(),
  metodo_pago_id:      z.number().int().positive(),
  tipo_tarjeta_id:     z.number().int().positive().nullish(),
  cuotas:              z.number().int().min(1).max(24).optional(),
  descuento:           z.number().nonnegative().optional(),
  interes_porcentaje:  z.number().nonnegative().optional(),
  interes_monto:       z.number().nonnegative().optional(),
  notas:               z.string().max(1000).nullish(),
  items: z.array(z.object({
    producto_id:     z.number().int().positive(),
    cantidad:        z.number().int().positive(),
    precio_unitario: z.number().positive(),
  })).min(1),
})

export const ventasController = {

  async list(req: Request, res: Response): Promise<void> {
    const result = await ventasService.list({
      vendedorId:   req.query['vendedorId']   ? parseInt(req.query['vendedorId'] as string, 10)   : undefined,
      estadoId:     req.query['estadoId']     ? parseInt(req.query['estadoId'] as string, 10)     : undefined,
      metodoPagoId: req.query['metodoPagoId'] ? parseInt(req.query['metodoPagoId'] as string, 10) : undefined,
      fechaDesde:   req.query['fechaDesde']   as string | undefined,
      fechaHasta:   req.query['fechaHasta']   as string | undefined,
      search:       req.query['search']       as string | undefined,
      page:         req.query['page']     ? parseInt(req.query['page'] as string, 10)     : 1,
      pageSize:     req.query['pageSize'] ? parseInt(req.query['pageSize'] as string, 10) : 20,
      skipCount:    req.query['skipCount'] === 'true',
    })
    r.ok(res, result)
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    const venta = await ventasService.getById(id)
    if (!venta) { r.notFound(res, 'Venta no encontrada'); return }
    r.ok(res, venta)
  },

  async create(req: Request, res: Response): Promise<void> {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos')
      return
    }
    const venta = await ventasService.create(req.user!.sub, parsed.data)
    r.created(res, venta)
  },

  async cancelar(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10)
    if (isNaN(id)) { r.badRequest(res, 'ID inválido'); return }

    await ventasService.cancelar(id, req.user!.sub)
    r.ok(res, { message: 'Venta cancelada' })
  },

  async statsHoy(_req: Request, res: Response): Promise<void> {
    const stats = await ventasService.getStatsHoy()
    r.ok(res, stats)
  },

  async ventasPorDia(req: Request, res: Response): Promise<void> {
    const dias = req.query['dias'] ? parseInt(req.query['dias'] as string, 10) : 30
    const data = await ventasService.getVentasPorDia(dias)
    r.ok(res, data)
  },

  async vendedores(_req: Request, res: Response): Promise<void> {
    const vendedores = await usuariosService.listVendedores()
    r.ok(res, vendedores)
  },
}
