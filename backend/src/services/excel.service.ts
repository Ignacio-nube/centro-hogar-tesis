import ExcelJS from 'exceljs'
import type { ExportTable } from './export-data.service'

// Paleta acorde al brand de la app (ámbar/teja)
const COLOR_HEADER_FILL = 'FF9A4F1E' // teja oscuro
const COLOR_HEADER_TEXT = 'FFFFFFFF' // blanco
const COLOR_ZEBRA       = 'FFFDF6EE' // crema muy claro
const COLOR_BORDER      = 'FFE5E0DA' // gris cálido

const MONEY_RE = /(total|precio|monto|subtotal|costo|importe)/i
const DATE_RE  = /(created_at|updated_at|fecha|_at$)/i

// Excel no admite > 31 chars ni los caracteres * ? : \ / [ ]
function safeSheetName(name: string): string {
  return name.replace(/[*?:\\/[\]]/g, ' ').slice(0, 31) || 'Hoja'
}

function colWidth(header: string, rows: Record<string, unknown>[]): number {
  const maxData = rows.reduce((max, row) => {
    const v = row[header]
    return Math.max(max, v === null || v === undefined ? 0 : String(v).length)
  }, 0)
  return Math.min(60, Math.max(8, header.length, maxData) + 2)
}

function isNumericColumn(header: string, rows: Record<string, unknown>[]): boolean {
  let sawValue = false
  for (const row of rows) {
    const v = row[header]
    if (v === null || v === undefined || v === '') continue
    sawValue = true
    if (typeof v !== 'number') return false
  }
  return sawValue
}

function toDateMaybe(v: unknown): Date | null {
  if (v instanceof Date) return v
  if (typeof v === 'string') {
    const d = new Date(v.includes(' ') && !v.includes('T') ? v.replace(' ', 'T') : v)
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

const thinBorder = {
  top:    { style: 'thin' as const, color: { argb: COLOR_BORDER } },
  bottom: { style: 'thin' as const, color: { argb: COLOR_BORDER } },
  left:   { style: 'thin' as const, color: { argb: COLOR_BORDER } },
  right:  { style: 'thin' as const, color: { argb: COLOR_BORDER } },
}

/**
 * Genera un workbook XLSX con formato: encabezado de color, filas zebra,
 * anchos automáticos, primera fila congelada, autofiltro y formatos de
 * número/fecha. Cada tabla = una hoja.
 */
export async function buildWorkbook(tables: ExportTable[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Centro Hogar'
  workbook.created = new Date()

  for (const table of tables) {
    const ws = workbook.addWorksheet(safeSheetName(table.sheetName), {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    const rows = table.rows
    if (rows.length === 0) {
      ws.addRow(['Sin datos'])
      ws.getCell('A1').font = { italic: true, color: { argb: 'FF888888' } }
      continue
    }

    const headers = Object.keys(rows[0])

    ws.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: colWidth(h, rows),
    }))

    const numericCols = new Set(headers.filter((h) => isNumericColumn(h, rows)))

    // Filas de datos (coerción de fechas)
    for (const row of rows) {
      const values: Record<string, unknown> = {}
      for (const h of headers) {
        const v = row[h]
        if (DATE_RE.test(h)) {
          values[h] = toDateMaybe(v) ?? (v ?? '')
        } else {
          values[h] = v ?? ''
        }
      }
      ws.addRow(values)
    }

    // Encabezado
    const headerRow = ws.getRow(1)
    headerRow.height = 20
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } }
      cell.font = { bold: true, color: { argb: COLOR_HEADER_TEXT } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = thinBorder
    })

    // Cuerpo: zebra, bordes, alineación y formatos
    for (let r = 2; r <= ws.rowCount; r++) {
      const dataRow = ws.getRow(r)
      const zebra = r % 2 === 0
      headers.forEach((h, idx) => {
        const cell = dataRow.getCell(idx + 1)
        cell.border = thinBorder
        if (zebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } }
        }
        if (numericCols.has(h)) {
          cell.alignment = { horizontal: 'right' }
          if (MONEY_RE.test(h)) cell.numFmt = '#,##0.00'
        } else if (DATE_RE.test(h) && cell.value instanceof Date) {
          cell.numFmt = 'yyyy-mm-dd hh:mm'
        }
      })
    }

    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to:   { row: 1, column: headers.length },
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
