import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

@Injectable()
export class HashingService {
  async hash(value: string, rounds: number): Promise<string> {
    return bcrypt.hash(value, rounds)
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash)
  }
}
