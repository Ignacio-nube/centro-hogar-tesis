import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { soloAdmin } from '../middleware/roles.middleware'
import { adminController } from '../controllers/admin.controller'
import { ah } from '../utils/asyncHandler'

const router = Router()

router.use(authMiddleware, soloAdmin)

router.get ('/purge-old-sales/preview', ah(adminController.previewPurgeOldSales))
router.post('/purge-old-sales',         ah(adminController.purgeOldSales))

export default router
