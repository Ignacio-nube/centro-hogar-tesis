import type { Response } from 'express'

export function ok<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data })
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 201)
}

export function noContent(res: Response): void {
  res.status(204).send()
}

export function badRequest(res: Response, message: string): void {
  res.status(400).json({ success: false, message })
}

export function unauthorized(res: Response, message = 'No autorizado'): void {
  res.status(401).json({ success: false, message })
}

export function forbidden(res: Response, message = 'Acceso denegado'): void {
  res.status(403).json({ success: false, message })
}

export function notFound(res: Response, message = 'Recurso no encontrado'): void {
  res.status(404).json({ success: false, message })
}

export function conflict(res: Response, message: string): void {
  res.status(409).json({ success: false, message })
}

export function serverError(res: Response, message = 'Error interno del servidor'): void {
  res.status(500).json({ success: false, message })
}
