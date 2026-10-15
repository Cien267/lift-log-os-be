import { ApiPropertyOptional } from '@nestjs/swagger';
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
 * PATCH: chỉ đổi thông tin chung của buổi tập (không đụng tới bài tập/set).
 * Field không gửi = giữ nguyên. Các field cho phép null: gửi null để xóa giá trị.
 */
export class UpdateWorkoutDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  name?: string | null;

  @ApiPropertyOptional()
  @ValidateIf(isDefined)
  @Matches(DATE_ONLY_REGEX, { message: 'date phải có dạng YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional()
  @ValidateIf(isDefined)
  @Transform(toDate)
  @IsDate()
  startTime?: Date;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(toDate)
  @IsDate()
  endTime?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_WORKOUT_DURATION_SEC)
  durationSec?: number | null;

  @ApiPropertyOptional({ enum: WorkoutLocation })
  @ValidateIf(isDefined)
  @IsEnum(WorkoutLocation)
  location?: WorkoutLocation;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  templateId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  mood?: number | null;

  @ApiPropertyOptional({ nullable: true })
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

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20000)
  estimatedCalories?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsObject()
  insight?: Record<string, unknown> | null;
}
