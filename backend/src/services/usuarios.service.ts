import { pool } from '../config/database'
import { hashPassword } from '../utils/password'
import type { Usuario } from '../models/types'

export const usuariosService = {

  async listVendedores(): Promise<Array<{ id: number; nombre: string; apellido: string }>> {
    const [rows] = await pool.execute<any[]>(
      `SELECT u.id, u.nombre, u.apellido
       FROM usuarios u
       WHERE u.activo = 1 AND u.rol_id IN (1, 3)
       ORDER BY u.apellido ASC, u.nombre ASC`
    )
    return rows as Array<{ id: number; nombre: string; apellido: string }>
  },

  async list(): Promise<Usuario[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, r.nombre AS rol,
              u.activo, u.created_at, u.updated_at
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       ORDER BY u.created_at DESC`
    )
    return rows as Usuario[]
  },

  async getById(id: number): Promise<Usuario | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, r.nombre AS rol,
              u.activo, u.created_at, u.updated_at
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = ?`,
      [id]
    )
    return (rows[0] as Usuario) ?? null
  },

  async create(data: {
    nombre:   string
    apellido: string
    email:    string
    password: string
    rol_id:   number
  }): Promise<Usuario> {
    const hash = await hashPassword(data.password)
    const [result] = await pool.execute<any>(
      'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id) VALUES (?,?,?,?,?)',
      [data.nombre, data.apellido, data.email, hash, data.rol_id]
    )
    const id = (result as { insertId: number }).insertId
    return this.getById(id) as Promise<Usuario>
  },

  async update(id: number, data: Partial<{
    nombre:   string
    apellido: string
    email:    string
    rol_id:   number
    activo:   boolean
  }>): Promise<Usuario> {
    const fields: string[] = []
    const values: (string | number | boolean | null)[] = []

    if (data.nombre   !== undefined) { fields.push('nombre = ?');   values.push(data.nombre) }
    if (data.apellido !== undefined) { fields.push('apellido = ?'); values.push(data.apellido) }
    if (data.email    !== undefined) { fields.push('email = ?');    values.push(data.email) }
    if (data.rol_id   !== undefined) { fields.push('rol_id = ?');   values.push(data.rol_id) }
    if (data.activo   !== undefined) { fields.push('activo = ?');   values.push(data.activo ? 1 : 0) }

    if (fields.length === 0) throw new Error('Nada que actualizar')

    values.push(id)
    await pool.execute(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    const updated = await this.getById(id)
    if (!updated) throw new Error('Usuario no encontrado')
    return updated
  },

  async changePassword(id: number, newPassword: string): Promise<void> {
    const hash = await hashPassword(newPassword)
    await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, id])
  },

  async toggleActivo(id: number, activo: boolean): Promise<Usuario> {
    await pool.execute('UPDATE usuarios SET activo = ? WHERE id = ?', [activo ? 1 : 0, id])
    const u = await this.getById(id)
    if (!u) throw new Error('Usuario no encontrado')
    return u
  },
}
