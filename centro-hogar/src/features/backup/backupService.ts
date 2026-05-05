import { api } from '@/lib/api'

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadBackup(): Promise<void> {
  const { blob, filename } = await api.download('/reportes/backup/csv')
  triggerDownload(blob, filename ?? `centro-hogar-backup-${new Date().toISOString().slice(0, 10)}.zip`)
}

export async function downloadBackupExcel(): Promise<void> {
  const { blob, filename } = await api.download('/reportes/backup/excel')
  triggerDownload(blob, filename ?? `centro-hogar-backup-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
