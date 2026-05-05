import type { Request, Response } from 'express'
import JSZip from 'jszip'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { getExportData } from '../services/export-data.service'

function escapeCell(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return 'sin_datos\n'
  const headers = Object.keys(rows[0])
  const lines = rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','))
  return [headers.join(','), ...lines].join('\n')
}

export const backupController = {
  async csv(_req: Request, res: Response): Promise<void> {
    const tables = await getExportData()
    const date = format(new Date(), 'yyyy-MM-dd')

    const zip = new JSZip()
    const folder = zip.folder(`centro-hogar-backup-${date}`)!

    for (const table of tables) {
      folder.file(`${table.sheetName}.csv`, toCSV(table.rows))
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer' })

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="centro-hogar-backup-${date}.zip"`)
    res.send(buffer)
  },

  async excel(_req: Request, res: Response): Promise<void> {
    const tables = await getExportData()
    const date = format(new Date(), 'yyyy-MM-dd')

    const workbook = XLSX.utils.book_new()

    for (const table of tables) {
      const rows = table.rows.length > 0 ? table.rows : [{ sin_datos: '' }]
      const worksheet = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(workbook, worksheet, table.sheetName.slice(0, 31))
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="centro-hogar-backup-${date}.xlsx"`)
    res.send(buffer)
  },
}
