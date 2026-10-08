import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { AuditEntity } from '../../../common/entities/audit.entity';
import {
  Equipment,
  ExerciseCategory,
  MuscleGroup,
} from '../../../common/enums/forge.enums';
import { User } from '../../users/entities/user.entity';

@Entity('exercises')
@Index('uq_exercises_system_name', ['name'], {
  unique: true,
  where: '"user_id" IS NULL AND "deleted_at" IS NULL',
})
@Index('uq_exercises_user_name', ['userId', 'name'], {
  unique: true,
  where: '"user_id" IS NOT NULL AND "deleted_at" IS NULL',
})
@Index('idx_exercises_muscle_group', ['muscleGroup'])
@Index('idx_exercises_user_updated', ['userId', 'updatedAt'])
export class Exercise extends AuditEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'enum', enum: MuscleGroup })
  muscleGroup: MuscleGroup;

  @Column({ type: 'enum', enum: MuscleGroup, array: true, default: [] })
  secondaryMuscles: MuscleGroup[];

  @Column({ type: 'enum', enum: Equipment })
  equipment: Equipment;

  @Column({ type: 'enum', enum: ExerciseCategory })
  category: ExerciseCategory;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  aliases: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  guideImage: string | null;

  @ManyToMany(() => Exercise)
  @JoinTable({
    name: 'exercise_substitutes',
    joinColumn: { name: 'exercise_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'substitute_id', referencedColumnName: 'id' },
  })
  substitutes: Relation<Exercise>[];

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
