import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common'
import { UserRole } from '../../utils/enums'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private requiredRole: UserRole) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const user = req.user
    if (!user) return false
    if (this.requiredRole === UserRole.ADMIN) {
      if (user.role !== UserRole.ADMIN) throw new ForbiddenException()
      return true
    }
    return true
  }
}
