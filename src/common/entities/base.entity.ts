import {
  Column,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { AuditEntity } from './audit.entity';

export abstract class SyncEntity extends AuditEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}

export abstract class UserOwnedEntity extends SyncEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;
}
