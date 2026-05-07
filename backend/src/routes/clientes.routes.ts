import { Router } from 'express'
import { clientesController } from '../controllers/clientes.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { ah } from '../utils/asyncHandler'

const router = Router()

router.use(authMiddleware)

router.get('/search',     ah(clientesController.search))
router.get('/',           ah(clientesController.list))
router.get('/:id',        ah(clientesController.getById))
router.get('/:id/historial', ah(clientesController.historial))

router.post('/',          ah(clientesController.create))
router.put ('/:id',       ah(clientesController.update))

export default router
