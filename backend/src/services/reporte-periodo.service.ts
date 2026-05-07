import { pool } from '../config/database'
import type { ExportTable } from './export-data.service'

/**
 * Arma las hojas del reporte filtrado por período.
 * A diferencia de getExportData() (backup completo), todo lo aquí devuelto
 * está acotado al rango [fechaDesde, fechaHasta].
 */
export async function getReportePeriodoData(
  fechaDesde: string,
  fechaHasta: string,
): Promise<ExportTable[]> {

  const [resumenRows] = await pool.execute<any[]>(
    `SELECT
       COUNT(*)                                AS total_ventas,
       COALESCE(SUM(total_final), 0)           AS ingreso_total,
       COALESCE(AVG(total_final), 0)           AS ticket_promedio,
       COALESCE(SUM(descuento),  0)            AS total_descuentos,
       COALESCE(SUM(interes_monto), 0)         AS total_intereses
     FROM ventas
     WHERE estado_id = 1 AND created_at BETWEEN ? AND ?`,
    [fechaDesde, fechaHasta],
  )
  const resumen = resumenRows[0] as Record<string, unknown>

  const [ventas] = await pool.execute<any[]>(
    `SELECT v.id, v.numero_venta, v.created_at AS fecha,
            CONCAT(c.nombre, ' ', c.apellido)              AS cliente,
            CONCAT(u.nombre, ' ', u.apellido)              AS vendedor,
            mp.nombre                                       AS metodo_pago,
            tt.nombre                                       AS tipo_tarjeta,
            v.cuotas, v.subtotal, v.descuento,
            v.interes_porcentaje, v.interes_monto, v.total_final,
            ev.nombre                                       AS estado,
            v.notas
     FROM ventas v
     LEFT JOIN clientes      c  ON c.id  = v.cliente_id
     JOIN usuarios      u  ON u.id  = v.vendedor_id
     JOIN metodos_pago  mp ON mp.id = v.metodo_pago_id
     LEFT JOIN tipos_tarjeta tt ON tt.id = v.tipo_tarjeta_id
     JOIN estados_venta ev ON ev.id = v.estado_id
     WHERE v.created_at BETWEEN ? AND ?
     ORDER BY v.created_at ASC, v.numero_venta ASC`,
    [fechaDesde, fechaHasta],
  )

  const [detalle] = await pool.execute<any[]>(
    `SELECT v.numero_venta, v.created_at AS fecha,
            p.codigo, p.nombre AS producto,
            vi.cantidad, vi.precio_unitario, vi.subtotal
     FROM venta_items vi
     JOIN ventas    v ON v.id = vi.venta_id
     JOIN productos p ON p.id = vi.producto_id
     WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
     ORDER BY v.created_at ASC, v.numero_venta ASC`,
    [fechaDesde, fechaHasta],
  )

  const [porMetodo] = await pool.execute<any[]>(
    `SELECT mp.nombre AS metodo_pago,
            COUNT(*)                        AS cantidad,
            COALESCE(SUM(v.total_final), 0) AS total
     FROM ventas v
     JOIN metodos_pago mp ON mp.id = v.metodo_pago_id
     WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
     GROUP BY mp.id, mp.nombre
     ORDER BY total DESC`,
    [fechaDesde, fechaHasta],
  )

  const [porVendedor] = await pool.execute<any[]>(
    `SELECT CONCAT(u.nombre, ' ', u.apellido) AS vendedor,
            COUNT(*)                          AS total_ventas,
            COALESCE(SUM(v.total_final), 0)   AS monto_total
     FROM ventas v
     JOIN usuarios u ON u.id = v.vendedor_id
     WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
     GROUP BY u.id
     ORDER BY monto_total DESC`,
    [fechaDesde, fechaHasta],
  )

  const [productosTop] = await pool.execute<any[]>(
    `SELECT p.codigo, p.nombre AS producto,
            SUM(vi.cantidad)              AS unidades_vendidas,
            COALESCE(SUM(vi.subtotal), 0) AS ingreso_total
     FROM venta_items vi
     JOIN productos p ON p.id = vi.producto_id
     JOIN ventas    v ON v.id = vi.venta_id
     WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
     GROUP BY p.id
     ORDER BY unidades_vendidas DESC
     LIMIT 50`,
    [fechaDesde, fechaHasta],
  )

  const [ventasPorDia] = await pool.execute<any[]>(
    `SELECT DATE(created_at) AS fecha,
            COUNT(*)         AS cantidad,
            SUM(total_final) AS total
     FROM ventas
     WHERE estado_id = 1 AND created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at)
     ORDER BY fecha ASC`,
    [fechaDesde, fechaHasta],
  )

  return [
    {
      table: 'resumen',
      sheetName: 'Resumen',
      rows: [{
        periodo_desde: fechaDesde.slice(0, 10),
        periodo_hasta: fechaHasta.slice(0, 10),
        total_ventas:    Number(resumen.total_ventas),
        ingreso_total:   Number(resumen.ingreso_total),
        ticket_promedio: Number(resumen.ticket_promedio),
        total_descuentos: Number(resumen.total_descuentos),
        total_intereses:  Number(resumen.total_intereses),
      }],
    },
    { table: 'ventas',         sheetName: 'Ventas',           rows: ventas as Record<string, unknown>[] },
    { table: 'detalle_ventas', sheetName: 'Detalle Ventas',   rows: detalle as Record<string, unknown>[] },
    { table: 'por_metodo',     sheetName: 'Por Metodo Pago',  rows: porMetodo as Record<string, unknown>[] },
    { table: 'por_vendedor',   sheetName: 'Por Vendedor',     rows: porVendedor as Record<string, unknown>[] },
    { table: 'productos_top',  sheetName: 'Top Productos',    rows: productosTop as Record<string, unknown>[] },
    { table: 'ventas_por_dia', sheetName: 'Ventas Por Dia',   rows: ventasPorDia as Record<string, unknown>[] },
  ]
}
