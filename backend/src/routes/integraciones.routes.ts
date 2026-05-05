import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { soloAdmin } from '../middleware/roles.middleware'
import { integracionesController } from '../controllers/integraciones.controller'

const router = Router()

router.use(authMiddleware, soloAdmin)

router.get('/google-sheets', integracionesController.getGoogleSheets)
router.put('/google-sheets', integracionesController.setGoogleSheets)
router.post('/google-sheets/sync', integracionesController.syncGoogleSheets)
router.get('/google-sheets/ping', integracionesController.pingGoogleSheets)

export default router
