import { Column, Entity, Index } from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { NotificationType } from '../../../common/enums/forge.enums';

@Entity('notifications')
@Index('idx_notifications_user_inbox', ['userId', 'isRead', 'createdAt'])
@Index('idx_notifications_user_updated', ['userId', 'updatedAt'])
@Index('uq_notifications_user_key', ['userId', 'key'], {
  unique: true,
  where: '"key" IS NOT NULL AND "deleted_at" IS NULL',
})
export class Notification extends UserOwnedEntity {
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  key: string | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subtitle: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;
}
