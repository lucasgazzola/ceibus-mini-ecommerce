import * as jwt from 'jsonwebtoken'
import { User } from '@prisma/client'

export function signTokenRaw(user: Partial<User>): string {
  const secret = (process.env.JWT_SECRET || 'default-secret') as jwt.Secret
  const payload = { sub: user.id, email: user.email, role: user.role }
  const options = { expiresIn: process.env.JWT_EXPIRES_IN || '30m' } as
    | jwt.SignOptions
    | undefined
  return jwt.sign(payload as any, secret as any, options as any)
}

export function signTokenBearer(user: Partial<User>): string {
  return `Bearer ${signTokenRaw(user)}`
}
