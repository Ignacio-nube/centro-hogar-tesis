import type { Request, Response } from 'express'
import { reportesService } from '../services/reportes.service'
import { getReportePeriodoData } from '../services/reporte-periodo.service'
import { buildWorkbook } from './backup.controller'
import * as r from '../utils/response'

function getDateRange(req: Request): { fechaDesde: string; fechaHasta: string } {
  const ahora  = new Date()
  const hastaQ = (req.query['fechaHasta'] as string | undefined) ?? ahora.toISOString().slice(0, 10)
  const treintaDias = new Date(ahora)
  treintaDias.setDate(treintaDias.getDate() - 30)
  const desdeQ = (req.query['fechaDesde'] as string | undefined) ?? treintaDias.toISOString().slice(0, 10)
  // Normaliza siempre a YYYY-MM-DD (descarta cualquier hora que pueda venir del cliente)
  // y agrega los límites del día para incluir todas las ventas de ese día.
  const desde = String(desdeQ).slice(0, 10)
  const hasta = String(hastaQ).slice(0, 10)
  return { fechaDesde: `${desde} 00:00:00`, fechaHasta: `${hasta} 23:59:59` }
}

export const reportesController = {

  async dashboard(req: Request, res: Response): Promise<void> {
    const periodoQ = String(req.query['periodo'] ?? 'mes')
    const periodo: 'semana' | 'mes' | 'trimestre' | 'anio' =
      (['semana', 'mes', 'trimestre', 'anio'] as const).find((p) => p === periodoQ) ?? 'mes'
    const data = await reportesService.dashboardData(periodo)
    r.ok(res, data)
  },

  async resumen(req: Request, res: Response): Promise<void> {
    const { fechaDesde, fechaHasta } = getDateRange(req)
    const data = await reportesService.resumenCompleto(fechaDesde, fechaHasta)
    r.ok(res, data)
  },

  async resumenVentas(req: Request, res: Response): Promise<void> {
    const { fechaDesde, fechaHasta } = getDateRange(req)
    const [resumen, porMetodo, porVendedor] = await Promise.all([
      reportesService.ventasPorPeriodo(fechaDesde, fechaHasta),
      reportesService.ventasPorMetodoPago(fechaDesde, fechaHasta),
      reportesService.ventasPorVendedor(fechaDesde, fechaHasta),
    ])
    r.ok(res, { resumen, por_metodo_pago: porMetodo, por_vendedor: porVendedor })
  },

  async productosTop(_req: Request, res: Response): Promise<void> {
    const productos = await reportesService.productosTopVentas(10)
    r.ok(res, productos)
  },

  async stockActual(_req: Request, res: Response): Promise<void> {
    const stock = await reportesService.stockActual()
    r.ok(res, stock)
  },

  async clientesTop(_req: Request, res: Response): Promise<void> {
    const clientes = await reportesService.clientesTopCompras(10)
    r.ok(res, clientes)
  },

  async excelPeriodo(req: Request, res: Response): Promise<void> {
    const { fechaDesde, fechaHasta } = getDateRange(req)
    const tables = await getReportePeriodoData(fechaDesde, fechaHasta)
    const buffer = buildWorkbook(tables)

    const desdeStr = fechaDesde.slice(0, 10)
    const hastaStr = fechaHasta.slice(0, 10)
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte-ventas-${desdeStr}-${hastaStr}.xlsx"`
    )
    res.send(buffer)
  },

}
