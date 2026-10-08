import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import {
  INVALID_CREDENTIALS,
  INVALID_SESSION,
} from './constants/auth.constants';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { TokensService } from './tokens.service';
import { AuthResult, AuthUser, ClientMeta } from './types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokensService,
  ) {}

  async register(dto: RegisterDto, meta: ClientMeta): Promise<AuthResult> {
    const password = await this.passwords.hash(dto.password);
    const user = await this.users.createWithSettings({
      email: dto.email,
      name: dto.name,
      password,
    });
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
  }

  listSessions(auth: AuthUser) {
    return this.tokens.listSessions(auth.userId, auth.sessionId);
  }

  revokeSession(auth: AuthUser, sessionId: string): Promise<void> {
    return this.tokens.revokeSession(auth.userId, sessionId);
  }
}
