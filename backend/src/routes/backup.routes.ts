import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { soloAdmin } from '../middleware/roles.middleware'
import { backupController } from '../controllers/backup.controller'
import { ah } from '../utils/asyncHandler'

const router = Router()

router.use(authMiddleware, soloAdmin)

router.get('/csv', ah(backupController.csv))
router.get('/excel', ah(backupController.excel))

export default router
