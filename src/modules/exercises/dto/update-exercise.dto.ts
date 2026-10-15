import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, ValidateIf } from 'class-validator';
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

/** PATCH: field không gửi = giữ nguyên; không field nào cho phép null. */
export class UpdateExerciseDto {
  @ApiPropertyOptional()
  @ValidateIf(isDefined)
  @ExerciseName()
  name?: string;

  @ApiPropertyOptional({ enum: MuscleGroup })
  @ValidateIf(isDefined)
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup;

  @ApiPropertyOptional({ enum: MuscleGroup, isArray: true })
  @ValidateIf(isDefined)
  @SecondaryMusclesRule()
  secondaryMuscles?: MuscleGroup[];

  @ApiPropertyOptional({ enum: Equipment })
  @ValidateIf(isDefined)
  @IsEnum(Equipment)
  equipment?: Equipment;

  @ApiPropertyOptional({ enum: ExerciseCategory })
  @ValidateIf(isDefined)
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf(isDefined)
  @AliasesRule()
  aliases?: string[];

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf(isDefined)
  @SubstituteIdsRule()
  substituteIds?: string[];
}
