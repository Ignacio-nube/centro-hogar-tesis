import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// POST /api/auth/login  → público
router.post('/login', authController.login)

// GET  /api/auth/me  → requiere token
router.get('/me', authMiddleware, authController.me)

// PUT  /api/auth/change-password → requiere token
router.put('/change-password', authMiddleware, authController.changePassword)

export default router
