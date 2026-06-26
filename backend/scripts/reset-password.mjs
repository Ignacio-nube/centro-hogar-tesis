/**
 * Script de recuperación de contraseña ("break glass").
 *
 * Permite restablecer la contraseña de CUALQUIER usuario directamente contra la
 * base de datos, por fuera del login. Está pensado para el caso en que el admin
 * olvida su propia contraseña y no hay otro admin que pueda resetearla desde la
 * pantalla de Usuarios.
 *
 * Solo puede ejecutarlo quien tenga acceso al servidor y al archivo .env del
 * backend (lee de ahí la conexión a MySQL).
 *
 * Uso (parado en la carpeta backend/):
 *   node scripts/reset-password.mjs <email> <nueva_contraseña>
 *
 * Ejemplo:
 *   node scripts/reset-password.mjs admin@centrohogar.com NuevaClave123
 *
 * No agrega dependencias: usa mysql2, bcryptjs y dotenv que ya están instalados.
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

// Carga el .env del backend (un nivel arriba de /scripts), sin importar el cwd.
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '..', '.env') })

// Mismo factor de coste que utils/password.ts del backend.
const SALT_ROUNDS = 12

async function main() {
  const [email, newPassword] = process.argv.slice(2)

  if (!email || !newPassword) {
    console.error('\n❌ Faltan argumentos.')
    console.error('   Uso: node scripts/reset-password.mjs <email> <nueva_contraseña>\n')
    process.exit(1)
  }

  if (newPassword.length < 8) {
    console.error('\n❌ La nueva contraseña debe tener al menos 8 caracteres.\n')
    process.exit(1)
  }

  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     parseInt(process.env.DB_PORT ?? '3306', 10),
    user:     process.env.DB_USER     ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME     ?? 'centro_hogar',
    charset:  'utf8mb4',
    timezone: '-03:00',
  })

  try {
    const [rows] = await connection.execute(
      'SELECT id, nombre, apellido, activo FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    )
    const usuario = rows[0]

    if (!usuario) {
      console.error(`\n❌ No existe ningún usuario con el email "${email}".\n`)
      process.exit(1)
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await connection.execute(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [passwordHash, usuario.id]
    )

    console.log(`\n✅ Contraseña restablecida para ${usuario.nombre} ${usuario.apellido} (${email}).`)
    if (!usuario.activo) {
      console.log('   ⚠️  Atención: este usuario está INACTIVO y no podrá iniciar sesión hasta reactivarlo.')
    }
    console.log('   Ya puede iniciar sesión con la nueva contraseña.\n')
  } finally {
    await connection.end()
  }
}

main().catch((err) => {
  console.error('\n❌ Error al restablecer la contraseña:', err.message, '\n')
  process.exit(1)
})
