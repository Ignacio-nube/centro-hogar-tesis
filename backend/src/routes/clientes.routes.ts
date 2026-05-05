import { Router } from 'express'
import { clientesController } from '../controllers/clientes.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.get('/search',     clientesController.search)
router.get('/',           clientesController.list)
router.get('/:id',        clientesController.getById)
router.get('/:id/historial', clientesController.historial)

router.post('/',          clientesController.create)
router.put ('/:id',       clientesController.update)

export default router
