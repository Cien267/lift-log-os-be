import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Quy tắc mật khẩu dùng chung cho đăng ký, đổi mật khẩu và đặt lại mật khẩu. */
export const StrongPassword = () =>
  applyDecorators(
    IsString(),
    MinLength(10, { message: 'Mật khẩu phải có ít nhất 10 ký tự' }),
    MaxLength(128),
    Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
      message: 'Mật khẩu phải có cả chữ và số',
    }),
  );
