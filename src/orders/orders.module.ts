import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { PrismaService } from '../prisma/prisma.service'
import { ConfigModule } from '../config/config.module'
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
