import { Module } from '@nestjs/common'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { PrismaProductRepository } from './repository/prisma-product.repository'
import { ProductRepository } from './repository/product.repository'
import { PrismaModule } from '../prisma/prisma.module'
import { TokenService } from '../auth/token.service'
import { ConfigModule } from '../config/config.module'

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    TokenService,
    {
      provide: ProductRepository,
      useClass: PrismaProductRepository,
    },
  ],
})
export class ProductsModule {}
