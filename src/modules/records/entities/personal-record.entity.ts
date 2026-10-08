import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { PrType } from '../../../common/enums/forge.enums';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { Workout } from '../../workouts/entities/workout.entity';

@Entity('personal_records')
@Index('idx_prs_user_exercise_type_value', [
  'userId',
  'exerciseId',
  'type',
  'value',
])
@Index('idx_prs_user_date', ['userId', 'date'])
@Index('idx_prs_workout', ['workoutId'])
@Index('idx_prs_user_updated', ['userId', 'updatedAt'])
export class PersonalRecord extends UserOwnedEntity {
  @Column({ type: 'uuid' })
  exerciseId: string;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Relation<Exercise>;

  @Column({ type: 'enum', enum: PrType })
  type: PrType;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  value: number;

  @Column({
    type: 'numeric',
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  weight: number | null;

  @Column({ type: 'int', nullable: true })
  reps: number | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'uuid' })
  workoutId: string;

  @ManyToOne(() => Workout, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workout_id' })
  workout: Relation<Workout>;
}
