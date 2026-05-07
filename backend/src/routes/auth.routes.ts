import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authController } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { ah } from '../utils/asyncHandler'

const router = Router()

// Rate limit específico para login: protege contra fuerza bruta sin afectar al uso normal.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { success: false, message: 'Demasiados intentos de login. Espere 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /api/auth/login  → público (con rate limit)
router.post('/login', loginLimiter, ah(authController.login))

// GET  /api/auth/me  → requiere token
router.get('/me', authMiddleware, ah(authController.me))

// PUT  /api/auth/change-password → requiere token
router.put('/change-password', authMiddleware, ah(authController.changePassword))

export default router
