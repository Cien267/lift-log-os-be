import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { DATE_ONLY_REGEX } from '../../../common/constants/date.constants';
import { WorkoutLocation } from '../../../common/enums/forge.enums';
import {
  isDefined,
  toDate,
  trimString,
} from '../../../common/validation/validation.helpers';
import {
  MAX_TOTAL_CARDIO_MIN,
  MAX_TOTAL_VOLUME,
  MAX_WORKOUT_DURATION_SEC,
} from '../constants/workouts.constants';

/**
 * Các trường của buổi tập mà client được phép gửi.
 * totalVolume / totalCardioMin / estimatedCalories là số liệu client tự tính khi kết thúc buổi tập
 * (finishWorkout). Nếu client không gửi, server tự tính từ các set theo cùng quy tắc.
 */
export class WorkoutBodyDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  name?: string | null;

  @ApiProperty({
    example: '2026-10-11',
    description: 'Ngày theo lịch của người tập',
  })
  @Matches(DATE_ONLY_REGEX, { message: 'date phải có dạng YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'ISO 8601 hoặc epoch ms' })
  @Transform(toDate)
  @IsDate()
  startTime: Date;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ISO 8601 hoặc epoch ms',
  })
  @IsOptional()
  @Transform(toDate)
  @IsDate()
  endTime?: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Giây. Nếu bỏ trống và có endTime, server tự tính.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_WORKOUT_DURATION_SEC)
  durationSec?: number | null;

  @ApiProperty({ enum: WorkoutLocation })
  @IsEnum(WorkoutLocation)
  location: WorkoutLocation;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  mood?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  energyLevel?: number | null;

  @ApiPropertyOptional({
    description: 'kg. Bỏ trống để server tự tính từ các set.',
  })
  @ValidateIf(isDefined)
  @IsNumber()
  @Min(0)
  @Max(MAX_TOTAL_VOLUME)
  totalVolume?: number;

  @ApiPropertyOptional({
    description: 'Phút. Bỏ trống để server tự tính từ các set cardio.',
  })
  @ValidateIf(isDefined)
  @IsNumber()
  @Min(0)
  @Max(MAX_TOTAL_CARDIO_MIN)
  totalCardioMin?: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Calo ước tính do client tính',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20000)
  estimatedCalories?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Đối tượng JSON tự do, tối đa 64KB',
  })
  @IsOptional()
  @IsObject()
  insight?: Record<string, unknown> | null;
}
