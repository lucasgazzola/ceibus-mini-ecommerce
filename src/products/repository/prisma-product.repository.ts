import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ProductRepository } from './product.repository'

import { UpdateProductDto } from '../dto/update-product.dto'
import { CreateProductDto } from '../dto/create-product.dto'
import { Product } from '@prisma/client'

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({ data })
  }

  async getAll(q?: string, isActive?: boolean): Promise<Product[]> {
    const where: any = {}
    if (q) where.name = { contains: q, mode: 'insensitive' }
    if (isActive !== undefined) where.isActive = isActive
    return this.prisma.product.findMany({ where })
  }

  async getById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } })
  }

  async updateById(id: string, data: UpdateProductDto): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data })
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } })
  }
}
