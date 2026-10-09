import { IsString, MaxLength, MinLength } from 'class-validator';
import { StrongPassword } from './password.rules';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword: string;

  @StrongPassword()
  newPassword: string;
}
