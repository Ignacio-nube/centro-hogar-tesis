import { Router } from 'express'
import { categoriasController } from '../controllers/categorias.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { adminOStock } from '../middleware/roles.middleware'
import { ah } from '../utils/asyncHandler'

const router = Router()

router.use(authMiddleware)

router.get ('/', ah(categoriasController.list))
router.post('/', adminOStock, ah(categoriasController.create))
router.put ('/:id', adminOStock, ah(categoriasController.update))
router.delete('/:id', adminOStock, ah(categoriasController.delete))

export default router
