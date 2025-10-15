import { Injectable } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'

@Injectable()
export class TokenService {
  sign(payload: object, secret: string, options?: jwt.SignOptions) {
    return jwt.sign(payload, secret as jwt.Secret, options)
  }

  verify<T = any>(token: string, secret: string): T {
    return jwt.verify(token, secret as jwt.Secret) as T
  }
}
