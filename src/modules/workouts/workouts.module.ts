import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExercisesModule } from '../exercises/exercises.module';
import { ExerciseHistoryController } from './exercise-history.controller';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { WorkoutSet } from './entities/workout-set.entity';
import { Workout } from './entities/workout.entity';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workout, WorkoutExercise, WorkoutSet]),
    ExercisesModule,
  ],
  controllers: [WorkoutsController, ExerciseHistoryController],
  providers: [WorkoutsService],
})
export class WorkoutsModule {}
