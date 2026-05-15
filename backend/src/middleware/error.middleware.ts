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
  const mysqlErr = err as Error & { code?: string; errno?: number; sqlMessage?: string }

  if (mysqlErr.code === 'ER_DUP_ENTRY') {
    const sqlMessage = mysqlErr.sqlMessage ?? ''
    let message = 'Ya existe un registro con esos datos'
    if (/uq_productos_codigo/i.test(sqlMessage))   message = 'Ya existe un producto con ese código'
    else if (/uq_clientes_dni/i.test(sqlMessage))   message = 'Ya existe un cliente con ese DNI'
    else if (/uq_clientes_email/i.test(sqlMessage)) message = 'Ya existe un cliente con ese email'
    else if (/uq_ventas_numero/i.test(sqlMessage)) message = 'Conflicto generando número de venta. Intente nuevamente.'
    else if (/uq_usuarios_email/i.test(sqlMessage) || /email/i.test(sqlMessage)) message = 'Ya existe un usuario con ese email'
    res.status(409).json({ success: false, message })
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
