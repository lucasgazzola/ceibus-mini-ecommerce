import { Injectable, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { UsersService } from '../users/users.service'

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async register(email: string, password: string) {
    const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS
      ? Number(process.env.BCRYPT_SALT_ROUNDS)
      : 10

    const existing = await this.userService.getByEmail(email)
    if (existing) throw new UnauthorizedException('Email already registered')
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await this.userService.create({ email, passwordHash: hash })
    const token = this.signPayload({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
    return { token }
  }

  async login(email: string, password: string) {
    const user = await this.userService.getByEmail(email)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const correctPassword = await bcrypt.compare(password, user.passwordHash)
    if (!correctPassword) throw new UnauthorizedException('Invalid credentials')
    const token = this.signPayload({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
    return { token }
  }

  signPayload(payload: any) {
    const JWT_SECRET = process.env.JWT_SECRET
    const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m'
    return jwt.sign(
      payload,
      JWT_SECRET as jwt.Secret,
      { expiresIn: EXPIRES_IN } as jwt.SignOptions
    )
  }
}
