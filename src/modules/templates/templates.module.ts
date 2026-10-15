import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExercisesModule } from '../exercises/exercises.module';
import { TemplateExercise } from './entities/template-exercise.entity';
import { WorkoutTemplate } from './entities/workout-template.entity';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutTemplate, TemplateExercise]),
    ExercisesModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
