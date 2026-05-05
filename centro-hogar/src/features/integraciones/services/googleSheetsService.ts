import { api } from '@/lib/api'
import type { GoogleSheetsSettings } from '@/types/app.types'

interface SyncResponse {
  summary: {
    sheets: number
    rows: number
  }
  settings: GoogleSheetsSettings
}

export const googleSheetsService = {
  getSettings(): Promise<GoogleSheetsSettings> {
    return api.get<GoogleSheetsSettings>('/integraciones/google-sheets')
  },

  setSpreadsheetId(spreadsheetId: string): Promise<GoogleSheetsSettings> {
    return api.put<GoogleSheetsSettings>('/integraciones/google-sheets', { spreadsheetId })
  },

  syncNow(): Promise<SyncResponse> {
    return api.post<SyncResponse>('/integraciones/google-sheets/sync', {})
  },
}
