import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { PrismaService } from '../prisma/prisma.service'
import { UserRepository } from './repository/user.repository'
import { PrismaUserRepository } from './repository/prisma-user.repository'
import { TokenService } from '../auth/token.service'
import { ConfigModule } from '../config/config.module'

@Module({
  imports: [ConfigModule],
  providers: [
    UsersService,
    PrismaService,
    TokenService,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
  controllers: [UsersController],
  exports: [UsersService, PrismaService],
})
export class UsersModule {}
