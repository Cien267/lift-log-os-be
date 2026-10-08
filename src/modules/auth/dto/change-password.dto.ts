import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @MinLength(10, { message: 'Mật khẩu phải có ít nhất 10 ký tự' })
  @MaxLength(128)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Mật khẩu phải có cả chữ và số',
  })
  newPassword: string;
}
