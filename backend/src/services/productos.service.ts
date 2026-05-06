import { pool } from '../config/database'
import { buildPaginated, parsePagination } from '../utils/pagination'
import type { Producto, PaginatedResult } from '../models/types'

export const productosService = {

  async list(params: {
    search?:      string
    categoriaId?: number
    soloActivos?: boolean
    bajoStock?:   boolean
    conStock?:    boolean
    sort?:        'top' | 'nombre'
    page?:        number
    pageSize?:    number
  }): Promise<PaginatedResult<Producto>> {
    const { search, categoriaId, soloActivos = true, bajoStock, conStock, sort = 'nombre' } = params
    const { page, pageSize, offset } = parsePagination(params as Record<string, unknown>)

    const conditions: string[] = []
    const values: (string | number | boolean | null)[] = []

    if (soloActivos)   { conditions.push('p.activo = 1') }
    if (categoriaId)   { conditions.push('p.categoria_id = ?');     values.push(categoriaId) }
    if (search)        { conditions.push('(p.nombre LIKE ? OR p.codigo LIKE ?)'); values.push(`%${search}%`, `%${search}%`) }
    if (conStock)      { conditions.push('p.stock_actual > 0') }
    if (bajoStock)     { conditions.push('p.stock_actual <= p.stock_minimo') }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    if (sort === 'top') {
      // Ordenar por unidades vendidas (completadas) — con fallback a histórico si el período reciente da vacío
      const [countRows] = await pool.execute<any[]>(
        `SELECT COUNT(*) AS total FROM productos p ${where}`,
        values
      )
      const total = (countRows[0] as { total: number }).total

      const [rows] = await pool.execute<any[]>(
        `SELECT p.*, c.nombre AS categoria_nombre,
                COALESCE(SUM(vi.cantidad), 0) AS unidades_vendidas
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         LEFT JOIN venta_items vi ON vi.producto_id = p.id
         LEFT JOIN ventas v ON v.id = vi.venta_id AND v.estado_id = 1
         ${where}
         GROUP BY p.id
         ORDER BY unidades_vendidas DESC, p.nombre ASC
         LIMIT ? OFFSET ?`,
        [...values, pageSize, offset]
      )
      return buildPaginated((rows as any[]).map(normalizeProducto), total, page, pageSize)
    }

    const [countRows] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM productos p ${where}`,
      values
    )
    const total = (countRows[0] as { total: number }).total

    const [rows] = await pool.execute<any[]>(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       ${where}
       ORDER BY p.nombre ASC
       LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    )

    const data = (rows as any[]).map(normalizeProducto)
    return buildPaginated(data, total, page, pageSize)
  },

  async getById(id: number): Promise<Producto | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ?`,
      [id]
    )
    if (!rows[0]) return null
    return normalizeProducto(rows[0])
  },

  async create(data: {
    codigo:       string
    nombre:       string
    descripcion?: string | null
    precio_costo: number
    precio_venta: number
    stock_actual: number
    stock_minimo: number
    categoria_id?: number | null
    imagen_url?:  string | null
  }): Promise<Producto> {
    const [result] = await pool.execute<any>(
      `INSERT INTO productos
         (codigo, nombre, descripcion, precio_costo, precio_venta, stock_actual, stock_minimo, categoria_id, imagen_url)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        data.codigo, data.nombre, data.descripcion ?? null,
        data.precio_costo, data.precio_venta, data.stock_actual, data.stock_minimo,
        data.categoria_id ?? null, data.imagen_url ?? null,
      ]
    )
    const id = (result as { insertId: number }).insertId
    return this.getById(id) as Promise<Producto>
  },

  async update(id: number, data: Partial<{
    codigo:       string
    nombre:       string
    descripcion:  string | null
    precio_costo: number
    precio_venta: number
    stock_actual: number
    stock_minimo: number
    categoria_id: number | null
    imagen_url:   string | null
    activo:       boolean
  }>): Promise<Producto> {
    const fields: string[] = []
    const values: (string | number | boolean | null)[] = []

    const fieldMap: Record<string, string> = {
      codigo: 'codigo', nombre: 'nombre', descripcion: 'descripcion',
      precio_costo: 'precio_costo', precio_venta: 'precio_venta',
      stock_actual: 'stock_actual', stock_minimo: 'stock_minimo',
      categoria_id: 'categoria_id', imagen_url: 'imagen_url',
    }
    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${col} = ?`)
        values.push((data as any)[key])
      }
    }
    if (data.activo !== undefined) {
      fields.push('activo = ?')
      values.push(data.activo ? 1 : 0)
    }

    if (fields.length === 0) throw new Error('Nada que actualizar')

    values.push(id)
    await pool.execute(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await this.getById(id)
    if (!updated) throw new Error('Producto no encontrado')
    return updated
  },

  async updateStock(
    productoId: number,
    delta: number,
    usuarioId: number,
    tipoMovimientoId: number,
    motivo?: string
  ): Promise<Producto> {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const [rows] = await conn.execute<any[]>(
        'SELECT stock_actual FROM productos WHERE id = ? FOR UPDATE',
        [productoId]
      )
      const producto = rows[0] as { stock_actual: number } | undefined
      if (!producto) throw new Error('Producto no encontrado')

      const nuevoStock = producto.stock_actual + delta
      if (nuevoStock < 0) throw new Error('Stock insuficiente')

      await conn.execute('UPDATE productos SET stock_actual = ? WHERE id = ?', [nuevoStock, productoId])
      await conn.execute(
        'INSERT INTO movimientos_stock (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo) VALUES (?,?,?,?,?)',
        [productoId, usuarioId, tipoMovimientoId, delta, motivo ?? null]
      )

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    return this.getById(productoId) as Promise<Producto>
  },

  async getBajoStock(): Promise<Producto[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
       ORDER BY p.nombre ASC`
    )
    return (rows as any[]).map(normalizeProducto)
  },

  async topVendidosPeriodo(
    horas = 24,
    limit = 5
  ): Promise<Array<Producto & { unidades_vendidas: number }>> {
    const desde = new Date()
    desde.setHours(desde.getHours() - horas)
    const desdeStr = desde.toISOString().slice(0, 19).replace('T', ' ')

    const [rows] = await pool.execute<any[]>(
      `SELECT p.*, c.nombre AS categoria_nombre,
              SUM(vi.cantidad) AS unidades_vendidas
       FROM venta_items vi
       JOIN ventas     v  ON v.id  = vi.venta_id
       JOIN productos  p  ON p.id  = vi.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE v.estado_id = 1 AND v.created_at >= ? AND p.activo = 1
       GROUP BY p.id
       ORDER BY unidades_vendidas DESC
       LIMIT ?`,
      [desdeStr, limit]
    )

    if (rows.length > 0) {
      return rows.map((r: any) => ({
        ...normalizeProducto(r),
        unidades_vendidas: Number(r.unidades_vendidas),
      }))
    }

    // Fallback: top histórico
    const [fallback] = await pool.execute<any[]>(
      `SELECT p.*, c.nombre AS categoria_nombre,
              SUM(vi.cantidad) AS unidades_vendidas
       FROM venta_items vi
       JOIN ventas     v  ON v.id  = vi.venta_id
       JOIN productos  p  ON p.id  = vi.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE v.estado_id = 1 AND p.activo = 1
       GROUP BY p.id
       ORDER BY unidades_vendidas DESC
       LIMIT ?`,
      [limit]
    )
    return fallback.map((r: any) => ({
      ...normalizeProducto(r),
      unidades_vendidas: Number(r.unidades_vendidas),
    }))
  },
}

function normalizeProducto(row: any): Producto {
  return {
    ...row,
    precio_costo: Number(row.precio_costo),
    precio_venta: Number(row.precio_venta),
    activo:       Boolean(row.activo),
    stock_actual: Number(row.stock_actual),
    stock_minimo: Number(row.stock_minimo),
    categoria: row.categoria_id
      ? { id: row.categoria_id, nombre: row.categoria_nombre }
      : undefined,
  }
}
