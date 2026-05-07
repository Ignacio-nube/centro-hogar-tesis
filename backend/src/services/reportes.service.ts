import { pool } from '../config/database'

export const reportesService = {

  async ventasPorPeriodo(fechaDesde: string, fechaHasta: string) {
    const [rows] = await pool.execute<any[]>(
      `SELECT
         COUNT(*)                                AS total_ventas,
         COALESCE(SUM(total_final), 0)           AS ingreso_total,
         COALESCE(AVG(total_final), 0)           AS ticket_promedio,
         COALESCE(SUM(descuento),  0)            AS total_descuentos,
         COALESCE(SUM(interes_monto), 0)         AS total_intereses
       FROM ventas
       WHERE estado_id = 1 AND created_at BETWEEN ? AND ?`,
      [fechaDesde, fechaHasta]
    )
    return rows[0]
  },

  async ventasPorMetodoPago(fechaDesde: string, fechaHasta: string) {
    const [rows] = await pool.execute<any[]>(
      `SELECT mp.nombre AS metodo_pago,
              COUNT(*)                        AS cantidad,
              COALESCE(SUM(v.total_final), 0) AS total
       FROM ventas v
       JOIN metodos_pago mp ON mp.id = v.metodo_pago_id
       WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
       GROUP BY mp.id, mp.nombre
       ORDER BY total DESC`,
      [fechaDesde, fechaHasta]
    )
    return rows
  },

  async ventasPorVendedor(fechaDesde: string, fechaHasta: string) {
    const [rows] = await pool.execute<any[]>(
      `SELECT u.id, CONCAT(u.nombre, ' ', u.apellido) AS vendedor,
              COUNT(*)                        AS total_ventas,
              COALESCE(SUM(v.total_final), 0) AS monto_total
       FROM ventas v
       JOIN usuarios u ON u.id = v.vendedor_id
       WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
       GROUP BY u.id
       ORDER BY monto_total DESC`,
      [fechaDesde, fechaHasta]
    )
    return rows
  },

  async productosTopVentas(limit = 10) {
    // Acotar a 365 días: con 60k+ ventas, agrupar todo el histórico es lento.
    const desde = new Date()
    desde.setDate(desde.getDate() - 365)
    const desdeStr = desde.toISOString().slice(0, 19).replace('T', ' ')

    const [rows] = await pool.execute<any[]>(
      `SELECT p.id, p.codigo, p.nombre,
              SUM(vi.cantidad)                        AS unidades_vendidas,
              SUM(vi.subtotal)                        AS ingreso_total
       FROM venta_items vi
       JOIN productos p ON p.id = vi.producto_id
       JOIN ventas v     ON v.id = vi.venta_id
       WHERE v.estado_id = 1 AND v.created_at >= ?
       GROUP BY p.id
       ORDER BY unidades_vendidas DESC
       LIMIT ?`,
      [desdeStr, limit]
    )
    return rows
  },

  async productosTopVentasPeriodo(fechaDesde: string, fechaHasta: string, limit = 10) {
    const [rows] = await pool.execute<any[]>(
      `SELECT p.id, p.codigo, p.nombre,
              SUM(vi.cantidad)                        AS unidades_vendidas,
              COALESCE(SUM(vi.subtotal), 0)           AS ingreso_total
       FROM venta_items vi
       JOIN productos p ON p.id = vi.producto_id
       JOIN ventas v     ON v.id = vi.venta_id
       WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
       GROUP BY p.id
       ORDER BY unidades_vendidas DESC
       LIMIT ?`,
      [fechaDesde, fechaHasta, limit]
    )
    return rows.map((r: any) => ({
      ...r,
      unidades_vendidas: Number(r.unidades_vendidas),
      ingreso_total:     Number(r.ingreso_total),
    }))
  },

  async clientesTopComprasPeriodo(fechaDesde: string, fechaHasta: string, limit = 10) {
    const [rows] = await pool.execute<any[]>(
      `SELECT c.id,
              CONCAT(c.nombre, ' ', c.apellido) AS cliente,
              COUNT(v.id)                       AS total_compras,
              COALESCE(SUM(v.total_final), 0)   AS monto_total
       FROM ventas v
       JOIN clientes c ON c.id = v.cliente_id
       WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
       GROUP BY c.id
       ORDER BY monto_total DESC
       LIMIT ?`,
      [fechaDesde, fechaHasta, limit]
    )
    return rows.map((r: any) => ({
      ...r,
      total_compras: Number(r.total_compras),
      monto_total:   Number(r.monto_total),
    }))
  },

  async ventasPorDiaRango(fechaDesde: string, fechaHasta: string) {
    const [rows] = await pool.execute<any[]>(
      `SELECT DATE(created_at) AS fecha,
              COUNT(*)         AS cantidad,
              SUM(total_final) AS total
       FROM ventas
       WHERE estado_id = 1 AND created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY fecha ASC`,
      [fechaDesde, fechaHasta]
    )
    return rows.map((r: any) => ({
      fecha:    String(r.fecha).slice(0, 10),
      cantidad: Number(r.cantidad),
      total:    Number(r.total),
    }))
  },

  async stockActual() {
    const [rows] = await pool.execute<any[]>(
      `SELECT p.id, p.codigo, p.nombre, p.stock_actual, p.stock_minimo,
              c.nombre AS categoria,
              (p.stock_actual <= p.stock_minimo) AS bajo_stock
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.activo = 1
       ORDER BY bajo_stock DESC, p.nombre ASC`
    )
    return rows.map((r: any) => ({
      ...r,
      bajo_stock: Boolean(r.bajo_stock),
    }))
  },

  async clientesTopCompras(limit = 10) {
    const desde = new Date()
    desde.setDate(desde.getDate() - 365)
    const desdeStr = desde.toISOString().slice(0, 19).replace('T', ' ')

    const [rows] = await pool.execute<any[]>(
      `SELECT c.id,
              CONCAT(c.nombre, ' ', c.apellido) AS cliente,
              COUNT(v.id)                       AS total_compras,
              COALESCE(SUM(v.total_final), 0)   AS monto_total
       FROM ventas v
       JOIN clientes c ON c.id = v.cliente_id
       WHERE v.estado_id = 1 AND v.created_at >= ?
       GROUP BY c.id
       ORDER BY monto_total DESC
       LIMIT ?`,
      [desdeStr, limit]
    )
    return rows
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────

  /** Top N categorías por unidades vendidas en el período. Agrupa el resto en "Otros". */
  async categoriasPorVentas(fechaDesde: string, fechaHasta: string, topN = 5): Promise<{ categoria: string; unidades: number }[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria,
              SUM(vi.cantidad) AS unidades
       FROM venta_items vi
       JOIN productos p  ON p.id = vi.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       JOIN ventas v     ON v.id = vi.venta_id AND v.estado_id = 1
                        AND v.created_at BETWEEN ? AND ?
       GROUP BY p.categoria_id, c.nombre
       ORDER BY unidades DESC`,
      [fechaDesde, fechaHasta],
    )
    const parsed = rows.map((r: any) => ({
      categoria: String(r.categoria),
      unidades:  Number(r.unidades),
    }))
    if (parsed.length <= topN) return parsed
    const top    = parsed.slice(0, topN)
    const otros  = parsed.slice(topN).reduce((acc, r) => acc + r.unidades, 0)
    return [...top, { categoria: 'Otros', unidades: otros }]
  },

  /**
   * Top M productos por cada categoría (solo las del topN de categorías) en el período.
   * Productos menores de cada categoría se agrupan como "Otros".
   */
  async productosPorCategoria(categorias: string[], fechaDesde: string, fechaHasta: string, topM = 3): Promise<
    { categoria: string; producto: string; unidades: number }[]
  > {
    if (categorias.length === 0) return []
    // Excluimos "Otros" y "Sin categoría" del join — son grupos sintéticos
    const realCats = categorias.filter((c) => c !== 'Otros' && c !== 'Sin categoría')
    if (realCats.length === 0) return []

    const placeholders = realCats.map(() => '?').join(',')
    const [rows] = await pool.execute<any[]>(
      `SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria,
              p.nombre AS producto,
              SUM(vi.cantidad) AS unidades
       FROM venta_items vi
       JOIN productos p  ON p.id = vi.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       JOIN ventas v     ON v.id = vi.venta_id AND v.estado_id = 1
                        AND v.created_at BETWEEN ? AND ?
       WHERE COALESCE(c.nombre, 'Sin categoría') IN (${placeholders})
       GROUP BY p.categoria_id, c.nombre, p.id, p.nombre
       ORDER BY categoria ASC, unidades DESC`,
      [fechaDesde, fechaHasta, ...realCats],
    )

    // Agrupar por categoría y tomar top M + Otros
    const byCat: Record<string, { producto: string; unidades: number }[]> = {}
    for (const r of rows as any[]) {
      const cat = String(r.categoria)
      if (!byCat[cat]) byCat[cat] = []
      byCat[cat].push({ producto: String(r.producto), unidades: Number(r.unidades) })
    }

    const result: { categoria: string; producto: string; unidades: number }[] = []
    for (const cat of realCats) {
      const prods = byCat[cat] ?? []
      const top   = prods.slice(0, topM)
      const rest  = prods.slice(topM).reduce((acc, p) => acc + p.unidades, 0)
      for (const p of top) result.push({ categoria: cat, ...p })
      if (rest > 0) result.push({ categoria: cat, producto: 'Otros', unidades: rest })
    }
    return result
  },

  /** Top N vendedores en el período por monto total. */
  async vendedoresTop(fechaDesde: string, fechaHasta: string, limit = 5): Promise<
    { vendedor: string; total_ventas: number; monto_total: number }[]
  > {
    const [rows] = await pool.execute<any[]>(
      `SELECT CONCAT(u.nombre, ' ', u.apellido) AS vendedor,
              COUNT(v.id)                       AS total_ventas,
              COALESCE(SUM(v.total_final), 0)   AS monto_total
       FROM ventas v
       JOIN usuarios u ON u.id = v.vendedor_id
       WHERE v.estado_id = 1 AND v.created_at BETWEEN ? AND ?
       GROUP BY u.id
       ORDER BY monto_total DESC
       LIMIT ?`,
      [fechaDesde, fechaHasta, limit],
    )
    return rows.map((r: any) => ({
      vendedor:     String(r.vendedor),
      total_ventas: Number(r.total_ventas),
      monto_total:  Number(r.monto_total),
    }))
  },

  /** Datos del dashboard en una sola llamada (último mes). */
  async dashboardData() {
    const TOP_CATS  = 5
    const TOP_PRODS = 3

    // Rango: últimos 30 días hasta hoy (inclusive) en UTC-3
    const ahora      = new Date()
    const fechaHasta = ahora.toISOString().slice(0, 10) + ' 23:59:59'
    const hace30     = new Date(ahora)
    hace30.setDate(hace30.getDate() - 29)
    const fechaDesde = hace30.toISOString().slice(0, 10) + ' 00:00:00'

    const [categoriasRaw, vendedores] = await Promise.all([
      this.categoriasPorVentas(fechaDesde, fechaHasta, TOP_CATS),
      this.vendedoresTop(fechaDesde, fechaHasta, 5),
    ])
    const catNames  = categoriasRaw.map((c) => c.categoria)
    const productos = await this.productosPorCategoria(catNames, fechaDesde, fechaHasta, TOP_PRODS)
    return {
      categorias_top:          categoriasRaw,
      productos_por_categoria: productos,
      vendedores_top:          vendedores,
    }
  },

  async resumenCompleto(fechaDesde: string, fechaHasta: string) {
    const [resumen, porMetodo, porVendedor, productosTop, clientesTop, ventasPorDia] = await Promise.all([
      this.ventasPorPeriodo(fechaDesde, fechaHasta),
      this.ventasPorMetodoPago(fechaDesde, fechaHasta),
      this.ventasPorVendedor(fechaDesde, fechaHasta),
      this.productosTopVentasPeriodo(fechaDesde, fechaHasta, 10),
      this.clientesTopComprasPeriodo(fechaDesde, fechaHasta, 10),
      this.ventasPorDiaRango(fechaDesde, fechaHasta),
    ])
    return {
      resumen: {
        ...resumen,
        total_ventas:    Number(resumen.total_ventas),
        ingreso_total:   Number(resumen.ingreso_total),
        ticket_promedio: Number(resumen.ticket_promedio),
        total_descuentos: Number(resumen.total_descuentos),
        total_intereses:  Number(resumen.total_intereses),
      },
      por_metodo:    porMetodo,
      por_vendedor:  porVendedor,
      productos_top: productosTop,
      clientes_top:  clientesTop,
      ventas_por_dia: ventasPorDia,
    }
  },
}

