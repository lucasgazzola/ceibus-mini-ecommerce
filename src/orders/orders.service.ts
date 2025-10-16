import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderRepository } from './repository/order.repository'
import { OrderStatus, UserRole } from '../utils/enums'
import { Order, OrderItem } from '@prisma/client'

@Injectable()
export class OrdersService {
  constructor(private orderRepo: OrderRepository) {}

  async create(userId: string, dto: CreateOrderDto) {
    const orderItems = dto.items
    if (!orderItems || orderItems.length === 0)
      throw new BadRequestException('Order must have at least one item')
    return this.orderRepo.create(userId, dto)
  }

  async getAll(userId: string, userRole: UserRole, status?: OrderStatus) {
    return this.orderRepo.getAll(userId, userRole, status)
  }

  async getById(id: string): Promise<(Order & { items?: OrderItem[] }) | null> {
    const order = await this.orderRepo.getById(id)
    if (!order) throw new NotFoundException('Order not found')
    return order
  }

  async changeStatus(id: string, newStatus: OrderStatus) {
    const order = await this.getById(id)
    if (!order) throw new NotFoundException('Order not found')
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('Only PENDING orders can change status')
    return this.orderRepo.changeStatus(id, order, newStatus)
  }
}
