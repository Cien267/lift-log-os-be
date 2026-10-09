import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../common/enums/forge.enums';

export const ROLES_KEY = 'roles';

/** Chỉ cho phép các vai trò được liệt kê. Route không gắn @Roles() thì mọi user đã đăng nhập đều vào được. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
