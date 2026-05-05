import { Router } from 'express'
import authRoutes       from './auth.routes'
import usuariosRoutes   from './usuarios.routes'
import categoriasRoutes from './categorias.routes'
import productosRoutes  from './productos.routes'
import clientesRoutes   from './clientes.routes'
import ventasRoutes     from './ventas.routes'
import reportesRoutes   from './reportes.routes'
import backupRoutes     from './backup.routes'

export const router = Router()

router.use('/auth',            authRoutes)
router.use('/usuarios',        usuariosRoutes)
router.use('/categorias',      categoriasRoutes)
router.use('/productos',       productosRoutes)
router.use('/clientes',        clientesRoutes)
router.use('/ventas',          ventasRoutes)
router.use('/reportes/backup', backupRoutes)
router.use('/reportes',        reportesRoutes)
