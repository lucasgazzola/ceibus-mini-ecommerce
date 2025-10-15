import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsString, Min, IsNotEmpty } from 'class-validator'

export class OrderItemDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 'cmgrhq0s00001jxh3xvd3nbd1',
  })
  @IsString()
  @IsNotEmpty()
  product_id: string

  @ApiProperty({ description: 'Cantidad solicitada', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number
}
