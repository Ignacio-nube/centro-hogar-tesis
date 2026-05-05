import { Router } from 'express'
import { categoriasController } from '../controllers/categorias.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { adminOStock } from '../middleware/roles.middleware'

const router = Router()

router.use(authMiddleware)

router.get ('/', categoriasController.list)
router.post('/', adminOStock, categoriasController.create)
router.put ('/:id', adminOStock, categoriasController.update)
router.delete('/:id', adminOStock, categoriasController.delete)

export default router
