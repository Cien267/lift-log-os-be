import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { isDefined } from '../../../common/validation/validation.helpers';
import { MAX_SETS_PER_EXERCISE } from '../constants/workouts.constants';
import { WorkoutSetInputDto } from './workout-set-input.dto';

export class WorkoutExerciseInputDto {
  @ApiPropertyOptional({
    description: 'UUID do client sinh. Bỏ trống để server tự sinh.',
  })
  @ValidateIf(isDefined)
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  exerciseId: string;

  @ApiPropertyOptional({ nullable: true, description: 'Giây nghỉ (0-900)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(900)
  restPreset?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Các bài cùng số tạo thành một superset',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  supersetGroup?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  targetSets?: number | null;

  @ApiProperty({ type: [WorkoutSetInputDto] })
  @IsArray()
  @ArrayMaxSize(MAX_SETS_PER_EXERCISE)
  @ValidateNested({ each: true })
  @Type(() => WorkoutSetInputDto)
  sets: WorkoutSetInputDto[];
}
