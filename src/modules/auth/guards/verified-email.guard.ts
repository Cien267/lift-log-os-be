import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { AuthUser } from '../types/auth.types';

/** Chặn route nếu email chưa được xác minh. Chạy sau guard JWT global nên đã có request.user. */
@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user) return false;

    const user = await this.users.findById(request.user.userId);
    if (!user?.emailVerifiedAt) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Bạn cần xác minh email để dùng chức năng này',
      });
    }
    return true;
  }
}
