import { Injectable } from '@nestjs/common'
import { UserRepository } from './repository/user.repository'

@Injectable()
export class UsersService {
  constructor(private userRepo: UserRepository) {}

  async getById(id: string) {
    return this.userRepo.getById(id)
  }

  async getByEmail(email: string) {
    return this.userRepo.getByEmail(email)
  }

  async getProfile(email: string) {
    return this.userRepo.getProfile(email)
  }

  async create(data: { email: string; passwordHash: string }) {
    return this.userRepo.create(data)
  }
}
