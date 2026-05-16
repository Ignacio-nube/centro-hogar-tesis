import type { Request, Response } from 'express'
import { adminService } from '../services/admin.service'
import { buildWorkbook } from '../services/excel.service'
import * as r from '../utils/response'

function parseYears(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1 || n > 50) return null
  return Math.floor(n)
}

export const adminController = {

  async previewPurgeOldSales(req: Request, res: Response): Promise<void> {
    const years = parseYears(req.query['years'] ?? 2)
    if (years === null) {
      r.badRequest(res, 'Parámetro "years" inválido (debe ser entero entre 1 y 50)')
      return
    }
    const data = await adminService.previewPurgeOldSales(years)
    r.ok(res, { years, ...data })
  },

  async exportPurgeOldSales(req: Request, res: Response): Promise<void> {
    const years = parseYears(req.query['years'] ?? 2)
    if (years === null) {
      r.badRequest(res, 'Parámetro "years" inválido (debe ser entero entre 1 y 50)')
      return
    }
    const tables = await adminService.getPurgeExportData(years)
    const buffer = await buildWorkbook(tables)
    const fecha  = new Date().toISOString().slice(0, 10)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ventas-eliminadas-${fecha}.xlsx"`,
    )
    res.send(buffer)
  },

  async purgeOldSales(req: Request, res: Response): Promise<void> {
    const years = parseYears((req.body as { years?: unknown })?.years)
    if (years === null) {
      r.badRequest(res, 'Parámetro "years" inválido (debe ser entero entre 1 y 50)')
      return
    }
    const data = await adminService.purgeOldSales(years)
    r.ok(res, { years, ...data })
  },
}
