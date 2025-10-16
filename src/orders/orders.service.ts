import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderRepository } from './repository/order.repository'
import { OrderStatus, UserRole } from '../utils/enums'

@Injectable()
export class OrdersService {
  constructor(private orderRepo: OrderRepository) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.orderRepo.create(userId, dto)
  }

  async getAll(userId: string, userRole: UserRole, status?: OrderStatus) {
    return this.orderRepo.getAll(userId, userRole, status)
  }

  async getById(id: string) {
    const order = await this.orderRepo.getById(id)
    if (!order) throw new NotFoundException('Order not found')
    return order
  }

  async changeStatus(id: string, newStatus: OrderStatus) {
    return this.orderRepo.changeStatus(id, newStatus)
  }
}
