import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email: string;

  // Không áp chính sách độ mạnh khi đăng nhập, chỉ giới hạn độ dài để tránh DoS.
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
