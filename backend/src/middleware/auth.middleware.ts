import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { unauthorized } from '../utils/response'
import type { JwtPayload } from '../models/types'

// Extendemos el tipo Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    unauthorized(res)
    return
  }

  const token = authHeader.slice(7)

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    unauthorized(res, 'Token inválido o expirado')
  }
}
