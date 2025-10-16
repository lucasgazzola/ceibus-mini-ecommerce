import { Order, OrderItem } from '@prisma/client'
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { OrderStatus, UserRole } from '../../utils/enums'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateOrderDto } from '../dto/create-order.dto'
import { OrderRepository } from './order.repository'

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    // Obtenemos los productos que intervienen en el pedido
    const productIds = dto.items.map(i => i.product_id)
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    if (products.length !== productIds.length) {
      const missing = productIds.filter(id => !products.some(p => p.id === id))
      throw new NotFoundException(`Products not found: ${missing.join(', ')}`)
    }

    // Creamos un mapa para acceso rápido
    const productMap = new Map(products.map(p => [p.id, p]))

    // Validamos stock antes de abrir la transacción
    // Validamos el stock y calculamos el total en una sola pasada
    let totalCents = 0

    for (const item of dto.items) {
      const product = productMap.get(item.product_id)

      if (!product) {
        throw new BadRequestException(
          `Product not found (id: ${item.product_id})`
        )
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}" (id: ${product.id})`
        )
      }

      totalCents += item.quantity * product.priceCents
    }

    // Ejecutamos la transacción
    const order = await this.prisma.$transaction(async tx => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalCents,
          status: 'PENDING',
          items: {
            create: dto.items.map(item => {
              const product = productMap.get(item.product_id)!
              return {
                productId: product.id,
                quantity: item.quantity,
                unitPriceCents: product.priceCents,
              }
            }),
          },
        },
        include: { items: true },
      })

      // Actualizamos el stock de los productos involucrados
      for (const item of dto.items) {
        const product = productMap.get(item.product_id)!
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return createdOrder
    })

    return order
  }

  async getAll(
    userId: string,
    userRole: UserRole,
    status?: OrderStatus
  ): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        status: status ?? undefined,
        userId: userRole === UserRole.ADMIN ? undefined : userId,
      },
      include: { items: true },
    })
  }

  async getById(id: string): Promise<(Order & { items?: OrderItem[] }) | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
  }

  async changeStatus(
    id: string,
    order: Order & { items?: OrderItem[] },
    newStatus: OrderStatus
  ): Promise<Order> {
    // En caso de pagar, simplemente actualizar el estado
    if (newStatus === OrderStatus.PAID) {
      return this.prisma.order.update({
        where: { id },
        data: { status: OrderStatus.PAID },
      })
    }

    // En caso de cancelar, reponer stock
    if (newStatus === OrderStatus.CANCELLED) {
      await this.prisma.$transaction(async tx => {
        for (const item of order.items) {
          const p = await tx.product.findUnique({
            where: { id: item.productId },
          })
          await tx.product.update({
            where: { id: p.id },
            data: { stock: p.stock + item.quantity },
          })
        }
        await tx.order.update({
          where: { id },
          data: { status: OrderStatus.CANCELLED },
        })
      })
      return this.getById(id)
    }

    throw new BadRequestException('Invalid status')
  }
}
