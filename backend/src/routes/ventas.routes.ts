import { Router } from 'express'
import { ventasController } from '../controllers/ventas.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { soloAdmin } from '../middleware/roles.middleware'

const router = Router()

router.use(authMiddleware)

// Estadísticas (antes de /:id para evitar conflictos de ruta)
router.get('/stats/hoy',      ventasController.statsHoy)
router.get('/stats/por-dia',  ventasController.ventasPorDia)
router.get('/vendedores',     ventasController.vendedores)

router.get ('/',      ventasController.list)
router.get ('/:id',   ventasController.getById)
router.post('/',      ventasController.create)
router.patch('/:id/cancelar', soloAdmin, ventasController.cancelar)

export default router
