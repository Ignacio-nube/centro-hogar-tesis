import { pool } from '../config/database'
import type { ExportTable } from './export-data.service'

function cutoffDate(years: number): string {
  const desde = new Date()
  desde.setFullYear(desde.getFullYear() - years)
  return desde.toISOString().slice(0, 19).replace('T', ' ')
}

export const adminService = {

  /**
   * Cuenta cuántas ventas hay anteriores a (hoy - years años) y devuelve
   * fecha más antigua + monto agregado, sin borrar nada.
   */
  async previewPurgeOldSales(years: number): Promise<{
    count:           number
    monto_total:     number
    fecha_mas_antigua: string | null
    fecha_corte:     string
  }> {
    const corte = cutoffDate(years)

    const [rows] = await pool.execute<any[]>(
      `SELECT COUNT(*)                       AS count,
              COALESCE(SUM(total_final), 0)  AS monto_total,
              MIN(created_at)                AS fecha_mas_antigua
       FROM ventas
       WHERE created_at < ?`,
      [corte],
    )
    const r = rows[0]
    return {
      count:           Number(r.count),
      monto_total:     Number(r.monto_total),
      fecha_mas_antigua: r.fecha_mas_antigua ? String(r.fecha_mas_antigua) : null,
      fecha_corte:     corte,
    }
  },

  /**
   * Borra ventas anteriores a (hoy - years años). venta_items se borran por
   * CASCADE; movimientos_stock NO se tocan (mantienen el historial).
   * No re-numera las ventas restantes (numero_venta sigue creciendo).
   */
  async purgeOldSales(years: number): Promise<{ deleted: number; fecha_corte: string }> {
    if (years < 1) throw new Error('El umbral mínimo es 1 año')

    const corte = cutoffDate(years)

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // Borra ventas; venta_items caen por ON DELETE CASCADE.
      const [result] = await conn.execute<any>(
        `DELETE FROM ventas WHERE created_at < ?`,
        [corte],
      )
      const deleted = Number((result as { affectedRows?: number }).affectedRows ?? 0)

      await conn.commit()
      return { deleted, fecha_corte: corte }
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  /**
   * Datos legibles de las ventas que se van a purgar (anteriores a hoy − years),
   * para generar la copia en Excel ANTES de borrar. No modifica nada.
   */
  async getPurgeExportData(years: number): Promise<ExportTable[]> {
    const corte = cutoffDate(years)

    const [ventas] = await pool.execute<any[]>(
      `SELECT v.numero_venta                              AS 'N Venta',
              v.created_at                                AS 'Fecha',
              TRIM(CONCAT(COALESCE(c.nombre,''), ' ', COALESCE(c.apellido,'')))
                                                          AS 'Cliente',
              CONCAT(u.nombre, ' ', u.apellido)           AS 'Vendedor',
              mp.nombre                                   AS 'Metodo Pago',
              ev.nombre                                   AS 'Estado',
              v.subtotal                                  AS 'Subtotal',
              v.descuento                                 AS 'Descuento',
              v.interes_monto                             AS 'Interes',
              v.total_final                               AS 'Total',
              v.cuotas                                    AS 'Cuotas',
              v.notas                                     AS 'Notas'
       FROM ventas v
       JOIN estados_venta ev ON ev.id = v.estado_id
       JOIN metodos_pago  mp ON mp.id = v.metodo_pago_id
       JOIN usuarios       u ON u.id  = v.vendedor_id
       LEFT JOIN clientes  c ON c.id  = v.cliente_id
       WHERE v.created_at < ?
       ORDER BY v.created_at ASC`,
      [corte],
    )

    const [items] = await pool.execute<any[]>(
      `SELECT v.numero_venta        AS 'N Venta',
              v.created_at          AS 'Fecha',
              p.codigo              AS 'Codigo',
              p.nombre              AS 'Producto',
              vi.cantidad           AS 'Cantidad',
              vi.precio_unitario    AS 'Precio Unitario',
              vi.subtotal           AS 'Subtotal'
       FROM venta_items vi
       JOIN ventas    v ON v.id = vi.venta_id
       JOIN productos p ON p.id = vi.producto_id
       WHERE v.created_at < ?
       ORDER BY v.created_at ASC, vi.id ASC`,
      [corte],
    )

    return [
      { table: 'ventas',      sheetName: 'Ventas eliminadas',  rows: ventas as Record<string, unknown>[] },
      { table: 'venta_items', sheetName: 'Detalle eliminadas',  rows: items  as Record<string, unknown>[] },
    ]
  },
}
