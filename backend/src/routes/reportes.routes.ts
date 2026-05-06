import { Router } from 'express'
import { reportesController } from '../controllers/reportes.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { adminOStock } from '../middleware/roles.middleware'

const router = Router()

// Dashboard visible para todos los roles autenticados
router.get('/dashboard', authMiddleware, reportesController.dashboard)

// El resto solo admin/encargado
router.use(authMiddleware, adminOStock)
router.get('/resumen',       reportesController.resumen)
router.get('/ventas',        reportesController.resumenVentas)
router.get('/productos-top', reportesController.productosTop)
router.get('/stock',         reportesController.stockActual)
router.get('/clientes-top',  reportesController.clientesTop)

export default router
