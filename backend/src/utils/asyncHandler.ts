import type { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Envuelve un handler async para que sus errores lleguen al errorHandler.
 * Express 4 no captura promise rejections automáticamente.
 */
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown

export const asyncHandler = (fn: AsyncFn): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export { asyncHandler as ah }
