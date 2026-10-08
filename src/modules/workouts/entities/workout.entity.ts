import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { WorkoutLocation } from '../../../common/enums/forge.enums';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';
import { WorkoutTemplate } from '../../templates/entities/workout-template.entity';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('workouts')
@Index('idx_workouts_user_date', ['userId', 'date'])
@Index('idx_workouts_user_updated', ['userId', 'updatedAt'])
@Index('idx_workouts_template', ['templateId'])
@Check('chk_workouts_mood', '"mood" BETWEEN 1 AND 5')
@Check('chk_workouts_energy', '"energy_level" BETWEEN 1 AND 5')
@Check('chk_workouts_duration', '"duration_sec" IS NULL OR "duration_sec" >= 0')
export class Workout extends UserOwnedEntity {
  @Column({ type: 'uuid', nullable: true })
  templateId: string | null;

  @ManyToOne(() => WorkoutTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: Relation<WorkoutTemplate> | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  name: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date | null;

  @Column({ type: 'int', nullable: true })
  durationSec: number | null;

  @Column({ type: 'enum', enum: WorkoutLocation })
  location: WorkoutLocation;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'smallint', nullable: true })
  mood: number | null;

  @Column({ type: 'smallint', nullable: true })
  energyLevel: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  totalVolume: number;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  totalCardioMin: number;

  @Column({ type: 'int', nullable: true })
  estimatedCalories: number | null;

  @Column({ type: 'jsonb', nullable: true })
  insight: Record<string, unknown> | null;

  @OneToMany(() => WorkoutExercise, (we) => we.workout)
  exercises: Relation<WorkoutExercise>[];
}
