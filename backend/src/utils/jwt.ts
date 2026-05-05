import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { JwtPayload } from '../models/types'

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as string,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret) as unknown as JwtPayload
}
