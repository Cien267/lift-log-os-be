import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { Workout } from './workout.entity';
import { WorkoutSet } from './workout-set.entity';

@Entity('workout_exercises')
@Index('idx_workout_exercises_workout_position', ['workoutId', 'position'])
@Index('idx_workout_exercises_user_exercise', ['userId', 'exerciseId'])
@Index('idx_workout_exercises_user_updated', ['userId', 'updatedAt'])
export class WorkoutExercise extends UserOwnedEntity {
  @Column({ type: 'uuid' })
  workoutId: string;

  @ManyToOne(() => Workout, (w) => w.exercises, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'workout_id' })
  workout: Relation<Workout>;

  @Column({ type: 'uuid' })
  exerciseId: string;

  @ManyToOne(() => Exercise, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Relation<Exercise>;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'int', nullable: true })
  restPreset: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'smallint', nullable: true })
  supersetGroup: number | null;

  @Column({ type: 'smallint', nullable: true })
  targetSets: number | null;

  @OneToMany(() => WorkoutSet, (s) => s.workoutExercise)
  sets: Relation<WorkoutSet>[];
}
