import { User } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { UserRepository } from './user.repository'

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  getById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  getByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  create(data: { email: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data })
  }

  // Retorna el perfil del usuario sin el hash de la contraseña ni la fecha de creación
  async getProfile(
    email: string
  ): Promise<Omit<User, 'passwordHash' | 'createdAt'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })
    return user
  }
}
