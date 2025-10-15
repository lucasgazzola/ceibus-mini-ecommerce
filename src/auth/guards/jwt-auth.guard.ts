import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { TokenService } from '../token.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private service: TokenService,
    // Inyectando la variable de entorno JWT_SECRET nos asegura que el valor
    // esté disponible cuando se cree una instancia de JwtAuthGuard
    @Inject('JWT_SECRET') private jwtSecret: string
  ) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const auth = req.headers['authorization'] || req.headers['Authorization']
    if (!auth) throw new UnauthorizedException('Missing token')
    const token = String(auth).replace('Bearer ', '')
    try {
      const payload = this.service.verify(token, this.jwtSecret)
      req.user = payload
      return true
    } catch (e) {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
