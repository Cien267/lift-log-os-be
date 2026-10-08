import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Đánh dấu route không cần đăng nhập (guard JWT là global, mặc định chặn tất cả). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
