import { Order } from '@prisma/client'
import { CreateOrderDto } from '../dto/create-order.dto'
import { OrderStatus } from '../../utils/enums'

export abstract class OrderRepository {
  abstract create(userId: string, dto: CreateOrderDto): Promise<Order>
  abstract getAll(
    userId: string,
    isAdmin: boolean,
    status?: OrderStatus
  ): Promise<Order[]>
  abstract getById(id: string): Promise<Order | null>
  abstract changeStatus(id: string, newStatus: OrderStatus): Promise<Order>
}
