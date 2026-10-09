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

export enum AuthTokenType {
  EmailVerification = 'email_verification',
  PasswordReset = 'password_reset',
}

/**
 * Token dùng một lần gửi qua email (xác minh email, đặt lại mật khẩu).
 * Token gốc chỉ nằm trong email; DB chỉ giữ SHA-256 của nó.
 */
@Entity('auth_tokens')
@Index('uq_auth_tokens_hash', ['tokenHash'], { unique: true })
@Index('idx_auth_tokens_user_type', ['userId', 'type', 'createdAt'])
export class AuthToken extends AuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'enum', enum: AuthTokenType })
  type: AuthTokenType;

  @Column({ type: 'char', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  /** Đã dùng, hoặc đã bị vô hiệu. Khác NULL nghĩa là không còn dùng được. */
  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;
}
