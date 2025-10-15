import { IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { OrderItemDto } from './order-item.dto'

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderItemDto],
    description: 'Lista de items del pedido',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}
