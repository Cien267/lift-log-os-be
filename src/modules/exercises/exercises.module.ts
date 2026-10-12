import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AdminExercisesController } from './admin-exercises.controller';
import { Exercise } from './entities/exercise.entity';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

@Module({
  // UsersModule: VerifiedEmailGuard (dùng ở controller admin) cần UsersService.
  imports: [TypeOrmModule.forFeature([Exercise]), UsersModule],
  controllers: [ExercisesController, AdminExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
