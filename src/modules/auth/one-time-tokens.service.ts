import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import {
  INVALID_LINK,
  ONE_TIME_TOKEN_COOLDOWN_MS,
} from './constants/auth.constants';
import { AuthToken, AuthTokenType } from './entities/auth-token.entity';

@Injectable()
export class OneTimeTokensService {
  constructor(
    @InjectRepository(AuthToken) private readonly repo: Repository<AuthToken>,
    private readonly config: ConfigService,
  ) {}

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private ttlMs(type: AuthTokenType): number {
    return type === AuthTokenType.EmailVerification
      ? this.config.getOrThrow<number>('EMAIL_VERIFICATION_TTL_HOURS') *
          3_600_000
      : this.config.getOrThrow<number>('PASSWORD_RESET_TTL_MINUTES') * 60_000;
  }

  /**
   * Tạo token mới. Trả về null nếu vừa gửi cách đây chưa đầy 60 giây (chống người khác
   * dùng chức năng này để "ném" email vào hộp thư nạn nhân).
   *
   * Email xác minh: token mới thay thế token cũ (chỉ chính chủ đang đăng nhập mới gửi lại được).
   * Đặt lại mật khẩu: KHÔNG vô hiệu token cũ, nếu không người lạ biết email của bạn có thể
   * liên tục gửi yêu cầu để làm chết liên kết đang nằm trong hộp thư của bạn. Thay vào đó,
   * dùng thành công một token thì mọi token còn lại bị vô hiệu (xem AuthService.resetPassword).
   */
  async issue(userId: string, type: AuthTokenType): Promise<string | null> {
    const latest = await this.repo.findOne({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < ONE_TIME_TOKEN_COOLDOWN_MS
    ) {
      return null;
    }

    if (type === AuthTokenType.EmailVerification) {
      await this.invalidateAll(userId, type);
    }

    const raw = randomBytes(32).toString('base64url');
    await this.repo.save(
      this.repo.create({
        userId,
        type,
        tokenHash: this.hash(raw),
        expiresAt: new Date(Date.now() + this.ttlMs(type)),
      }),
    );
    return raw;
  }

  /**
   * Dùng token đúng một lần. Mọi lý do thất bại (không tồn tại, sai loại, hết hạn,
   * đã dùng) đều trả cùng một lỗi để kẻ tấn công không thăm dò được.
   */
  async consume(raw: string, type: AuthTokenType): Promise<string> {
    const row = await this.repo.findOne({
      where: { tokenHash: this.hash(raw), type },
    });
    if (!row || row.consumedAt || row.expiresAt <= new Date()) {
      throw new BadRequestException(INVALID_LINK);
    }
    // UPDATE có điều kiện: hai request đồng thời cùng token, chỉ một request thắng.
    const claimed = await this.repo.update(
      { id: row.id, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
    if (claimed.affected !== 1) throw new BadRequestException(INVALID_LINK);
    return row.userId;
  }

  async invalidateAll(userId: string, type: AuthTokenType): Promise<void> {
    await this.repo.update(
      { userId, type, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
  }
}
