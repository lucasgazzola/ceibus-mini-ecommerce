import { Injectable, NotFoundException } from '@nestjs/common'
import { OrderRepository } from './repository/order.repository'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderStatus } from '../utils/enums'

@Injectable()
export class OrdersService {
  constructor(private orderRepo: OrderRepository) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.orderRepo.create(userId, dto)
  }

  async getAll(userId: string, isAdmin: boolean, status?: OrderStatus) {
    return this.orderRepo.getAll(userId, isAdmin, status)
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
