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
import { Exercise } from '../../exercises/entities/exercise.entity';
import { WorkoutTemplate } from './workout-template.entity';

@Entity('template_exercises')
@Index('idx_template_exercises_template_position', ['templateId', 'position'])
@Index('idx_template_exercises_exercise', ['exerciseId'])
@Index('idx_template_exercises_user_updated', ['userId', 'updatedAt'])
@Check('chk_template_exercises_sets', '"target_sets" > 0')
@Check(
  'chk_template_exercises_reps',
  '"target_reps_min" IS NULL OR "target_reps_max" IS NULL OR "target_reps_min" <= "target_reps_max"',
)
export class TemplateExercise extends UserOwnedEntity {
  @Column({ type: 'uuid' })
  templateId: string;

  @ManyToOne(() => WorkoutTemplate, (t) => t.exercises, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'template_id' })
  template: Relation<WorkoutTemplate>;

  @Column({ type: 'uuid' })
  exerciseId: string;

  @ManyToOne(() => Exercise, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Relation<Exercise>;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'smallint' })
  targetSets: number;

  @Column({ type: 'smallint', nullable: true })
  targetRepsMin: number | null;

  @Column({ type: 'smallint', nullable: true })
  targetRepsMax: number | null;

  @Column({ type: 'int', nullable: true })
  restPreset: number | null;

  @Column({ type: 'smallint', nullable: true })
  supersetGroup: number | null;
}
