import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { isUniqueViolation } from '../../common/database/unique-violation';
import { Paginated, paginated } from '../../common/pagination/pagination';
import { ExercisesService } from '../exercises/exercises.service';
import { MAX_TEMPLATES_PER_USER } from './constants/templates.constants';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ListTemplatesQueryDto } from './dto/list-templates-query.dto';
import { TemplateExerciseInputDto } from './dto/template-exercise-input.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateExercise } from './entities/template-exercise.entity';
import { WorkoutTemplate } from './entities/workout-template.entity';
import { TemplateExerciseView, TemplateView } from './template-view';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(WorkoutTemplate)
    private readonly repo: Repository<WorkoutTemplate>,
    private readonly dataSource: DataSource,
    private readonly exercises: ExercisesService,
  ) {}

  async list(
    userId: string,
    query: ListTemplatesQueryDto,
  ): Promise<Paginated<TemplateView>> {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId });
    if (query.location)
      qb.andWhere('t.location = :location', { location: query.location });

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('t.position', 'ASC')
      .addOrderBy('t.createdAt', 'ASC')
      .addOrderBy('t.id', 'ASC')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getMany();

    const children = await this.loadExercises(
      this.repo.manager,
      rows.map((row) => row.id),
    );
    return paginated(
      rows.map((row) => this.toView(row, children.get(row.id) ?? [])),
      total,
      query.page,
      query.limit,
    );
  }

  async get(userId: string, id: string): Promise<TemplateView> {
    const row = await this.repo.findOneBy({ id, userId });
    if (!row) throw new NotFoundException('Không tìm thấy template');
    const children = await this.loadExercises(this.repo.manager, [row.id]);
    return this.toView(row, children.get(row.id) ?? []);
  }

  async create(userId: string, dto: CreateTemplateDto): Promise<TemplateView> {
    this.validateExercises(dto.exercises);
    const id = dto.id ?? randomUUID();

    try {
      await this.dataSource.transaction(async (manager) => {
        const count = await manager.countBy(WorkoutTemplate, { userId });
        if (count >= MAX_TEMPLATES_PER_USER) {
          throw new ForbiddenException(
            `Bạn đã đạt giới hạn ${MAX_TEMPLATES_PER_USER} template`,
          );
        }
        await this.exercises.findReferencable(
          manager,
          userId,
          dto.exercises.map((item) => item.exerciseId),
        );

        // BẮT BUỘC dùng insert, không dùng save: id do client gửi + save() sẽ UPDATE đè
        // lên template đang tồn tại của người khác thay vì báo trùng.
        await manager.insert(WorkoutTemplate, {
          id,
          userId,
          name: dto.name,
          description: dto.description ?? null,
          location: dto.location,
          position: dto.position ?? count,
        });
        await this.insertExercises(manager, userId, id, dto.exercises);
      });
    } catch (error) {
      this.rethrowConflict(error);
    }
    return this.get(userId, id);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<TemplateView> {
    const fields = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as UpdateTemplateDto;
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException('Không có thông tin nào để cập nhật');
    }

    await this.dataSource.transaction(async (manager) => {
      // Khóa dòng template để hai lần cập nhật đồng thời không xen kẽ nhau.
      const current = await manager.findOne(WorkoutTemplate, {
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current) throw new NotFoundException('Không tìm thấy template');

      if (fields.exercises !== undefined) {
        this.validateExercises(fields.exercises);
        await this.exercises.findReferencable(
          manager,
          userId,
          fields.exercises.map((item) => item.exerciseId),
        );
        // Danh sách bài tập là một phần của template (như mảng nhúng trong Dexie): thay cả khối.
        await manager.delete(TemplateExercise, { templateId: id });
        await this.insertExercises(manager, userId, id, fields.exercises);
      }

      const { exercises: _ignored, ...columns } = fields;
      await manager.update(
        WorkoutTemplate,
        { id },
        { ...columns, updatedAt: new Date() },
      );
    });
    return this.get(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const current = await manager.findOne(WorkoutTemplate, {
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current) throw new NotFoundException('Không tìm thấy template');

      await manager.softDelete(WorkoutTemplate, { id });
      // Các dòng con cũng được đánh dấu xóa để dữ liệu nhất quán với bản ghi cha.
      await manager.query(
        `UPDATE template_exercises SET deleted_at = now(), updated_at = now()
          WHERE template_id = $1 AND deleted_at IS NULL`,
        [id],
      );
    });
  }

  // ---- hàm phụ ----

  private validateExercises(items: TemplateExerciseInputDto[]): void {
    items.forEach((item, index) => {
      if (
        item.targetRepsMin != null &&
        item.targetRepsMax != null &&
        item.targetRepsMin > item.targetRepsMax
      ) {
        throw new BadRequestException(
          `exercises[${index}]: targetRepsMin không được lớn hơn targetRepsMax`,
        );
      }
    });
  }

  private async insertExercises(
    manager: EntityManager,
    userId: string,
    templateId: string,
    items: TemplateExerciseInputDto[],
  ): Promise<void> {
    if (items.length === 0) return;
    await manager.insert(
      TemplateExercise,
      items.map((item, index) => ({
        id: randomUUID(),
        userId,
        templateId,
        exerciseId: item.exerciseId,
        position: index, // vị trí trong mảng là nguồn sự thật, không có khoảng trống hay trùng
        targetSets: item.targetSets,
        targetRepsMin: item.targetRepsMin ?? null,
        targetRepsMax: item.targetRepsMax ?? null,
        restPreset: item.restPreset ?? null,
        supersetGroup: item.supersetGroup ?? null,
      })),
    );
  }

  private async loadExercises(
    manager: EntityManager,
    templateIds: string[],
  ): Promise<Map<string, TemplateExerciseView[]>> {
    const map = new Map<string, TemplateExerciseView[]>(
      templateIds.map((id) => [id, []]),
    );
    if (templateIds.length === 0) return map;

    const rows = await manager.find(TemplateExercise, {
      where: { templateId: In(templateIds) },
      order: { position: 'ASC', id: 'ASC' },
    });
    for (const row of rows) {
      map.get(row.templateId)?.push({
        id: row.id,
        exerciseId: row.exerciseId,
        position: row.position,
        targetSets: row.targetSets,
        targetRepsMin: row.targetRepsMin,
        targetRepsMax: row.targetRepsMax,
        restPreset: row.restPreset,
        supersetGroup: row.supersetGroup,
      });
    }
    return map;
  }

  private rethrowConflict(error: unknown): never {
    if (isUniqueViolation(error))
      throw new ConflictException('Template đã tồn tại (trùng id)');
    throw error;
  }

  private toView(
    row: WorkoutTemplate,
    exercises: TemplateExerciseView[],
  ): TemplateView {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      location: row.location,
      position: row.position,
      exercises,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
