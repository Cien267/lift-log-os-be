import { Check, Column, Entity, Index } from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { MuscleGroup } from '../../../common/enums/forge.enums';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

@Entity('recovery_logs')
@Index('uq_recovery_user_date', ['userId', 'date'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('idx_recovery_user_updated', ['userId', 'updatedAt'])
@Check(
  'chk_recovery_sleep_hours',
  '"sleep_hours" IS NULL OR "sleep_hours" BETWEEN 0 AND 24',
)
@Check(
  'chk_recovery_sleep_quality',
  '"sleep_quality" IS NULL OR "sleep_quality" BETWEEN 1 AND 5',
)
@Check('chk_recovery_fatigue', '"fatigue" IS NULL OR "fatigue" BETWEEN 1 AND 5')
export class RecoveryLog extends UserOwnedEntity {
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'jsonb', nullable: true })
  sorenessByGroup: Partial<Record<MuscleGroup, number>> | null;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
    transformer: numericTransformer,
  })
  sleepHours: number | null;

  @Column({ type: 'smallint', nullable: true })
  sleepQuality: number | null;

  @Column({ type: 'smallint', nullable: true })
  fatigue: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
