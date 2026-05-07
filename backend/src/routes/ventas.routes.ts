import { Router } from 'express'
import { ventasController } from '../controllers/ventas.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { soloAdmin } from '../middleware/roles.middleware'
import { ah } from '../utils/asyncHandler'

const router = Router()

router.use(authMiddleware)

// Estadísticas (antes de /:id para evitar conflictos de ruta)
router.get('/stats/hoy',      ah(ventasController.statsHoy))
router.get('/stats/por-dia',  ah(ventasController.ventasPorDia))
router.get('/vendedores',     ah(ventasController.vendedores))

router.get ('/',      ah(ventasController.list))
router.get ('/:id',   ah(ventasController.getById))
router.post('/',      ah(ventasController.create))
router.patch('/:id/cancelar', soloAdmin, ah(ventasController.cancelar))

export default router
