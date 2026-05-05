import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { router } from './routes'
import { errorHandler } from './middleware/error.middleware'

const app = express()

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet())

app.use(cors({
  origin:      env.frontendUrl,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting global (100 requests / 15 min por IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Demasiadas solicitudes, intente más tarde' },
  standardHeaders: true,
  legacyHeaders:   false,
}))

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Rutas API ────────────────────────────────────────────────────────────────
app.use('/api', router)

// ─── Error handler (debe ser el último middleware) ────────────────────────────
app.use(errorHandler)

export default app
