import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  INVALID_CREDENTIALS,
  INVALID_SESSION,
} from './constants/auth.constants';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthTokenType } from './entities/auth-token.entity';
import { OneTimeTokensService } from './one-time-tokens.service';
import { PasswordService } from './password.service';
import { TokensService } from './tokens.service';
import { AuthResult, AuthUser, ClientMeta } from './types/auth.types';

type Recipient = Pick<User, 'id' | 'email' | 'name'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokensService,
    private readonly oneTime: OneTimeTokensService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, meta: ClientMeta): Promise<AuthResult> {
    const password = await this.passwords.hash(dto.password);
    const user = await this.users.createWithSettings({
      email: dto.email,
      name: dto.name,
      password,
    });
    void this.sendVerificationEmail(user);
    return this.tokens.createSession(user, meta);
  }

  async login(dto: LoginDto, meta: ClientMeta): Promise<AuthResult> {
    const user = await this.users.findByEmailForAuth(dto.email);

    if (!user) {
      await this.passwords.verifyDummy(dto.password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.logger.warn(`Login blocked (locked): user=${user.id} ip=${meta.ip}`);
      throw new HttpException(
        'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Hãy thử lại sau.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const valid = await this.passwords.verify(user.password, dto.password);
    if (!valid) {
      await this.users.registerFailedLogin(user.id);
      this.logger.warn(`Login failed: user=${user.id} ip=${meta.ip}`);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.users.registerSuccessfulLogin(user.id);
    if (this.passwords.needsRehash(user.password)) {
      await this.users.setPassword(
        user.id,
        await this.passwords.hash(dto.password),
      );
    }
    return this.tokens.createSession(user, meta);
  }

  refresh(
    rawRefreshToken: string | undefined,
    meta: ClientMeta,
  ): Promise<AuthResult> {
    if (!rawRefreshToken) throw new UnauthorizedException(INVALID_SESSION);
    return this.tokens.rotate(rawRefreshToken, meta);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) await this.tokens.revokeByRaw(rawRefreshToken);
  }

  logoutAll(userId: string): Promise<void> {
    return this.tokens.revokeAllForUser(userId, 'logout_all');
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException(INVALID_SESSION);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerifiedAt !== null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async changePassword(auth: AuthUser, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findByIdForAuth(auth.userId);
    if (!user) throw new UnauthorizedException(INVALID_SESSION);

    const valid = await this.passwords.verify(
      user.password,
      dto.currentPassword,
    );
    if (!valid) throw new BadRequestException('Mật khẩu hiện tại không đúng');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    await this.users.setPassword(
      user.id,
      await this.passwords.hash(dto.newPassword),
    );
    // Mọi thiết bị khác phải đăng nhập lại; phiên hiện tại được giữ.
    await this.tokens.revokeAllForUser(
      user.id,
      'password_changed',
      auth.sessionId,
    );
    // Liên kết đặt lại mật khẩu đã gửi trước đó không còn hợp lệ.
    await this.oneTime.invalidateAll(user.id, AuthTokenType.PasswordReset);
  }

  listSessions(auth: AuthUser) {
    return this.tokens.listSessions(auth.userId, auth.sessionId);
  }

  revokeSession(auth: AuthUser, sessionId: string): Promise<void> {
    return this.tokens.revokeSession(auth.userId, sessionId);
  }

  // ---- Xác minh email ----

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const userId = await this.oneTime.consume(
      dto.token,
      AuthTokenType.EmailVerification,
    );
    await this.users.markEmailVerified(userId);
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || user.emailVerifiedAt) return;
    void this.sendVerificationEmail(user);
  }

  // ---- Quên / đặt lại mật khẩu ----

  /**
   * Luôn trả về như nhau dù email có tồn tại hay không. Toàn bộ công việc (tra user,
   * tạo token, gửi mail) chạy nền sau khi đã phản hồi, nên cả nội dung lẫn thời gian
   * phản hồi đều không tiết lộ email nào đã đăng ký.
   */
  forgotPassword(dto: ForgotPasswordDto): void {
    void this.sendPasswordResetEmail(dto.email);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const userId = await this.oneTime.consume(
      dto.token,
      AuthTokenType.PasswordReset,
    );
    const hash = await this.passwords.hash(dto.newPassword);

    await this.users.resetPassword(userId, hash);
    await this.tokens.revokeAllForUser(userId, 'password_changed');
    await this.oneTime.invalidateAll(userId, AuthTokenType.PasswordReset);

    void this.sendPasswordChangedNotice(userId);
  }

  // ---- Gửi email (chạy nền, không bao giờ làm request thất bại) ----

  private link(path: string, token: string): string {
    const base = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');
    return `${base}${path}?token=${encodeURIComponent(token)}`;
  }

  private async sendVerificationEmail(user: Recipient): Promise<void> {
    try {
      const raw = await this.oneTime.issue(
        user.id,
        AuthTokenType.EmailVerification,
      );
      if (!raw) return;
      await this.mail.sendVerificationEmail(
        user,
        this.link('/verify-email', raw),
        this.config.getOrThrow<number>('EMAIL_VERIFICATION_TTL_HOURS'),
      );
    } catch (error) {
      this.logger.error(`Gửi email xác minh thất bại: user=${user.id}`, error);
    }
  }

  private async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const user = await this.users.findByEmail(email);
      if (!user) return;
      const raw = await this.oneTime.issue(
        user.id,
        AuthTokenType.PasswordReset,
      );
      if (!raw) return;
      await this.mail.sendPasswordResetEmail(
        user,
        this.link('/reset-password', raw),
        this.config.getOrThrow<number>('PASSWORD_RESET_TTL_MINUTES'),
      );
    } catch (error) {
      this.logger.error('Gửi email đặt lại mật khẩu thất bại', error);
    }
  }

  private async sendPasswordChangedNotice(userId: string): Promise<void> {
    try {
      const user = await this.users.findById(userId);
      if (user) await this.mail.sendPasswordChangedNotice(user);
    } catch (error) {
      this.logger.error(
        `Gửi thông báo đổi mật khẩu thất bại: user=${userId}`,
        error,
      );
    }
  }
}
