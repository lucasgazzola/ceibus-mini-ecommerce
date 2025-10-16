import * as Joi from 'joi'
import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config'
import { TokenService } from '../auth/token.service'

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        BCRYPT_SALT_ROUNDS: Joi.number().integer().min(1).optional(),
      }),
    }),
  ],
  providers: [
    TokenService,
    {
      provide: 'JWT_SECRET',
      useFactory: (config: ConfigService) => config.get<string>('JWT_SECRET'),
      inject: [ConfigService],
    },
    {
      provide: 'SALT_ROUNDS',
      useFactory: (config: ConfigService) =>
        config.get<number>('BCRYPT_SALT_ROUNDS') || 10,
      inject: [ConfigService],
    },
  ],
  exports: ['JWT_SECRET', 'SALT_ROUNDS', TokenService],
})
export class ConfigModule {}
