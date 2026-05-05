import { pool } from '../config/database'
import type { Categoria } from '../models/types'

export const categoriasService = {

  async list(soloActivas = true): Promise<Categoria[]> {
    const whereClause = soloActivas ? 'WHERE activo = 1' : ''
    const [rows] = await pool.execute<any[]>(
      `SELECT * FROM categorias ${whereClause} ORDER BY nombre ASC`
    )
    return rows as Categoria[]
  },

  async getById(id: number): Promise<Categoria | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM categorias WHERE id = ?',
      [id]
    )
    return (rows[0] as Categoria) ?? null
  },

  async create(data: { nombre: string; descripcion?: string | null }): Promise<Categoria> {
    const [result] = await pool.execute<any>(
      'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
      [data.nombre, data.descripcion ?? null]
    )
    const id = (result as { insertId: number }).insertId
    return this.getById(id) as Promise<Categoria>
  },

  async update(id: number, data: { nombre?: string; descripcion?: string | null; activo?: boolean }): Promise<Categoria> {
    const fields: string[] = []
    const values: (string | number | boolean | null)[] = []

    if (data.nombre      !== undefined) { fields.push('nombre = ?');      values.push(data.nombre) }
    if (data.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(data.descripcion) }
    if (data.activo      !== undefined) { fields.push('activo = ?');      values.push(data.activo ? 1 : 0) }

    if (fields.length === 0) throw new Error('Nada que actualizar')

    values.push(id)
    await pool.execute(`UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`, values)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Categoría no encontrada')
    return updated
  },

  async delete(id: number): Promise<void> {
    // Soft delete: desactivar en vez de borrar para preservar historial de productos
    await pool.execute('UPDATE categorias SET activo = 0 WHERE id = ?', [id])
  },
}
