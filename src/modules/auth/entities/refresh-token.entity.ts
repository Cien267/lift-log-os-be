import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { AuditEntity } from '../../../common/entities/audit.entity';
import { User } from '../../users/entities/user.entity';
import type { RevokeReason } from '../types/auth.types';

/**
 * Mỗi dòng là một refresh token. Các token sinh ra từ cùng một lần đăng nhập
 * (qua các lần xoay vòng) có chung familyId. Tại mọi thời điểm một family chỉ có
 * tối đa một dòng còn hiệu lực, dòng đó chính là một "phiên" (session).
 */
@Entity('refresh_tokens')
@Index('uq_refresh_tokens_hash', ['tokenHash'], { unique: true })
@Index('idx_refresh_tokens_user_active', ['userId'], {
  where: '"revoked_at" IS NULL',
})
@Index('idx_refresh_tokens_family', ['familyId'])
export class RefreshToken extends AuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'uuid' })
  familyId: string;

  /** SHA-256 (hex) của token gốc. Token gốc không bao giờ được lưu. */
  @Column({ type: 'char', length: 64 })
  tokenHash: string;

  /** Thời điểm đăng nhập ban đầu của cả family (không đổi khi xoay vòng). */
  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  revokedReason: RevokeReason | null;

  @Column({ type: 'uuid', nullable: true })
  replacedById: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;
}
