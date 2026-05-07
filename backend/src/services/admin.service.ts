import { pool } from '../config/database'

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
    const desde = new Date()
    desde.setFullYear(desde.getFullYear() - years)
    const corte = desde.toISOString().slice(0, 19).replace('T', ' ')

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

    const desde = new Date()
    desde.setFullYear(desde.getFullYear() - years)
    const corte = desde.toISOString().slice(0, 19).replace('T', ' ')

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
}
