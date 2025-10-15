import { IsEmail, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@local.com',
  })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Contraseña', example: 'adminpass' })
  @IsNotEmpty()
  password: string
}
