import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { MAX_IMPORT_ITEMS } from '../constants/exercises.constants';
import { CreateExerciseDto, ExerciseBodyDto } from './create-exercise.dto';
import { GuideImageRule } from './exercise.rules';
import { UpdateExerciseDto } from './update-exercise.dto';

export class AdminCreateExerciseDto extends CreateExerciseDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @GuideImageRule()
  guideImage?: string | null;
}

export class AdminUpdateExerciseDto extends UpdateExerciseDto {
  @ApiPropertyOptional({ nullable: true, description: 'null để xóa ảnh' })
  @IsOptional()
  @GuideImageRule()
  guideImage?: string | null;
}

/** Khi import, id là bắt buộc để giữ nguyên UUID mà front-end đang dùng. */
export class ImportExerciseItemDto extends ExerciseBodyDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @GuideImageRule()
  guideImage?: string | null;
}

export class ImportExercisesDto {
  @ApiProperty({ type: [ImportExerciseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMPORT_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ImportExerciseItemDto)
  exercises: ImportExerciseItemDto[];
}
