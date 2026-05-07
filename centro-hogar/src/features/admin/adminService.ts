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
}
