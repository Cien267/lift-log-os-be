import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { AuditEntity } from '../../../common/entities/audit.entity';
import {
  AppLanguage,
  Equipment,
  ThemePreference,
  WeightUnit,
} from '../../../common/enums/forge.enums';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';
import { User } from '../../users/entities/user.entity';

@Entity('user_settings')
export class UserSettings extends AuditEntity {
  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'enum', enum: WeightUnit, default: WeightUnit.Kg })
  unit: WeightUnit;

  @Column({
    type: 'enum',
    enum: ThemePreference,
    default: ThemePreference.Dark,
  })
  theme: ThemePreference;

  @Column({ type: 'enum', enum: AppLanguage, default: AppLanguage.En })
  language: AppLanguage;

  @Column({ type: 'int', default: 90 })
  defaultRest: number;

  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ type: 'enum', enum: Equipment, array: true, default: [] })
  availableEquipment: Equipment[];

  @Column({ type: 'smallint', nullable: true })
  weeklyGoal: number | null;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  targetWeight: number | null;

  @Column({ type: 'boolean', default: true })
  trainingAssistant: boolean;
}
