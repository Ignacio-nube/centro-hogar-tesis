import { pool } from '../config/database'

export interface ExportTable {
  table: string
  sheetName: string
  rows: Record<string, unknown>[]
}

// Columnas sensibles que se excluyen del Excel y CSV
const EXCLUDED_COLUMNS: Record<string, string[]> = {
  usuarios: ['password_hash'],
}

const EXPORT_TABLES: Array<{ table: string; sheetName: string }> = [
  { table: 'ventas',            sheetName: 'Ventas'           },
  { table: 'venta_items',       sheetName: 'Detalle Ventas'   },
  { table: 'clientes',          sheetName: 'Clientes'         },
  { table: 'productos',         sheetName: 'Productos'        },
  { table: 'categorias',        sheetName: 'Categorias'       },
  { table: 'movimientos_stock', sheetName: 'Mov. Stock'       },
  { table: 'usuarios',          sheetName: 'Usuarios'         },
  { table: 'roles',             sheetName: 'Roles'            },
  { table: 'metodos_pago',      sheetName: 'Metodos Pago'     },
  { table: 'tipos_tarjeta',     sheetName: 'Tipos Tarjeta'    },
  { table: 'estados_venta',     sheetName: 'Estados Venta'    },
  { table: 'tipos_movimiento',  sheetName: 'Tipos Movimiento' },
]

export async function getExportData(): Promise<ExportTable[]> {
  const result: ExportTable[] = []

  for (const item of EXPORT_TABLES) {
    const excluded = EXCLUDED_COLUMNS[item.table] ?? []
    const [rows] = await pool.query<any[]>(`SELECT * FROM ${item.table}`)
    const cleaned = (rows as Record<string, unknown>[]).map((row) => {
      if (excluded.length === 0) return row
      const copy = { ...row }
      for (const col of excluded) delete copy[col]
      return copy
    })
    result.push({ table: item.table, sheetName: item.sheetName, rows: cleaned })
  }

  return result
}
