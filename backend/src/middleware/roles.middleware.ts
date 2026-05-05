import type { Request, Response, NextFunction } from 'express'
import { forbidden } from '../utils/response'
import type { Rol } from '../models/types'

/**
 * Devuelve un middleware que verifica que el usuario autenticado
 * tenga uno de los roles permitidos.
 */
export function requireRol(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.rol)) {
      forbidden(res, `Se requiere uno de los siguientes roles: ${roles.join(', ')}`)
      return
    }
    next()
  }
}

/** Shorthand: sólo admin */
export const soloAdmin = requireRol('admin')

/** Shorthand: admin o encargado_stock */
export const adminOStock = requireRol('admin', 'encargado_stock')
