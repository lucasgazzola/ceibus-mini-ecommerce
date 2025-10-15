import { IsEmail, IsNotEmpty, Max, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'nombre@ejemplo.com',
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'Contraseña (mínimo 6 caracteres, máximo 30 caracteres)',
    example: 'ejemplo123',
  })
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(30)
  password: string
}
