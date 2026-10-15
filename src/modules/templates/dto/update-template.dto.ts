import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WorkoutLocation } from '../../../common/enums/forge.enums';
import {
  isDefined,
  trimString,
} from '../../../common/validation/validation.helpers';
import { MAX_EXERCISES_PER_TEMPLATE } from '../constants/templates.constants';
import { TemplateExerciseInputDto } from './template-exercise-input.dto';

/** PATCH: field không gửi = giữ nguyên. Gửi `exercises` sẽ thay thế TOÀN BỘ danh sách bài tập. */
export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @ValidateIf(isDefined)
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ nullable: true, description: 'null để xóa mô tả' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ enum: WorkoutLocation })
  @ValidateIf(isDefined)
  @IsEnum(WorkoutLocation)
  location?: WorkoutLocation;

  @ApiPropertyOptional()
  @ValidateIf(isDefined)
  @IsInt()
  @Min(0)
  @Max(10_000)
  position?: number;

  @ApiPropertyOptional({ type: [TemplateExerciseInputDto] })
  @ValidateIf(isDefined)
  @IsArray()
  @ArrayMaxSize(MAX_EXERCISES_PER_TEMPLATE)
  @ValidateNested({ each: true })
  @Type(() => TemplateExerciseInputDto)
  exercises?: TemplateExerciseInputDto[];
}
