import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto) {
    const { token } = await this.authService.register(dto.email, dto.password)
    return { access_token: token }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { token } = await this.authService.login(dto.email, dto.password)
    return { access_token: token }
  }
}
