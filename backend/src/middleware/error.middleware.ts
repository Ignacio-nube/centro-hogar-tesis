import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isDev = env.nodeEnv === 'development'

  // Errores de MySQL (mysql2 usa .code en lugar de .name)
  const mysqlErr = err as Error & { code?: string; errno?: number }

  if (mysqlErr.code === 'ER_DUP_ENTRY') {
    res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos' })
    return
  }

  if (mysqlErr.code === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json({ success: false, message: 'Referencia a un recurso que no existe' })
    return
  }

  if (mysqlErr.code === 'ER_ROW_IS_REFERENCED_2') {
    res.status(409).json({ success: false, message: 'No se puede eliminar: el registro está siendo usado' })
    return
  }

  console.error('❌ Error no manejado:', err)

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(isDev && { error: err.message, stack: err.stack }),
  })
}
