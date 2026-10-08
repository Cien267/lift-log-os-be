import { Column, Entity, Index, OneToMany, Relation } from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { WorkoutLocation } from '../../../common/enums/forge.enums';
import { TemplateExercise } from './template-exercise.entity';

@Entity('workout_templates')
@Index('idx_templates_user_position', ['userId', 'position'])
@Index('idx_templates_user_updated', ['userId', 'updatedAt'])
export class WorkoutTemplate extends UserOwnedEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: WorkoutLocation })
  location: WorkoutLocation;

  @Column({ type: 'int', default: 0 })
  position: number;

  @OneToMany(() => TemplateExercise, (te) => te.template)
  exercises: Relation<TemplateExercise>[];
}
