import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/forge.enums';
import { Paginated, paginated } from '../../common/pagination/pagination';
import { TokensService } from '../auth/tokens.service';
import { AuthUser } from '../auth/types/auth.types';
import { User } from '../users/entities/user.entity';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

export interface AdminUserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  locked: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

/** Escape ký tự đặc biệt của LIKE để "100%" được tìm đúng nghĩa thay vì khớp mọi thứ. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly tokens: TokensService,
  ) {}

  async list(query: ListUsersQueryDto): Promise<Paginated<AdminUserView>> {
    const qb = this.repo.createQueryBuilder('user');

    const q = query.q?.trim();
    if (q) {
      qb.andWhere('(user.email ILIKE :q OR user.name ILIKE :q)', {
        q: `%${escapeLike(q)}%`,
      });
    }
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });

    const [rows, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'ASC') // thứ tự ổn định để các trang không trùng/sót
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return paginated(
      rows.map((row) => this.toView(row)),
      total,
      query.page,
      query.limit,
    );
  }

  async get(id: string): Promise<AdminUserView> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return this.toView(user);
  }

  async changeRole(
    actor: AuthUser,
    targetId: string,
    role: UserRole,
  ): Promise<AdminUserView> {
    if (actor.userId === targetId) {
      throw new ForbiddenException(
        'Không thể tự thay đổi vai trò của chính mình',
      );
    }

    const previous = await this.dataSource.transaction(async (manager) => {
      // Tuần tự hóa mọi thay đổi vai trò: nếu hai admin cùng lúc gỡ quyền của nhau,
      // yêu cầu thứ hai sẽ thấy trạng thái đã cập nhật thay vì cùng nhìn thấy "còn 2 admin".
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'users:role-change',
      ]);

      // Kiểm tra lại người thực hiện bên trong transaction: guard đã chạy trước đó,
      // lúc này họ có thể vừa bị gỡ quyền bởi một admin khác.
      const currentActor = await manager.findOneBy(User, { id: actor.userId });
      if (currentActor?.role !== UserRole.Admin) {
        throw new ForbiddenException(
          'Bạn không có quyền thực hiện thao tác này',
        );
      }

      const target = await manager.findOneBy(User, { id: targetId });
      if (!target) throw new NotFoundException('Không tìm thấy người dùng');
      if (target.role === role) return role; // không có gì thay đổi

      if (target.role === UserRole.Admin) {
        const admins = await manager.countBy(User, { role: UserRole.Admin });
        if (admins <= 1) {
          throw new ConflictException('Không thể gỡ quyền của admin cuối cùng');
        }
      }

      await manager.update(User, targetId, { role });
      return target.role;
    });

    if (previous !== role) {
      this.logger.warn(
        `ROLE_CHANGED actor=${actor.userId} target=${targetId} ${previous} -> ${role}`,
      );
      // Buộc đăng nhập lại để phiên và giao diện phản ánh vai trò mới.
      await this.tokens.revokeAllForUser(targetId, 'role_changed');
    }
    return this.get(targetId);
  }

  private toView(user: User): AdminUserView {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerifiedAt !== null,
      locked: user.lockedUntil !== null && user.lockedUntil > new Date(),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
