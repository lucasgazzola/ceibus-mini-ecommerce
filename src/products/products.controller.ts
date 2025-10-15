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
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { UserRole } from '../utils/enums'

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateProductDto) {
    const role = req.user?.role
    if (role !== UserRole.ADMIN) throw new ForbiddenException()
    return this.productsService.create(dto)
  }

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
  @Get()
  async getAll(@Query('q') q?: string, @Query('is_active') isActive?: boolean) {
    return this.productsService.getAll(q, isActive)
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productsService.getById(id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateById(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    const role = req.user?.role
    if (role !== UserRole.ADMIN) throw new ForbiddenException()
    return this.productsService.updateById(id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const role = req.user?.role
    if (role !== UserRole.ADMIN) throw new ForbiddenException()
    return this.productsService.deleteById(id)
  }
}
