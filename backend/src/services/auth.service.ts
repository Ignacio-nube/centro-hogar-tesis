import { pool } from '../config/database'
import { comparePassword, hashPassword } from '../utils/password'
import { signToken } from '../utils/jwt'
import { env } from '../config/env'
import type { Usuario, UsuarioConHash, Rol } from '../models/types'

// Mapa estático rol_id → nombre (evita un JOIN extra en cada request)
const ROL_NOMBRES: Record<number, Rol> = { 1: 'admin', 2: 'encargado_stock', 3: 'vendedor' }
const ROL_IDS:     Record<string, number>  = { admin: 1, encargado_stock: 2, vendedor: 3 }

export const authService = {

  async login(email: string, password: string): Promise<{ token: string; usuario: Usuario }> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, nombre, apellido, email, password_hash, rol_id, activo FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    )
    const user: UsuarioConHash | undefined = rows[0]

    if (!user || !user.activo) {
      throw new Error('Credenciales inválidas')
    }

    const valid = await comparePassword(password, user.password_hash)
    if (!valid) throw new Error('Credenciales inválidas')

    const rol = ROL_NOMBRES[user.rol_id] ?? 'vendedor'
    const token = signToken({ sub: user.id, email: user.email, rol })

    const { password_hash: _, ...usuarioPublico } = user
    return { token, usuario: { ...usuarioPublico, rol } }
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

  async changeOwnPassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const [rows] = await pool.execute<any[]>(
      'SELECT password_hash FROM usuarios WHERE id = ?',
      [userId]
    )
    const user = rows[0] as { password_hash: string } | undefined
    if (!user) throw new Error('Usuario no encontrado')

    const valid = await comparePassword(currentPassword, user.password_hash)
    if (!valid) throw new Error('Contraseña actual incorrecta')

    const newHash = await hashPassword(newPassword)
    await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newHash, userId])
  },

  getRolId: (rolName: string): number => ROL_IDS[rolName] ?? 3,
}

/**
 * Crea el primer usuario admin si no existe ninguno en la base de datos.
 * Se ejecuta una sola vez al iniciar el servidor.
 */
export async function seedAdminIfNeeded(): Promise<void> {
  const [rows] = await pool.execute<any[]>(
    'SELECT COUNT(*) AS total FROM usuarios WHERE rol_id = 1'
  )
  const total: number = rows[0]?.total ?? 0

  if (total > 0) return // ya existe al menos un admin

  const { email, password, nombre, apellido } = env.adminSeed
  const passwordHash = await hashPassword(password)

  await pool.execute(
    'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id) VALUES (?, ?, ?, ?, 1)',
    [nombre, apellido, email, passwordHash]
  )

  if (env.nodeEnv !== 'production') {
    console.log(`[seed] Admin inicial creado: ${email}`)
  } else {
    console.log('[seed] Admin inicial creado')
  }
}
