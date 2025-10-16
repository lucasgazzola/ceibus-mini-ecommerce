import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { UserRole } from '../../utils/enums'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) throw new ForbiddenException('User not found')

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can access this resource')
    }

    return true
  }
}
