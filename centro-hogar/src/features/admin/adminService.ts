import { api } from '@/lib/api'

export interface PurgePreview {
  years:             number
  count:             number
  monto_total:       number
  fecha_mas_antigua: string | null
  fecha_corte:       string
}

export interface PurgeResult {
  years:       number
  deleted:     number
  fecha_corte: string
}

export const adminService = {
  async previewPurgeOldSales(years: number): Promise<PurgePreview> {
    return api.get<PurgePreview>(`/admin/purge-old-sales/preview?years=${years}`)
  },

  async purgeOldSales(years: number): Promise<PurgeResult> {
    return api.post<PurgeResult>('/admin/purge-old-sales', { years })
  },

  /** Descarga el Excel con las ventas que se van a purgar (no borra nada). */
  async exportPurgeOldSales(years: number): Promise<{ blob: Blob; filename: string | null }> {
    return api.download(`/admin/purge-old-sales/export?years=${years}`)
  },
}
