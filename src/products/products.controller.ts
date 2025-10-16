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
    description: 'Filtra por estado activo',
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
    // El filtro `is_active` solo puede ser usado por ADMINs
    const isAdmin = req.user?.role === UserRole.ADMIN
    if (typeof isActive !== 'undefined') {
      if (!isAdmin && isActive !== true)
        throw new ForbiddenException('Only admins can filter by is_active')
    }
    return this.productsService.getAll(q, isAdmin ? isActive : true)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productsService.getById(id)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  async updateById(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productsService.updateById(id, dto)
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productsService.deleteById(id)
  }
}
