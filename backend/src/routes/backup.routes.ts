import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { soloAdmin } from '../middleware/roles.middleware'
import { backupController } from '../controllers/backup.controller'

const router = Router()

router.use(authMiddleware, soloAdmin)

router.get('/csv', backupController.csv)
router.get('/excel', backupController.excel)

export default router
