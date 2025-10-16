import { OrdersService } from './orders.service'
import { OrderRepository } from './repository/order.repository'
import { OrderStatus, UserRole } from '../utils/enums'

class MockOrderRepo extends OrderRepository {
  create: jest.Mock
  getAll: jest.Mock
  getById: jest.Mock
  changeStatus: jest.Mock
}

describe('OrdersService', () => {
  let service: OrdersService
  const sampleOrder = {
    id: 'o1',
    userId: 'u1',
    status: OrderStatus.PENDING,
    totalCents: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockOrderRepo: MockOrderRepo = {
    create: jest.fn().mockResolvedValue(sampleOrder),
    getAll: jest.fn().mockResolvedValue([sampleOrder]),
    getById: jest.fn().mockResolvedValue(sampleOrder),
    changeStatus: jest
      .fn()
      .mockResolvedValue({ ...sampleOrder, status: OrderStatus.PAID }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new OrdersService(mockOrderRepo as any)
  })

  it('Debería crear un pedido', async () => {
    const dto = { items: [{ product_id: 'p1', quantity: 1 }] }
    const res = await service.create('u1', dto as any)
    expect(res).toBeDefined()
    expect(mockOrderRepo.create).toHaveBeenCalled()
  })

  it('Debería obtener todos los pedidos', async () => {
    const res = await service.getAll('u1', UserRole.USER)
    expect(res).toBeDefined()
    expect(Array.isArray(res)).toBe(true)
    expect(mockOrderRepo.getAll).toHaveBeenCalled()
  })

  it('Debería obtener un pedido por id', async () => {
    const res = await service.getById('o1')
    expect(res).toBeDefined()
    expect(res.id).toBe('o1')
    expect(mockOrderRepo.getById).toHaveBeenCalled()
  })

  it('Debería lanzar un error si no encuentra un pedido por id', async () => {
    mockOrderRepo.getById.mockResolvedValueOnce(null)
    await expect(service.getById('nope')).rejects.toThrow('Order not found')
    expect(mockOrderRepo.getById).toHaveBeenCalled()
  })

  it('Debería cambiar el estado de un pedido', async () => {
    const res = await service.changeStatus('o1', OrderStatus.PAID)
    expect(res).toBeDefined()
    expect(mockOrderRepo.changeStatus).toHaveBeenCalled()
    expect(res.status).toBe(OrderStatus.PAID)
  })
  it('Debería lanzar un error si no encuentra un pedido para cambiar estado', async () => {
    mockOrderRepo.getById.mockResolvedValueOnce(null)
    await expect(
      service.changeStatus('nope', OrderStatus.PAID)
    ).rejects.toThrow('Order not found')
    expect(mockOrderRepo.getById).toHaveBeenCalled()
    expect(mockOrderRepo.changeStatus).not.toHaveBeenCalled()
  })
  it('Debería lanzar un error si el pedido no está en estado PENDING al cambiar estado', async () => {
    mockOrderRepo.getById.mockResolvedValueOnce({
      ...sampleOrder,
      status: OrderStatus.PAID,
    })
    await expect(
      service.changeStatus('o1', OrderStatus.CANCELLED)
    ).rejects.toThrow('Only PENDING orders can change status')
    expect(mockOrderRepo.getById).toHaveBeenCalled()
    expect(mockOrderRepo.changeStatus).not.toHaveBeenCalled()
  })
})
