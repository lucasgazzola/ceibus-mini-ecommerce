import { Product } from '@prisma/client'
import { CreateProductDto } from '../dto/create-product.dto'
import { UpdateProductDto } from '../dto/update-product.dto'

export abstract class ProductRepository {
  abstract create(data: CreateProductDto): Promise<Product>
  abstract getAll(q?: string, isActive?: boolean): Promise<Product[]>
  abstract getById(id: string): Promise<Product | null>
  abstract updateById(
    id: string,
    data: Partial<UpdateProductDto>
  ): Promise<Product>
  abstract deleteById(id: string): Promise<void>
}
