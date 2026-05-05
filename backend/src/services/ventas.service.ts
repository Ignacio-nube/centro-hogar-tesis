import { pool } from '../config/database'
import { buildPaginated, parsePagination } from '../utils/pagination'
import type { Venta, VentaItem, CreateVentaPayload, PaginatedResult } from '../models/types'

// IDs lookup estáticos (evitan joins innecesarios)
const ESTADO_ID = { completada: 1, pendiente: 2, cancelada: 3 }
const TIPO_MOV_SALIDA  = 2  // 'salida'  en tipos_movimiento
const TIPO_MOV_ENTRADA = 1  // 'entrada' en tipos_movimiento

export const ventasService = {

  async list(params: {
    vendedorId?:   number
    estadoId?:     number
    metodoPagoId?: number
    fechaDesde?:   string
    fechaHasta?:   string
    search?:       string
    page?:         number
    pageSize?:     number
  }): Promise<PaginatedResult<Venta>> {
    const { vendedorId, estadoId, metodoPagoId, fechaDesde, fechaHasta, search } = params
    const { page, pageSize, offset } = parsePagination(params as Record<string, unknown>)

    const conditions: string[] = []
    const values: (string | number | boolean | null)[] = []
    let needsClientJoin = false

    if (vendedorId)   { conditions.push('v.vendedor_id = ?');    values.push(vendedorId) }
    if (estadoId)     { conditions.push('v.estado_id = ?');      values.push(estadoId) }
    if (metodoPagoId) { conditions.push('v.metodo_pago_id = ?'); values.push(metodoPagoId) }
    if (fechaDesde)   { conditions.push('v.created_at >= ?');    values.push(fechaDesde) }
    if (fechaHasta)   { conditions.push('v.created_at <= ?');    values.push(fechaHasta) }
    if (search) {
      const trimmed = search.trim()
      if (/^\d+$/.test(trimmed)) {
        // Búsqueda por número de venta exacto — usa índice, evita CAST + LIKE
        conditions.push('v.numero_venta = ?')
        values.push(Number(trimmed))
      } else {
        // Búsqueda por nombre/apellido de cliente
        conditions.push('(c.nombre LIKE ? OR c.apellido LIKE ?)')
        values.push(`%${trimmed}%`, `%${trimmed}%`)
        needsClientJoin = true
      }
    }

    const where          = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const clientCountJoin = needsClientJoin ? 'LEFT JOIN clientes c ON c.id = v.cliente_id' : ''

    const [countRows] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM ventas v ${clientCountJoin} ${where}`,
      values
    )
    const total = (countRows[0] as { total: number }).total

    const [rows] = await pool.execute<any[]>(
      `SELECT v.*, ev.nombre AS estado, mp.nombre AS metodo_pago,
              tt.nombre AS tipo_tarjeta,
              c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
              u.nombre AS vendedor_nombre, u.apellido AS vendedor_apellido
       FROM ventas v
       JOIN estados_venta  ev ON ev.id = v.estado_id
       JOIN metodos_pago   mp ON mp.id = v.metodo_pago_id
       JOIN usuarios        u ON u.id  = v.vendedor_id
       LEFT JOIN clientes      c  ON c.id  = v.cliente_id
       LEFT JOIN tipos_tarjeta tt ON tt.id = v.tipo_tarjeta_id
       ${where}
       ORDER BY v.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    )

    return buildPaginated(rows.map(normalizeVenta) as Venta[], total, page, pageSize)
  },

  async getById(id: number): Promise<Venta | null> {
    // Ambas queries en paralelo — evita la espera secuencial
    const [[headerRows], [itemRows]] = await Promise.all([
      pool.execute<any[]>(
        `SELECT v.*, ev.nombre AS estado, mp.nombre AS metodo_pago,
                tt.nombre AS tipo_tarjeta,
                c.id AS c_id, c.nombre AS c_nombre, c.apellido AS c_apellido,
                c.dni AS c_dni, c.telefono AS c_telefono,
                u.id AS u_id, u.nombre AS u_nombre, u.apellido AS u_apellido
         FROM ventas v
         JOIN estados_venta  ev ON ev.id = v.estado_id
         JOIN metodos_pago   mp ON mp.id = v.metodo_pago_id
         JOIN usuarios        u ON u.id  = v.vendedor_id
         LEFT JOIN clientes      c  ON c.id  = v.cliente_id
         LEFT JOIN tipos_tarjeta tt ON tt.id = v.tipo_tarjeta_id
         WHERE v.id = ?`,
        [id]
      ),
      pool.execute<any[]>(
        `SELECT vi.*, pr.codigo, pr.nombre AS producto_nombre, pr.precio_venta
         FROM venta_items vi
         JOIN productos pr ON pr.id = vi.producto_id
         WHERE vi.venta_id = ?`,
        [id]
      ),
    ])

    if (!headerRows[0]) return null

    const venta = normalizeVenta(headerRows[0]) as Venta
    venta.items = itemRows.map((i: any) => ({
      ...i,
      cantidad:        Number(i.cantidad),
      precio_unitario: Number(i.precio_unitario),
      subtotal:        Number(i.subtotal),
      producto: {
        id:           i.producto_id,
        codigo:       i.codigo,
        nombre:       i.producto_nombre,
        precio_venta: Number(i.precio_venta),
      },
    })) as VentaItem[]

    return venta
  },

  async create(vendedorId: number, payload: CreateVentaPayload): Promise<Venta> {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const subtotal   = payload.items.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0)
      const descuento  = payload.descuento ?? 0
      const interesPct = payload.interes_porcentaje ?? 0
      const interesAmt = payload.interes_monto ?? Math.round((subtotal * interesPct / 100) * 100) / 100

      // Insertar venta (numero_venta lo maneja el trigger de la DB)
      const [ventaResult] = await conn.execute<any>(
        `INSERT INTO ventas
           (numero_venta, cliente_id, vendedor_id, metodo_pago_id, tipo_tarjeta_id,
            cuotas, subtotal, descuento, interes_porcentaje, interes_monto, estado_id, notas)
         VALUES (0, ?,?,?,?,?,?,?,?,?,?,?)`,
        [
          payload.cliente_id ?? null,
          vendedorId,
          payload.metodo_pago_id,
          payload.tipo_tarjeta_id ?? null,
          payload.cuotas ?? 1,
          subtotal,
          descuento,
          interesPct,
          interesAmt,
          ESTADO_ID.completada,
          payload.notas ?? null,
        ]
      )
      const ventaId = (ventaResult as { insertId: number }).insertId

      // ── Paso 1: bloquear todos los productos de una vez ──────────────────
      const productIds = payload.items.map(i => i.producto_id)
      const inPh = productIds.map(() => '?').join(',')
      const [stockRows] = await conn.execute<any[]>(
        `SELECT id, stock_actual FROM productos WHERE id IN (${inPh}) FOR UPDATE`,
        productIds
      )

      // ── Paso 2: verificar stock (acumular si hay duplicados de producto) ─
      const stockMap  = new Map<number, number>()
      const neededMap = new Map<number, number>()
      for (const row of stockRows) stockMap.set(Number(row.id), Number(row.stock_actual))
      for (const item of payload.items) {
        neededMap.set(item.producto_id, (neededMap.get(item.producto_id) ?? 0) + item.cantidad)
      }
      for (const [pid, needed] of neededMap) {
        const available = stockMap.get(pid) ?? 0
        if (available < needed) {
          throw new Error(
            `Stock insuficiente para producto #${pid} (disponible: ${available}, requerido: ${needed})`
          )
        }
      }

      // ── Paso 3: bulk INSERT venta_items ──────────────────────────────────
      const itemVals = payload.items.flatMap(i => [ventaId, i.producto_id, i.cantidad, i.precio_unitario])
      const itemPh   = payload.items.map(() => '(?,?,?,?)').join(',')
      await conn.execute(
        `INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario) VALUES ${itemPh}`,
        itemVals
      )

      // ── Paso 4: bulk UPDATE stock con CASE WHEN (1 query) ────────────────
      const caseParts: string[] = []
      const caseVals:  number[] = []
      for (const [pid, delta] of neededMap) {
        caseParts.push('WHEN ? THEN ?')
        caseVals.push(pid, delta)
      }
      const idsPh   = [...neededMap.keys()].map(() => '?').join(',')
      const idsVals = [...neededMap.keys()]
      await conn.execute(
        `UPDATE productos
         SET stock_actual = stock_actual - (CASE id ${caseParts.join(' ')} END)
         WHERE id IN (${idsPh})`,
        [...caseVals, ...idsVals]
      )

      // ── Paso 5: bulk INSERT movimientos_stock ────────────────────────────
      const movVals = payload.items.flatMap(i => [i.producto_id, vendedorId, TIPO_MOV_SALIDA, -i.cantidad, `Venta #${ventaId}`])
      const movPh   = payload.items.map(() => '(?,?,?,?,?)').join(',')
      await conn.execute(
        `INSERT INTO movimientos_stock (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo) VALUES ${movPh}`,
        movVals
      )

      await conn.commit()
      return this.getById(ventaId) as Promise<Venta>
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async cancelar(id: number): Promise<void> {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // Verificar existencia y estado actual
      const [ventaRows] = await conn.execute<any[]>(
        'SELECT id, estado_id FROM ventas WHERE id = ?',
        [id]
      )
      if (!ventaRows[0]) throw new Error(`Venta #${id} no encontrada`)
      if (ventaRows[0].estado_id === ESTADO_ID.cancelada) throw new Error(`Venta #${id} ya está cancelada`)

      // Obtener items para restaurar stock
      const [items] = await conn.execute<any[]>(
        'SELECT producto_id, cantidad FROM venta_items WHERE venta_id = ?',
        [id]
      )

      if (items.length > 0) {
        // Bloquear productos para escritura
        const productIds = items.map((i: any) => Number(i.producto_id))
        const inPh = productIds.map(() => '?').join(',')
        await conn.execute(
          `SELECT id FROM productos WHERE id IN (${inPh}) FOR UPDATE`,
          productIds
        )

        // Acumular delta por producto (por si hay duplicados)
        const deltaMap = new Map<number, number>()
        for (const item of items) {
          const pid = Number(item.producto_id)
          deltaMap.set(pid, (deltaMap.get(pid) ?? 0) + Number(item.cantidad))
        }

        // Bulk UPDATE stock (restaurar con CASE WHEN)
        const caseParts: string[] = []
        const caseVals:  number[] = []
        for (const [pid, delta] of deltaMap) {
          caseParts.push('WHEN ? THEN ?')
          caseVals.push(pid, delta)
        }
        const idsPh   = [...deltaMap.keys()].map(() => '?').join(',')
        const idsVals = [...deltaMap.keys()]
        await conn.execute(
          `UPDATE productos
           SET stock_actual = stock_actual + (CASE id ${caseParts.join(' ')} END)
           WHERE id IN (${idsPh})`,
          [...caseVals, ...idsVals]
        )

        // Bulk INSERT movimientos (entradas por devolución)
        const movVals = items.flatMap((i: any) => [
          Number(i.producto_id), null, TIPO_MOV_ENTRADA, Number(i.cantidad), `Cancelación venta #${id}`,
        ])
        const movPh = items.map(() => '(?,?,?,?,?)').join(',')
        await conn.execute(
          `INSERT INTO movimientos_stock (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo) VALUES ${movPh}`,
          movVals
        )
      }

      // Marcar como cancelada
      await conn.execute(
        'UPDATE ventas SET estado_id = ? WHERE id = ?',
        [ESTADO_ID.cancelada, id]
      )

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async getStatsHoy(): Promise<{
    totalVentas:    number
    montoTotal:     number
    ticketPromedio: number
  }> {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyStr = hoy.toISOString().slice(0, 19).replace('T', ' ')

    const [rows] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(total_final), 0) AS monto
       FROM ventas
       WHERE estado_id = ? AND created_at >= ?`,
      [ESTADO_ID.completada, hoyStr]
    )
    const r = rows[0] as { total: number; monto: number }
    const montoTotal = Number(r.monto)
    return {
      totalVentas:    Number(r.total),
      montoTotal,
      ticketPromedio: r.total > 0 ? montoTotal / Number(r.total) : 0,
    }
  },

  async getVentasPorDia(dias = 30): Promise<{ fecha: string; total: number; cantidad: number }[]> {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    desde.setHours(0, 0, 0, 0)
    // Range con datetime string — permite index seek, evita DATE() wrapper en WHERE
    const desdeStr = desde.toISOString().slice(0, 19).replace('T', ' ')

    const [rows] = await pool.execute<any[]>(
      `SELECT DATE(created_at) AS fecha,
              SUM(total_final)  AS total,
              COUNT(*)          AS cantidad
       FROM ventas
       WHERE estado_id = ? AND created_at >= ?
       GROUP BY DATE(created_at)
       ORDER BY fecha ASC`,
      [ESTADO_ID.completada, desdeStr]
    )
    return rows.map((r: any) => ({
      fecha:    r.fecha,
      total:    Number(r.total),
      cantidad: Number(r.cantidad),
    }))
  },
}

function normalizeVenta(row: any): Partial<Venta> {
  return {
    ...row,
    subtotal:           Number(row.subtotal),
    descuento:          Number(row.descuento),
    interes_monto:      Number(row.interes_monto),
    total_final:        Number(row.total_final),
    interes_porcentaje: Number(row.interes_porcentaje),
    cliente: row.c_id ? {
      id:       row.c_id,
      nombre:   row.c_nombre,
      apellido: row.c_apellido,
      dni:      row.c_dni,
      telefono: row.c_telefono,
    } : (row.cliente_nombre ? {
      id:       row.cliente_id,
      nombre:   row.cliente_nombre,
      apellido: row.cliente_apellido,
    } : undefined),
    vendedor: row.u_id
      ? { id: row.u_id, nombre: row.u_nombre, apellido: row.u_apellido }
      : { id: row.vendedor_id, nombre: row.vendedor_nombre, apellido: row.vendedor_apellido },
  }
}
