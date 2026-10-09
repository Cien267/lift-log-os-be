import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, QueryFailedError, Repository } from 'typeorm';
import {
  LOCK_DURATION_MS,
  MAX_FAILED_LOGINS,
} from '../auth/constants/auth.constants';
import { UserSettings } from '../settings/entities/user-settings.entity';
import { User } from './entities/user.entity';

interface CreateUserInput {
  email: string;
  name: string;
  password: string; // đã hash
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /** Tạo user và dòng settings mặc định trong cùng một transaction. */
  async createWithSettings(input: CreateUserInput): Promise<User> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(manager.create(User, input));
        await manager.save(manager.create(UserSettings, { userId: user.id }));
        return user;
      });
    } catch (error) {
      // Dựa vào unique constraint của DB thay vì "kiểm tra rồi mới tạo" (có race condition).
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === '23505'
      ) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  /** Lấy cả cột password (mặc định bị ẩn bởi select: false). */
  findByEmailForAuth(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByIdForAuth(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  async registerFailedLogin(userId: string): Promise<void> {
    await this.repo.increment({ id: userId }, 'failedLoginAttempts', 1);
    const user = await this.repo.findOneBy({ id: userId });
    if (user && user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
      await this.repo.update(userId, {
        failedLoginAttempts: 0,
        lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
      });
    }
  }

  async registerSuccessfulLogin(userId: string): Promise<void> {
    await this.repo.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });
  }

  async setPassword(userId: string, passwordHash: string): Promise<void> {
    await this.repo.update(userId, {
      password: passwordHash,
      passwordChangedAt: new Date(),
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.repo.update(
      { id: userId, emailVerifiedAt: IsNull() },
      { emailVerifiedAt: new Date() },
    );
  }

  /**
   * Đặt lại mật khẩu qua email: ghi mật khẩu mới, gỡ khóa tài khoản, và coi email là đã xác minh
   * (người nhận được liên kết đặt lại thì chắc chắn kiểm soát hộp thư đó).
   */
  async resetPassword(userId: string, passwordHash: string): Promise<void> {
    await this.repo.update(userId, {
      password: passwordHash,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      emailVerifiedAt: () => 'COALESCE("email_verified_at", now())',
    });
  }
}
