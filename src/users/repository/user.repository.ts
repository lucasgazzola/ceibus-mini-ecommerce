import { User } from '@prisma/client'

export abstract class UserRepository {
  abstract getById(id: string): Promise<User | null>
  abstract getByEmail(email: string): Promise<User | null>
  abstract create(data: { email: string; passwordHash: string }): Promise<User>
  abstract getProfile(
    email: string
  ): Promise<Omit<User, 'passwordHash' | 'createdAt'> | null>
}
