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
import { ApiQuery, ApiParam } from '@nestjs/swagger'
import { CreateOrderDto } from './dto/create-order.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../auth/guards/admin.guard'
import { OrdersService } from './orders.service'
import { OrderStatus, UserRole } from '../utils/enums'

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtra por estado del pedido',
    enum: OrderStatus,
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Req() req: any, @Query('status') status?: OrderStatus) {
    const userRole = req.user?.role
    const userId = req.user.sub
    return this.ordersService.getAll(userId, userRole, status)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    // Si no es admin, solo puede ver sus propios pedidos
    const order = await this.ordersService.getById(id)
    if (req.user.role !== UserRole.ADMIN && order.userId !== req.user.sub)
      throw new ForbiddenException("You can't access this order")
    return order
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user.sub
    return this.ordersService.create(userId, dto)
  }

  @ApiParam({
    name: 'status',
    required: true,
    enum: Object.values(OrderStatus),
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/:status')
  async changeStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Param('status') status: OrderStatus
  ) {
    return this.ordersService.changeStatus(id, status)
  }
}
