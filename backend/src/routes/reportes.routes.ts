import { Router } from 'express'
import { reportesController } from '../controllers/reportes.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { adminOStock } from '../middleware/roles.middleware'
import { ah } from '../utils/asyncHandler'

const router = Router()

// Dashboard visible para todos los roles autenticados
router.get('/dashboard', authMiddleware, ah(reportesController.dashboard))

// El resto solo admin/encargado
router.use(authMiddleware, adminOStock)
router.get('/resumen',       ah(reportesController.resumen))
router.get('/ventas',        ah(reportesController.resumenVentas))
router.get('/productos-top', ah(reportesController.productosTop))
router.get('/stock',         ah(reportesController.stockActual))
router.get('/clientes-top',  ah(reportesController.clientesTop))
router.get('/excel',         ah(reportesController.excelPeriodo))

export default router
