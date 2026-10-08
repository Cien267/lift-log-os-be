import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('workout_sets')
@Index('idx_sets_workout_exercise', ['workoutExerciseId'])
@Index('idx_sets_user_updated', ['userId', 'updatedAt'])
@Index(
  'idx_sets_user_exercise_performed',
  ['userId', 'exerciseId', 'performedAt'],
  {
    where:
      '"completed" = true AND "is_warmup" = false AND "deleted_at" IS NULL',
  },
)
@Check('chk_sets_weight', '"weight" >= 0')
@Check('chk_sets_reps', '"reps" >= 0')
@Check('chk_sets_duration', '"duration_min" IS NULL OR "duration_min" >= 0')
@Check('chk_sets_rir', '"rir" IS NULL OR "rir" BETWEEN 0 AND 10')
@Check('chk_sets_rpe', '"rpe" IS NULL OR "rpe" BETWEEN 0 AND 10')
export class WorkoutSet extends UserOwnedEntity {
  @Column({ type: 'uuid' })
  workoutExerciseId: string;

  @ManyToOne(() => WorkoutExercise, (we) => we.sets, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'workout_exercise_id' })
  workoutExercise: Relation<WorkoutExercise>;

  @Column({ type: 'uuid' })
  exerciseId: string;

  @ManyToOne(() => Exercise, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Relation<Exercise>;

  @Column({
    type: 'numeric',
    precision: 7,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  weight: number;

  @Column({ type: 'smallint', default: 0 })
  reps: number;

  @Column({
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  durationMin: number | null;

  @Column({ type: 'smallint', nullable: true })
  rir: number | null;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
    transformer: numericTransformer,
  })
  rpe: number | null;

  @Column({ type: 'int', nullable: true })
  restTime: number | null;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'boolean', default: false })
  isWarmup: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz' })
  performedAt: Date;
}
