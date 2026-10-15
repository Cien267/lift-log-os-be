import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { MAX_EXERCISES_PER_WORKOUT } from '../constants/workouts.constants';
import { WorkoutBodyDto } from './workout-body.dto';
import { WorkoutExerciseInputDto } from './workout-exercise-input.dto';

/** PUT: thay thế toàn bộ buổi tập (kể cả bài tập và set bên trong). */
export class ReplaceWorkoutDto extends WorkoutBodyDto {
  @ApiProperty({
    type: [WorkoutExerciseInputDto],
    description: 'Thứ tự trong mảng chính là thứ tự bài tập',
  })
  @IsArray()
  @ArrayMaxSize(MAX_EXERCISES_PER_WORKOUT)
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseInputDto)
  exercises: WorkoutExerciseInputDto[];
}
