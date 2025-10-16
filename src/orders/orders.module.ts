import { Module } from '@nestjs/common'
import { ConfigModule } from '../config/config.module'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { OrderRepository } from './repository/order.repository'
import { PrismaOrderRepository } from './repository/prisma-order.repository'

@Module({
  providers: [
    OrdersService,
    PrismaService,
    { provide: OrderRepository, useClass: PrismaOrderRepository },
  ],
  controllers: [OrdersController],
  imports: [ConfigModule],
})
export class OrdersModule {}
