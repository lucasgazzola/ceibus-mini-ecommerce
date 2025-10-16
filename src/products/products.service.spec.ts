import { ProductsService } from './products.service'
import { ProductRepository } from './repository/product.repository'

class MockProductRepo extends ProductRepository {
  create: jest.Mock
  getAll: jest.Mock
  getById: jest.Mock
  updateById: jest.Mock
  deleteById: jest.Mock
}

describe('ProductsService', () => {
  let service: ProductsService
  const mockProductRepo: MockProductRepo = {
    create: jest.fn().mockResolvedValue({ id: '1', name: 'A' }),
    getAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue({ id: '1', name: 'A' }),
    updateById: jest.fn().mockResolvedValue({ id: '1' }),
    deleteById: jest.fn().mockResolvedValue({ id: '1' }),
  }

  beforeEach(() => {
    service = new ProductsService(mockProductRepo as any)
  })

  it('Debería crear un producto', async () => {
    const res = await service.create({ name: 'A', priceCents: 100, stock: 10 })
    expect(res).toBeDefined()
    expect(mockProductRepo.create).toHaveBeenCalled()
  })
  it('Debería obtener todos los productos', async () => {
    const res = await service.getAll()
    expect(res).toBeDefined()
    expect(Array.isArray(res)).toBe(true)
    expect(mockProductRepo.getAll).toHaveBeenCalled()
  })
  it('Debería obtener un producto por id', async () => {
    const res = await service.getById('1')
    expect(res).toBeDefined()
    expect(res.id).toBe('1')
    expect(mockProductRepo.getById).toHaveBeenCalled()
  })
  it('Debería lanzar un error si no encuentra un producto por id', async () => {
    mockProductRepo.getById.mockResolvedValueOnce(null)
    await expect(service.getById('999')).rejects.toThrow('Product not found')
    expect(mockProductRepo.getById).toHaveBeenCalled()
  })
  it('Debería actualizar un producto por id', async () => {
    const res = await service.updateById('1', { name: 'B' })
    expect(res).toBeDefined()
    expect(res.id).toBe('1')
    expect(mockProductRepo.updateById).toHaveBeenCalled()
  })
  it('Debería lanzar un error si no encuentra un producto para actualizar', async () => {
    mockProductRepo.updateById.mockResolvedValueOnce(null)
    await expect(service.updateById('999', { name: 'B' })).rejects.toThrow(
      'Product not found'
    )
    expect(mockProductRepo.updateById).toHaveBeenCalled()
  })
  it('Debería eliminar un producto por id', async () => {
    const res = await service.deleteById('1')
    expect(res).toBeUndefined()
    expect(mockProductRepo.deleteById).toHaveBeenCalled()
  })
  it('Debería lanzar un error si no encuentra un producto para eliminar', async () => {
    mockProductRepo.getById.mockResolvedValueOnce(null)
    await expect(service.deleteById('999')).rejects.toThrow('Product not found')
    expect(mockProductRepo.getById).toHaveBeenCalled()
  })
  it('Debería lanzar un error si el producto ya está inactivo al eliminar', async () => {
    mockProductRepo.getById.mockResolvedValueOnce({ id: '1', isActive: false })
    await expect(service.deleteById('1')).rejects.toThrow(
      'Product already inactive'
    )
    expect(mockProductRepo.getById).toHaveBeenCalled()
  })
})
