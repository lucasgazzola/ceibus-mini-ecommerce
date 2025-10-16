import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common'
import { ApiQuery } from '@nestjs/swagger'
import { UserRole } from '../utils/enums'
import { AdminGuard } from '../auth/guards/admin.guard'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @ApiQuery({
    name: 'is_active',
    required: false,
    description: 'Filtra por estado activo (Solo ADMINs)',
    type: Boolean,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en nombre/descr.',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('is_active') isActive?: boolean
  ) {
    // Si no es admin, solo puede ver productos activos
    // Si es admin, puede filtrar por activos/inactivos o ver todos
    const isAdmin = req.user?.role === UserRole.ADMIN
    return this.productsService.getAll(q, isAdmin ? isActive : true)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    // Si no es admin, no puede ver productos inactivos
    if (req.user?.role !== UserRole.ADMIN) {
      const product = await this.productsService.getById(id)
      if (!product.isActive) {
        throw new ForbiddenException('Access to this product is forbidden')
      }
    }
    return this.productsService.getById(id)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Req() _req: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  async updateById(
    @Req() _req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productsService.updateById(id, dto)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async delete(@Req() _req: any, @Param('id') id: string) {
    return this.productsService.deleteById(id)
  }
}
