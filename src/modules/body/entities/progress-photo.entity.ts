import { Column, Entity, Index } from 'typeorm';
import { UserOwnedEntity } from '../../../common/entities/base.entity';
import { PhotoAngle } from '../../../common/enums/forge.enums';

@Entity('progress_photos')
@Index('idx_photos_user_date', ['userId', 'date'])
@Index('idx_photos_user_updated', ['userId', 'updatedAt'])
export class ProgressPhoto extends UserOwnedEntity {
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 255 })
  storageKey: string;

  @Column({ type: 'varchar', length: 255 })
  thumbKey: string;

  @Column({ type: 'varchar', length: 50 })
  mimeType: string;

  @Column({ type: 'int' })
  sizeBytes: number;

  @Column({ type: 'enum', enum: PhotoAngle, nullable: true })
  angle: PhotoAngle | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
