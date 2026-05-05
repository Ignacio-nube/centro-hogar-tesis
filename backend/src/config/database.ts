import mysql from 'mysql2/promise'
import { env } from './env'

export const pool = mysql.createPool({
  host:               env.db.host,
  port:               env.db.port,
  user:               env.db.user,
  password:           env.db.password,
  database:           env.db.name,
  charset:            'utf8mb4',
  timezone:           '-03:00',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  // Devuelve fechas como strings (no objetos Date) para consistencia
  dateStrings:        true,
})

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection()
  await conn.ping()
  conn.release()
  console.log('✅ Conexión a MySQL establecida')
}
