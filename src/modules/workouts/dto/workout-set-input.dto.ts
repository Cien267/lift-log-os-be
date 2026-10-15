import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  isDefined,
  toDate,
} from '../../../common/validation/validation.helpers';

export class WorkoutSetInputDto {
  @ApiPropertyOptional({
    description: 'UUID do client sinh. Bỏ trống để server tự sinh.',
  })
  @ValidateIf(isDefined)
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'kg (server làm tròn 2 chữ số thập phân)',
    minimum: 0,
    maximum: 1000,
  })
  @IsNumber()
  @Min(0)
  @Max(1000)
  weight: number;

  @ApiProperty({ minimum: 0, maximum: 1000 })
  @IsInt()
  @Min(0)
  @Max(1000)
  reps: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Phút, chỉ dùng cho bài cardio',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1440)
  durationMin?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  rir?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rpe?: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Giây nghỉ thực tế' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  restTime?: number | null;

  @ApiPropertyOptional({ default: false })
  @ValidateIf(isDefined)
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ default: false })
  @ValidateIf(isDefined)
  @IsBoolean()
  isWarmup?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @ApiProperty({
    description:
      'ISO 8601 hoặc epoch ms (Dexie: timestamp). Dùng để sắp xếp các set.',
  })
  @Transform(toDate)
  @IsDate()
  performedAt: Date;
}
