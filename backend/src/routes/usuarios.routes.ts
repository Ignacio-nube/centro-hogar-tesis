import { Router } from 'express'
import { usuariosController } from '../controllers/usuarios.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { soloAdmin } from '../middleware/roles.middleware'
import { ah } from '../utils/asyncHandler'

const router = Router()

// Todas las rutas requieren token
router.use(authMiddleware)

// GET  /api/usuarios          → admin
// POST /api/usuarios          → admin
router.get ('/',    soloAdmin, ah(usuariosController.list))
router.post('/',    soloAdmin, ah(usuariosController.create))

// GET  /api/usuarios/:id      → admin
// PUT  /api/usuarios/:id      → admin
router.get ('/:id', soloAdmin, ah(usuariosController.getById))
router.put ('/:id', soloAdmin, ah(usuariosController.update))

// PUT  /api/usuarios/:id/password → admin
router.put ('/:id/password', soloAdmin, ah(usuariosController.changePassword))

// PATCH /api/usuarios/:id/activo  → admin
router.patch('/:id/activo', soloAdmin, ah(usuariosController.toggleActivo))

export default router
