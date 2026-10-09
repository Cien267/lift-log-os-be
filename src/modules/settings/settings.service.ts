import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserSettings } from './entities/user-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly repo: Repository<UserSettings>,
  ) {}

  async get(userId: string) {
    return this.toResponse(await this.findOrCreate(userId));
  }

  async update(userId: string, dto: UpdateSettingsDto) {
    // Chỉ giữ các field client thật sự gửi lên (undefined = không đổi).
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as Partial<UpdateSettingsDto>;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('Không có thiết lập nào để cập nhật');
    }

    await this.findOrCreate(userId);
    await this.repo.update({ userId }, patch);
    return this.get(userId);
  }

  /**
   * Mỗi user luôn có đúng một dòng settings (được tạo lúc đăng ký). Hàm này đảm bảo thêm
   * cho trường hợp dòng bị thiếu; ON CONFLICT DO NOTHING giúp hai request đồng thời
   * không đụng nhau ở khóa chính.
   */
  private async findOrCreate(userId: string): Promise<UserSettings> {
    const existing = await this.repo.findOneBy({ userId });
    if (existing) return existing;

    await this.repo
      .createQueryBuilder()
      .insert()
      .values({ userId })
      .orIgnore()
      .execute();
    return this.repo.findOneByOrFail({ userId });
  }

  /** Chỉ trả những gì client cần, không phơi nguyên entity ra ngoài. */
  private toResponse(settings: UserSettings) {
    return {
      unit: settings.unit,
      theme: settings.theme,
      language: settings.language,
      defaultRest: settings.defaultRest,
      notificationsEnabled: settings.notificationsEnabled,
      availableEquipment: settings.availableEquipment,
      weeklyGoal: settings.weeklyGoal,
      targetWeight: settings.targetWeight,
      trainingAssistant: settings.trainingAssistant,
      updatedAt: settings.updatedAt,
    };
  }
}
