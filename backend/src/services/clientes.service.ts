import { pool } from '../config/database'
import { buildPaginated, parsePagination } from '../utils/pagination'
import { escapeLike } from '../utils/sql'
import type { Cliente, Venta, PaginatedResult } from '../models/types'

export const clientesService = {

  async list(params: {
    search?:  string
    activo?:  boolean
    sort?:    'recientes' | 'nombre'
    page?:    number
    pageSize?: number
    skipCount?: boolean
  }): Promise<PaginatedResult<Cliente>> {
    const { search, activo, sort = 'nombre', skipCount } = params
    const { page, pageSize, offset } = parsePagination(params as Record<string, unknown>)

    const conditions: string[] = []
    const values: (string | number | boolean | null)[] = []

    if (activo !== undefined) { conditions.push('activo = ?'); values.push(activo ? 1 : 0) }
    if (search) {
      const safe = escapeLike(search)
      conditions.push('(nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?)')
      values.push(`%${safe}%`, `%${safe}%`, `%${safe}%`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderBy = sort === 'recientes'
      ? 'ORDER BY created_at DESC, id DESC'
      : 'ORDER BY apellido ASC, nombre ASC'

    const countPromise = skipCount
      ? Promise.resolve<[any[], any]>([[{ total: -1 }], null])
      : pool.execute<any[]>(`SELECT COUNT(*) AS total FROM clientes ${where}`, values)
    const rowsPromise = pool.execute<any[]>(
      `SELECT * FROM clientes ${where} ${orderBy} LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    )

    const [[countRows], [rows]] = await Promise.all([countPromise, rowsPromise])
    const total = (countRows[0] as { total: number }).total

    return buildPaginated(rows.map(normalizeCliente) as Cliente[], total, page, pageSize)
  },

  async getById(id: number): Promise<Cliente | null> {
    const [rows] = await pool.execute<any[]>('SELECT * FROM clientes WHERE id = ?', [id])
    if (!rows[0]) return null
    return normalizeCliente(rows[0]) as Cliente
  },

  async create(data: {
    nombre:    string
    apellido:  string
    dni?:      string | null
    telefono?: string | null
    email?:    string | null
    direccion?: string | null
  }): Promise<Cliente> {
    const [result] = await pool.execute<any>(
      `INSERT INTO clientes (nombre, apellido, dni, telefono, email, direccion)
       VALUES (?,?,?,?,?,?)`,
      [data.nombre, data.apellido, data.dni ?? null, data.telefono ?? null, data.email ?? null, data.direccion ?? null]
    )
    const id = (result as { insertId: number }).insertId
    return this.getById(id) as Promise<Cliente>
  },

  async update(id: number, data: Partial<{
    nombre:    string
    apellido:  string
    dni:       string | null
    telefono:  string | null
    email:     string | null
    direccion: string | null
    activo:    boolean
  }>): Promise<Cliente> {
    const fields: string[] = []
    const values: (string | number | boolean | null)[] = []

    const cols = ['nombre', 'apellido', 'dni', 'telefono', 'email', 'direccion'] as const
    for (const col of cols) {
      if ((data as any)[col] !== undefined) {
        fields.push(`${col} = ?`)
        values.push((data as any)[col])
      }
    }
    if (data.activo !== undefined) {
      fields.push('activo = ?')
      values.push(data.activo ? 1 : 0)
    }

    if (fields.length === 0) throw new Error('Nada que actualizar')

    values.push(id)
    await pool.execute(`UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await this.getById(id)
    if (!updated) throw new Error('Cliente no encontrado')
    return updated
  },

  async delete(id: number): Promise<void> {
    const [result] = await pool.execute<any>(
      'UPDATE clientes SET activo = 0 WHERE id = ?',
      [id]
    )
    const affected = (result as { affectedRows: number }).affectedRows ?? 0
    if (affected === 0) throw new Error('Cliente no encontrado')
  },

  async search(query: string): Promise<Cliente[]> {
    const safe = escapeLike(query)
    const [rows] = await pool.execute<any[]>(
      `SELECT * FROM clientes
       WHERE activo = 1 AND (nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?)
       ORDER BY apellido ASC LIMIT 10`,
      [`%${safe}%`, `%${safe}%`, `%${safe}%`]
    )
    return rows.map(normalizeCliente) as Cliente[]
  },

  async getHistorial(
    clienteId: number,
    params?: { page?: number; pageSize?: number },
  ): Promise<PaginatedResult<Venta>> {
    const { page, pageSize, offset } = parsePagination(params as Record<string, unknown>)

    const [countRows] = await pool.execute<any[]>(
      'SELECT COUNT(*) AS total FROM ventas WHERE cliente_id = ?',
      [clienteId],
    )
    const total = (countRows[0] as { total: number }).total

    const [rows] = await pool.execute<any[]>(
      `SELECT v.*, ev.nombre AS estado, mp.nombre AS metodo_pago,
              u.nombre AS vendedor_nombre, u.apellido AS vendedor_apellido
       FROM ventas v
       JOIN estados_venta  ev ON ev.id = v.estado_id
       JOIN metodos_pago   mp ON mp.id = v.metodo_pago_id
       JOIN usuarios        u ON u.id  = v.vendedor_id
        WHERE v.cliente_id = ?
       ORDER BY v.created_at DESC
       LIMIT ? OFFSET ?`,
      [clienteId, pageSize, offset],
    )

    const data = rows.map((r: any) => ({
      ...r,
      subtotal:   Number(r.subtotal),
      descuento:  Number(r.descuento),
      total_final: Number(r.total_final),
      vendedor: { id: r.vendedor_id, nombre: r.vendedor_nombre, apellido: r.vendedor_apellido },
    })) as Venta[]

    return buildPaginated(data, total, page, pageSize)
  },

  async getHistorialStats(clienteId: number): Promise<{
    compras_completadas: number
    total_comprado: number
    ticket_promedio: number
  }> {
    const [rows] = await pool.execute<any[]>(
      `SELECT
         COUNT(*) AS compras_completadas,
         COALESCE(SUM(total_final), 0) AS total_comprado,
         COALESCE(AVG(total_final), 0) AS ticket_promedio
       FROM ventas
       WHERE cliente_id = ? AND estado_id = 1`,
      [clienteId],
    )

    const row = rows[0] as {
      compras_completadas: number
      total_comprado: number | string
      ticket_promedio: number | string
    }

    return {
      compras_completadas: Number(row.compras_completadas ?? 0),
      total_comprado: Number(row.total_comprado ?? 0),
      ticket_promedio: Number(row.ticket_promedio ?? 0),
    }
  },
}

function normalizeCliente(row: any): Partial<Cliente> {
  return { ...row, activo: Boolean(row.activo) }
}
