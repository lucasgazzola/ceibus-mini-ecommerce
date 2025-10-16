import { Order } from '@prisma/client'
import { CreateOrderDto } from '../dto/create-order.dto'
import { OrderStatus, UserRole } from '../../utils/enums'

export abstract class OrderRepository {
  abstract create(userId: string, dto: CreateOrderDto): Promise<Order>
  abstract getAll(
    userId: string,
    userRole: UserRole,
    status?: OrderStatus
  ): Promise<Order[]>
  abstract getById(id: string): Promise<Order | null>
  abstract changeStatus(id: string, newStatus: OrderStatus): Promise<Order>
}
