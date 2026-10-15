import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUUID, ValidateIf } from 'class-validator';
import {
  Equipment,
  ExerciseCategory,
  MuscleGroup,
} from '../../../common/enums/forge.enums';
import {
  AliasesRule,
  ExerciseName,
  SecondaryMusclesRule,
  SubstituteIdsRule,
} from './exercise.rules';
import { isDefined } from '../../../common/validation/validation.helpers';

/** Các trường chung khi tạo bài tập (chưa có id). */
export class ExerciseBodyDto {
  @ApiProperty()
  @ExerciseName()
  name: string;

  @ApiProperty({ enum: MuscleGroup })
  @IsEnum(MuscleGroup)
  muscleGroup: MuscleGroup;

  @ApiPropertyOptional({ enum: MuscleGroup, isArray: true })
  @ValidateIf(isDefined)
  @SecondaryMusclesRule()
  secondaryMuscles?: MuscleGroup[];

  @ApiProperty({ enum: Equipment })
  @IsEnum(Equipment)
  equipment: Equipment;

  @ApiProperty({ enum: ExerciseCategory })
  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf(isDefined)
  @AliasesRule()
  aliases?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Id các bài tập thay thế',
  })
  @ValidateIf(isDefined)
  @SubstituteIdsRule()
  substituteIds?: string[];
}

export class CreateExerciseDto extends ExerciseBodyDto {
  @ApiPropertyOptional({
    description:
      'UUID do client sinh (offline-first). Bỏ trống để server tự sinh.',
  })
  @ValidateIf(isDefined)
  @IsUUID()
  id?: string;
}
