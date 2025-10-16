import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateProductDto } from './dto/create-product.dto'
import { ProductRepository } from './repository/product.repository'

@Injectable()
export class ProductsService {
  constructor(private prodRepo: ProductRepository) {}

  async create(dto: CreateProductDto) {
    return this.prodRepo.create(dto)
  }

  async getAll(q?: string, isActive?: boolean) {
    return this.prodRepo.getAll(q, isActive)
  }

  async getById(id: string) {
    const product = await this.prodRepo.getById(id)
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async updateById(id: string, data: any) {
    const product = await this.getById(id)
    if (!product) throw new NotFoundException('Product not found')
    return this.prodRepo.updateById(id, data)
  }

  async deleteById(id: string) {
    const product = await this.getById(id)
    if (!product) throw new NotFoundException('Product not found')
    if (product.isActive === false)
      throw new NotFoundException('Product already inactive')
    await this.prodRepo.deleteById(id)
  }
}
