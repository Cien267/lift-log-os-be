import { Check, Column, Entity, Index } from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';

const decimal = (precision: number, scale: number) =>
  ({
    type: 'numeric',
    precision,
    scale,
    nullable: true,
    transformer: numericTransformer,
  }) as const;

@Entity('body_measurements')
@Index('idx_measurements_user_date', ['userId', 'date'])
@Index('idx_measurements_user_updated', ['userId', 'updatedAt'])
@Check('chk_measurements_weight', '"weight" IS NULL OR "weight" > 0')
export class BodyMeasurement extends UserOwnedEntity {
  @Column({ type: 'date' })
  date: string;

  @Column(decimal(5, 2))
  weight: number | null;

  @Column(decimal(5, 1))
  height: number | null;

  @Column(decimal(4, 1))
  bodyFat: number | null;

  @Column(decimal(5, 1))
  chest: number | null;

  @Column(decimal(5, 1))
  waist: number | null;

  @Column(decimal(5, 1))
  arm: number | null;

  @Column(decimal(5, 1))
  thigh: number | null;

  @Column(decimal(5, 1))
  shoulder: number | null;

  @Column(decimal(5, 1))
  hip: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
