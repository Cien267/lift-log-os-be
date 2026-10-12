import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  Equipment,
  ExerciseCategory,
  MuscleGroup,
} from '../../../common/enums/forge.enums';
import { PaginationQueryDto } from '../../../common/pagination/pagination';

export enum ExerciseScope {
  All = 'all',
  System = 'system',
  Custom = 'custom',
}

export class ListExercisesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên hoặc tên gọi khác' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: ExerciseScope, default: ExerciseScope.All })
  @IsOptional()
  @IsEnum(ExerciseScope)
  scope?: ExerciseScope;

  @ApiPropertyOptional({ enum: MuscleGroup })
  @IsOptional()
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup;

  @ApiPropertyOptional({ enum: Equipment })
  @IsOptional()
  @IsEnum(Equipment)
  equipment?: Equipment;

  @ApiPropertyOptional({ enum: ExerciseCategory })
  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;
}
