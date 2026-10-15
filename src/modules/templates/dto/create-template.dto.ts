import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
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

export class CreateTemplateDto {
  @ApiPropertyOptional({
    description:
      'UUID do client sinh (offline-first). Bỏ trống để server tự sinh.',
  })
  @ValidateIf(isDefined)
  @IsUUID()
  id?: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ enum: WorkoutLocation })
  @IsEnum(WorkoutLocation)
  location: WorkoutLocation;

  @ApiPropertyOptional({
    description: 'Thứ tự hiển thị. Bỏ trống để xếp cuối danh sách.',
  })
  @ValidateIf(isDefined)
  @IsInt()
  @Min(0)
  @Max(10_000)
  position?: number;

  @ApiProperty({
    type: [TemplateExerciseInputDto],
    description: 'Thứ tự trong mảng chính là thứ tự bài tập',
  })
  @IsArray()
  @ArrayMaxSize(MAX_EXERCISES_PER_TEMPLATE)
  @ValidateNested({ each: true })
  @Type(() => TemplateExerciseInputDto)
  exercises: TemplateExerciseInputDto[];
}
