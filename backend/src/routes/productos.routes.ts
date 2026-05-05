import { Router } from 'express'
import { productosController } from '../controllers/productos.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { adminOStock } from '../middleware/roles.middleware'

const router = Router()

router.use(authMiddleware)

// Lectura: todos los roles
router.get('/',            productosController.list)
router.get('/bajo-stock',  productosController.bajoStock)
router.get('/top-vendidos', productosController.topVendidos)
router.get('/:id',         productosController.getById)

// Escritura: admin o encargado_stock
router.post('/',            adminOStock, productosController.create)
router.put ('/:id',         adminOStock, productosController.update)
router.patch('/:id/stock',  adminOStock, productosController.updateStock)

export default router
