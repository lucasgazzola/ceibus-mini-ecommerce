import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OrderStatus, UserRole } from '../utils/enums'
import { ApiQuery, ApiParam } from '@nestjs/swagger'

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user.sub
    return this.ordersService.create(userId, dto)
  }

  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtra por estado del pedido',
    enum: OrderStatus,
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Req() req: any, @Query('status') status?: OrderStatus) {
    const isAdmin = req.user?.role === UserRole.ADMIN
    const userId = req.user.sub
    return this.ordersService.getAll(userId, isAdmin, status)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    const order = await this.ordersService.getById(id)
    if (req.user.role !== UserRole.ADMIN && order.userId !== req.user.sub)
      throw new ForbiddenException()
    return order
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/:status')
  @ApiParam({
    name: 'status',
    required: true,
    enum: Object.values(OrderStatus),
  })
  async changeStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Param('status') status: OrderStatus
  ) {
    if (req.user.role !== UserRole.ADMIN) throw new ForbiddenException()
    return this.ordersService.changeStatus(id, status)
  }
}
