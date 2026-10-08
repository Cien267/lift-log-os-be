import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { INVALID_SESSION } from './constants/auth.constants';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthResult, ClientMeta, RevokeReason } from './types/auth.types';

type SessionOwner = Pick<User, 'id' | 'email' | 'name'>;

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  get accessTtlSeconds(): number {
    return this.config.getOrThrow<number>('JWT_ACCESS_TTL_SECONDS');
  }

  private get refreshTtlMs(): number {
    return (
      this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS') * 86_400_000
    );
  }

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private generateRaw(): string {
    // 384 bit ngẫu nhiên, không đoán được; vì vậy SHA-256 là đủ (không cần hash chậm).
    return randomBytes(48).toString('base64url');
  }

  private signAccessToken(userId: string, sessionId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId, sid: sessionId });
  }

  private async insertToken(
    userId: string,
    familyId: string,
    startedAt: Date,
    meta: ClientMeta,
  ) {
    const raw = this.generateRaw();
    const token = await this.repo.save(
      this.repo.create({
        userId,
        familyId,
        startedAt,
        tokenHash: this.hash(raw),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      }),
    );
    return { token, raw };
  }

  private async buildResult(
    user: SessionOwner,
    token: RefreshToken,
    raw: string,
  ): Promise<AuthResult> {
    return {
      accessToken: await this.signAccessToken(user.id, token.id),
      refreshToken: raw,
      refreshExpiresAt: token.expiresAt,
      expiresIn: this.accessTtlSeconds,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  /** Bắt đầu một phiên mới (đăng nhập / đăng ký). */
  async createSession(
    user: SessionOwner,
    meta: ClientMeta,
  ): Promise<AuthResult> {
    const { token, raw } = await this.insertToken(
      user.id,
      randomUUID(),
      new Date(),
      meta,
    );
    return this.buildResult(user, token, raw);
  }

  /**
   * Đổi refresh token lấy cặp token mới và vô hiệu token cũ (rotation).
   * Nếu token đã bị đổi rồi mà vẫn bị dùng lại, coi như bị đánh cắp:
   * thu hồi cả family để cả kẻ trộm lẫn chủ thật đều phải đăng nhập lại.
   */
  async rotate(raw: string, meta: ClientMeta): Promise<AuthResult> {
    const current = await this.repo.findOne({
      where: { tokenHash: this.hash(raw) },
      relations: { user: true },
    });
    if (!current) throw new UnauthorizedException(INVALID_SESSION);

    if (current.revokedAt) {
      if (current.revokedReason === 'rotated') {
        await this.revokeFamily(current.familyId, 'reuse_detected');
        this.logger.warn(
          `Refresh token reuse detected: user=${current.userId} family=${current.familyId} ip=${meta.ip}`,
        );
      }
      throw new UnauthorizedException(INVALID_SESSION);
    }
    if (current.expiresAt <= new Date()) {
      throw new UnauthorizedException(INVALID_SESSION);
    }

    // "Giành" token bằng một UPDATE có điều kiện: nếu hai request cùng xoay một token,
    // chỉ một request thắng (affected = 1), request kia bị coi là dùng lại.
    const claimed = await this.repo.update(
      { id: current.id, revokedAt: IsNull() },
      {
        revokedAt: new Date(),
        revokedReason: 'rotated',
        lastUsedAt: new Date(),
      },
    );
    if (claimed.affected !== 1) {
      await this.revokeFamily(current.familyId, 'reuse_detected');
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const { token, raw: nextRaw } = await this.insertToken(
      current.userId,
      current.familyId,
      current.startedAt,
      meta,
    );
    await this.repo.update(current.id, { replacedById: token.id });
    return this.buildResult(current.user, token, nextRaw);
  }

  private async revokeFamily(familyId: string, reason: RevokeReason) {
    await this.repo.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date(), revokedReason: reason },
    );
  }

  /** Đăng xuất phiên hiện tại (theo cookie). Không báo lỗi nếu token không tồn tại. */
  async revokeByRaw(raw: string): Promise<void> {
    const row = await this.repo.findOne({
      where: { tokenHash: this.hash(raw) },
    });
    if (row && !row.revokedAt) await this.revokeFamily(row.familyId, 'logout');
  }

  async revokeAllForUser(
    userId: string,
    reason: RevokeReason,
    exceptSessionId?: string,
  ): Promise<void> {
    await this.repo.update(
      {
        userId,
        revokedAt: IsNull(),
        ...(exceptSessionId ? { id: Not(exceptSessionId) } : {}),
      },
      { revokedAt: new Date(), revokedReason: reason },
    );
  }

  async listSessions(userId: string, currentSessionId: string) {
    const rows = await this.repo.find({
      where: { userId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { startedAt: 'DESC' },
    });
    return rows.map((row) => ({
      id: row.id,
      current: row.id === currentSessionId,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      startedAt: row.startedAt,
      lastActiveAt: row.createdAt,
      expiresAt: row.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const row = await this.repo.findOne({
      where: { id: sessionId, userId, revokedAt: IsNull() },
    });
    if (!row) throw new NotFoundException('Không tìm thấy phiên');
    await this.revokeFamily(row.familyId, 'revoked_by_user');
  }
}
