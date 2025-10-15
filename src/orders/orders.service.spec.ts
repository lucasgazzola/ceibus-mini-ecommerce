import { OrdersService } from './orders.service'
import { BadRequestException } from '@nestjs/common'
import { CreateOrderDto } from './dto/create-order.dto'

type Product = { id: string; stock: number; priceCents: number }

type MockRepo = {
  product: { findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock }
  order: {
    create: jest.Mock
    findMany: jest.Mock
    findUnique: jest.Mock
    update: jest.Mock
  }
  orderItem: { create: jest.Mock }
  $transaction: jest.Mock
}

describe('OrdersService', () => {
  let service: OrdersService
  let mockRepo: MockRepo

  beforeEach(() => {
    mockRepo = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderItem: { create: jest.fn() },
      $transaction: jest.fn(),
    }
    // Crear un wrapper que actúe como OrderRepository delegando en el mockRepo
    const orderRepo = {
      create: async (userId: string, dto: CreateOrderDto) => {
        // La implementación del test usa mockRepo.product.findMany, mockRepo.$transaction, etc.
        const productIds = dto.items.map(i => i.product_id)
        const products: Product[] = await mockRepo.product.findMany({
          where: { id: { in: productIds } },
        })
        const prodMap = new Map<string, Product>(products.map(p => [p.id, p]))

        for (const item of dto.items) {
          const product = prodMap.get(item.product_id)
          if (!product) throw new Error(`Product ${item.product_id} not found`)
          if (product.stock < item.quantity)
            throw new BadRequestException(
              `Insufficient stock for product ${product.id}`
            )
        }

        const result = await mockRepo.$transaction(async (transaction: any) => {
          const total = dto.items.reduce((acc, item) => {
            const product = prodMap.get(item.product_id)
            return acc + item.quantity * product.priceCents
          }, 0)

          const order = await mockRepo.order.create({
            data: { userId, totalCents: total },
          })

          for (const item of dto.items) {
            const product: Product | undefined = prodMap.get(item.product_id)
            await mockRepo.orderItem.create({
              data: {
                orderId: order.id,
                productId: product.id,
                quantity: item.quantity,
                unitPriceCents: product.priceCents,
              },
            })
            await mockRepo.product.update({
              where: { id: product.id },
              data: { stock: product.stock - item.quantity },
            })
          }

          return order
        })

        return result
      },
      findAll: (userId: string, isAdmin: boolean, status?: any) =>
        mockRepo.order.findMany(),
      findOne: (id: string) => mockRepo.order.findUnique({ where: { id } }),
      changeStatus: (id: string, newStatus: any) =>
        mockRepo.order.update({ where: { id }, data: { status: newStatus } }),
    }

    service = new OrdersService(orderRepo as any)
  })

  it('creates order when stock is sufficient', async () => {
    const products: Product[] = [{ id: 'p1', stock: 5, priceCents: 100 }]
    mockRepo.product.findMany.mockResolvedValue(products)
    mockRepo.order.create.mockResolvedValue({ id: 'order1' })
    mockRepo.$transaction.mockImplementation(async fn => fn(mockRepo))
    const dto: CreateOrderDto = {
      items: [{ product_id: 'p1', quantity: 2 }],
    }
    const res = await service.create('u1', dto)
    expect(mockRepo.$transaction).toHaveBeenCalled()
    expect(mockRepo.order.create).toHaveBeenCalledWith({
      data: { userId: 'u1', totalCents: 200 },
    })
    expect(res).toEqual({ id: 'order1' })
  })

  it('throws when stock insufficient', async () => {
    const products: Product[] = [{ id: 'p1', stock: 1, priceCents: 100 }]
    mockRepo.product.findMany.mockResolvedValue(products)
    const dto: CreateOrderDto = {
      items: [{ product_id: 'p1', quantity: 2 }],
    }
    await expect(service.create('u1', dto)).rejects.toThrow(BadRequestException)
  })
})
