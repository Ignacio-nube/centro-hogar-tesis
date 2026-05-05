import { Router } from 'express'
import { reportesController } from '../controllers/reportes.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { adminOStock } from '../middleware/roles.middleware'

const router = Router()

router.use(authMiddleware, adminOStock)

router.get('/resumen',       reportesController.resumen)
router.get('/ventas',        reportesController.resumenVentas)
router.get('/productos-top', reportesController.productosTop)
router.get('/stock',         reportesController.stockActual)
router.get('/clientes-top',  reportesController.clientesTop)

export default router
