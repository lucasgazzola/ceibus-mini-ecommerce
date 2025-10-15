import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(30)
  passwordHash: string
}
