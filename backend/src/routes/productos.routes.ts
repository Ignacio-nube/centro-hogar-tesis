import { Router } from 'express'
import { productosController } from '../controllers/productos.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { adminOStock } from '../middleware/roles.middleware'
import { ah } from '../utils/asyncHandler'

const router = Router()

router.use(authMiddleware)

// Lectura: todos los roles
router.get('/',            ah(productosController.list))
router.get('/bajo-stock',  ah(productosController.bajoStock))
router.get('/top-vendidos', ah(productosController.topVendidos))
router.get('/:id',         ah(productosController.getById))

// Escritura: admin o encargado_stock
router.post('/',            adminOStock, ah(productosController.create))
router.put ('/:id',         adminOStock, ah(productosController.update))
router.patch('/:id/stock',  adminOStock, ah(productosController.updateStock))

export default router
