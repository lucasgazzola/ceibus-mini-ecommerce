import { IsInt, Min, IsBoolean, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Auriculares Bluetooth',
    required: false,
  })
  @IsOptional()
  name?: string

  @ApiProperty({
    description: 'Precio en centavos',
    example: 999,
    minimum: 0,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  priceCents?: number

  @ApiProperty({
    description: 'Stock disponible',
    example: 10,
    minimum: 0,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  stock?: number

  @ApiPropertyOptional({
    description: 'Si el producto está activo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
