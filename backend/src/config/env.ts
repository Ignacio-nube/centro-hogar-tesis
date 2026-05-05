import dotenv from 'dotenv'
dotenv.config()

const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Variable de entorno requerida: ${key}`)
  return value
}

export const env = {
  port:    parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  db: {
    host:     process.env['DB_HOST']     ?? 'localhost',
    port:     parseInt(process.env['DB_PORT'] ?? '3306', 10),
    user:     process.env['DB_USER']     ?? 'root',
    password: process.env['DB_PASSWORD'] ?? '',
    name:     process.env['DB_NAME']     ?? 'centro_hogar',
  },

  jwt: {
    secret:    required('JWT_SECRET'),
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '8h',
  },

  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',

  adminSeed: {
    email:    required('ADMIN_EMAIL'),
    password: required('ADMIN_PASSWORD'),
    nombre:   process.env['ADMIN_NOMBRE']   ?? 'Admin',
    apellido: process.env['ADMIN_APELLIDO'] ?? 'Sistema',
  },
} as const
