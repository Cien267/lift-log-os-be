import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UpdateBodyMeasurementDto } from './dto/update-body-measurement';
import { CreateBodyMeasurementDto } from './dto/create-body-measurement';
import { InjectRepository } from '@nestjs/typeorm';
import { BodyMeasurement } from './entities/body-measurement.entity';
import { Repository } from 'typeorm';
import { BodyMeasurementView } from './body-view';
import { randomUUID } from 'crypto';
import { isUniqueViolation } from '../../common/database/unique-violation';

@Injectable()
export class BodyService {
  constructor(
    @InjectRepository(BodyMeasurement)
    private readonly repo: Repository<BodyMeasurement>,
  ) {}

  async getMeasurement(
    userId: string,
    id?: string,
  ): Promise<BodyMeasurementView> {
    let row: BodyMeasurement | null;
    if (id) {
      row = await this.repo.findOneBy({ userId, id });
    } else {
      row = await this.repo.findOneBy({ userId });
    }
    if (!row)
      throw new NotFoundException('Không tìm thấy dữ liệu đo lường cơ thể');
    return this.toView(row);
  }

  async createMeasurement(
    userId: string,
    dto: CreateBodyMeasurementDto,
  ): Promise<BodyMeasurementView> {
    const id = dto.id ?? randomUUID();
    try {
      await this.repo.insert({ ...dto, id, userId });
    } catch (error) {
      this.rethrowConflict(error);
    }
    return this.getMeasurement(userId, id);
  }

  async updateMeasurement(
    userId: string,
    id: string,
    dto: UpdateBodyMeasurementDto,
  ): Promise<BodyMeasurementView> {
    const row = await this.repo.findOneBy({ userId, id });
    if (!row)
      throw new NotFoundException('Không tìm thấy dữ liệu đo lường cơ thể');
    try {
      await this.repo.update({ userId, id }, dto);
    } catch (error) {
      this.rethrowConflict(error);
    }
    return this.getMeasurement(userId, id);
  }

  async deleteMeasurement(userId: string, id: string) {
    const row = await this.repo.findOneBy({ userId, id });
    if (!row)
      throw new NotFoundException('Không tìm thấy dữ liệu đo lường cơ thể');
    await this.repo.delete({ userId, id });
  }

  private toView(row: BodyMeasurement): BodyMeasurementView {
    return {
      id: row.id,
      userId: row.userId,
      weight: row.weight,
      height: row.height,
      bodyFat: row.bodyFat,
      chest: row.chest,
      waist: row.waist,
      arm: row.arm,
      thigh: row.thigh,
      shoulder: row.shoulder,
      hip: row.hip,
      notes: row.notes,
      date: row.date,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private rethrowConflict(error: unknown): never {
    if (isUniqueViolation(error)) {
      throw new ConflictException('Bài tập đã tồn tại (trùng id hoặc tên)');
    }
    throw error;
  }
}
