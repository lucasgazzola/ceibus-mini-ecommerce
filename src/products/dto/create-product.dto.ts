import { IsNotEmpty, IsInt, Min, IsBoolean, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Teclado mecánico',
  })
  @IsNotEmpty()
  name: string

  @ApiProperty({ description: 'Precio en centavos', example: 999 })
  @IsInt()
  @Min(0)
  priceCents: number

  @ApiProperty({ description: 'Stock disponible', example: 10, minimum: 0 })
  @IsInt()
  @Min(0)
  stock: number

  @ApiPropertyOptional({
    description: 'Si el producto está activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
