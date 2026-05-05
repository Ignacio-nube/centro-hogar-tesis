import type { Request, Response } from 'express'
import { z } from 'zod'
import * as r from '../utils/response'
import { appSettingsService } from '../services/app-settings.service'
import { googleSheetsService } from '../services/google-sheets.service'

const configSchema = z.object({
  spreadsheetId: z.string().min(1, 'Spreadsheet ID requerido'),
})

export const integracionesController = {
  async getGoogleSheets(_req: Request, res: Response): Promise<void> {
    const settings = await appSettingsService.getGoogleSheetsSettings()
    r.ok(res, settings)
  },

  async setGoogleSheets(req: Request, res: Response): Promise<void> {
    const parsed = configSchema.safeParse(req.body)
    if (!parsed.success) {
      r.badRequest(res, parsed.error.errors[0]?.message ?? 'Datos inválidos')
      return
    }

    const spreadsheetId = googleSheetsService.parseSpreadsheetId(parsed.data.spreadsheetId)
    if (!spreadsheetId) {
      r.badRequest(res, 'Spreadsheet ID inválido')
      return
    }

    await appSettingsService.setGoogleSheetsSpreadsheetId(spreadsheetId, req.user!.sub)
    const settings = await appSettingsService.getGoogleSheetsSettings()
    r.ok(res, settings)
  },

  async syncGoogleSheets(req: Request, res: Response): Promise<void> {
    const user = req.user!
    if (user.rol !== 'admin') {
      r.forbidden(res, 'Solo admin puede sincronizar con Google Sheets')
      return
    }

    try {
      const spreadsheetId = await appSettingsService.getGoogleSheetsSpreadsheetId()
      if (!spreadsheetId) {
        r.badRequest(res, 'Primero configurá el Spreadsheet ID en Ajustes')
        return
      }

      const summary = await googleSheetsService.syncFull(spreadsheetId)
      const message = `Sincronización OK (${summary.sheets} hojas, ${summary.rows} filas)`

      await appSettingsService.setGoogleSheetsSyncResult(
        { status: 'ok', message },
        user.sub
      )

      const settings = await appSettingsService.getGoogleSheetsSettings()
      r.ok(res, { summary, settings })
    } catch (err) {
      const message = (err as Error).message || 'Error desconocido al sincronizar'

      await appSettingsService.setGoogleSheetsSyncResult(
        { status: 'error', message },
        user.sub
      )

      r.badRequest(res, message)
    }
  },

  async pingGoogleSheets(_req: Request, res: Response): Promise<void> {
    r.ok(res, { ok: true })
  },
}
