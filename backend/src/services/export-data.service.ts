import { pool } from '../config/database'

export interface ExportTable {
  table: string
  sheetName: string
  rows: Record<string, unknown>[]
}

const EXPORT_TABLES: Array<{ table: string; sheetName: string }> = [
  { table: 'clientes', sheetName: 'clientes' },
  { table: 'productos', sheetName: 'productos' },
  { table: 'categorias', sheetName: 'categorias' },
  { table: 'ventas', sheetName: 'ventas' },
  { table: 'venta_items', sheetName: 'venta_items' },
  { table: 'usuarios', sheetName: 'usuarios' },
  { table: 'movimientos_stock', sheetName: 'movimientos_stock' },
  { table: 'roles', sheetName: 'roles' },
  { table: 'metodos_pago', sheetName: 'metodos_pago' },
  { table: 'tipos_tarjeta', sheetName: 'tipos_tarjeta' },
  { table: 'estados_venta', sheetName: 'estados_venta' },
  { table: 'tipos_movimiento', sheetName: 'tipos_movimiento' },
]

export async function getExportData(): Promise<ExportTable[]> {
  const result: ExportTable[] = []

  for (const item of EXPORT_TABLES) {
    const [rows] = await pool.query<any[]>(`SELECT * FROM ${item.table}`)
    result.push({ table: item.table, sheetName: item.sheetName, rows: rows as Record<string, unknown>[] })
  }

  return result
}
