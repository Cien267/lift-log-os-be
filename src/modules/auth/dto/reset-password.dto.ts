import { IsString, MaxLength, MinLength } from 'class-validator';
import { StrongPassword } from './password.rules';

export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token: string;

  @StrongPassword()
  newPassword: string;
}
