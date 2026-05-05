import app from './app'
import { env } from './config/env'
import { testConnection } from './config/database'
import { seedAdminIfNeeded } from './services/auth.service'

async function main() {
  try {
    await testConnection()
    await seedAdminIfNeeded()

    app.listen(env.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`)
      console.log(`📊 Entorno: ${env.nodeEnv}`)
    })
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err)
    process.exit(1)
  }
}

main()
