import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../common/enums/forge.enums';
import { UsersService } from '../../users/users.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../types/auth.types';

/**
 * Guard global chạy sau JwtAuthGuard. Vai trò được đọc từ DB chứ không lấy từ JWT,
 * để việc thăng/giáng quyền có hiệu lực ngay, không phải chờ access token hết hạn.
 * Chỉ route có @Roles() mới tốn thêm một truy vấn theo khóa chính.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user) return false;

    const user = await this.users.findById(request.user.userId);
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
    return true;
  }
}
