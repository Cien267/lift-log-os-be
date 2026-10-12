import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import {
  Equipment,
  ExerciseCategory,
  MuscleGroup,
} from '../../common/enums/forge.enums';
import { Paginated, paginated } from '../../common/pagination/pagination';
import { ExerciseView } from './exercise-view';
import { Exercise } from './entities/exercise.entity';
import {
  ListExercisesQueryDto,
  ExerciseScope,
} from './dto/list-exercises-query.dto';
import { MAX_CUSTOM_EXERCISES } from './constants/exercises.constants';

/** userId của chủ sở hữu; null = bài tập hệ thống. */
type Scope = string | null;

interface ExerciseFields {
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  category: ExerciseCategory;
  aliases?: string[];
  guideImage?: string | null;
  substituteIds?: string[];
}

type ExercisePatch = Partial<ExerciseFields>;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  constructor(
    @InjectRepository(Exercise) private readonly repo: Repository<Exercise>,
    private readonly dataSource: DataSource,
  ) {}

  // ================= Dành cho người dùng =================

  async list(
    userId: string,
    query: ListExercisesQueryDto,
  ): Promise<Paginated<ExerciseView>> {
    const qb = this.repo.createQueryBuilder('e');

    if (query.scope === ExerciseScope.System) qb.where('e.userId IS NULL');
    else if (query.scope === ExerciseScope.Custom)
      qb.where('e.userId = :userId', { userId });
    else qb.where('(e.userId IS NULL OR e.userId = :userId)', { userId });

    if (query.muscleGroup)
      qb.andWhere('e.muscleGroup = :muscleGroup', {
        muscleGroup: query.muscleGroup,
      });
    if (query.equipment)
      qb.andWhere('e.equipment = :equipment', { equipment: query.equipment });
    if (query.category)
      qb.andWhere('e.category = :category', { category: query.category });

    const q = query.q?.trim();
    if (q) {
      qb.andWhere(
        '(e.name ILIKE :q OR EXISTS (SELECT 1 FROM unnest(e.aliases) AS alias WHERE alias ILIKE :q))',
        { q: `%${escapeLike(q)}%` },
      );
    }

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('LOWER(e.name)', 'ASC')
      .addOrderBy('e.id', 'ASC') // thứ tự ổn định để các trang không trùng/sót
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getMany();

    const substitutes = await this.loadSubstituteIds(
      this.repo.manager,
      rows.map((r) => r.id),
    );
    return paginated(
      rows.map((row) => this.toView(row, substitutes.get(row.id) ?? [])),
      total,
      query.page,
      query.limit,
    );
  }

  async get(userId: string, id: string): Promise<ExerciseView> {
    const row = await this.repo
      .createQueryBuilder('e')
      .where('e.id = :id', { id })
      .andWhere('(e.userId IS NULL OR e.userId = :userId)', { userId })
      .getOne();
    if (!row) throw new NotFoundException('Không tìm thấy bài tập');
    return this.viewOf(row);
  }

  create(
    userId: string,
    dto: ExerciseFields & { id?: string },
  ): Promise<ExerciseView> {
    return this.createInScope(userId, dto);
  }

  update(
    userId: string,
    id: string,
    patch: ExercisePatch,
  ): Promise<ExerciseView> {
    return this.updateInScope(userId, id, patch);
  }

  remove(userId: string, id: string): Promise<void> {
    return this.removeInScope(userId, id);
  }

  // ================= Dành cho admin (bài tập hệ thống) =================

  async createSystem(
    actorId: string,
    dto: ExerciseFields & { id?: string },
  ): Promise<ExerciseView> {
    const view = await this.createInScope(null, dto);
    this.logger.warn(`SYSTEM_EXERCISE_CREATED actor=${actorId} id=${view.id}`);
    return view;
  }

  async updateSystem(
    actorId: string,
    id: string,
    patch: ExercisePatch,
  ): Promise<ExerciseView> {
    const view = await this.updateInScope(null, id, patch);
    this.logger.warn(`SYSTEM_EXERCISE_UPDATED actor=${actorId} id=${id}`);
    return view;
  }

  async removeSystem(actorId: string, id: string): Promise<void> {
    await this.removeInScope(null, id);
    this.logger.warn(`SYSTEM_EXERCISE_DELETED actor=${actorId} id=${id}`);
  }

  /**
   * Nạp (hoặc cập nhật) hàng loạt bài tập hệ thống với UUID cố định, an toàn khi chạy lại.
   * Toàn bộ nằm trong một transaction: lỗi ở bất kỳ phần tử nào thì không có gì được ghi.
   * Có hai pha vì các bài tập tham chiếu lẫn nhau qua substituteIds.
   */
  async importSystem(
    actorId: string,
    items: (ExerciseFields & { id: string })[],
  ): Promise<{ created: number; updated: number }> {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    for (const item of items) {
      this.validateCombination(
        item.muscleGroup,
        item.secondaryMuscles ?? [],
        item.category,
      );
      if (seenIds.has(item.id))
        throw new BadRequestException(`Trùng id trong danh sách: ${item.id}`);
      const lowerName = item.name.toLowerCase();
      if (seenNames.has(lowerName))
        throw new BadRequestException(
          `Trùng tên trong danh sách: ${item.name}`,
        );
      seenIds.add(item.id);
      seenNames.add(lowerName);
    }

    let created = 0;
    let updated = 0;
    try {
      await this.dataSource.transaction(async (manager) => {
        for (const item of items) {
          const existing = await manager.findOne(Exercise, {
            where: { id: item.id },
            withDeleted: true,
          });
          if (existing && existing.userId !== null) {
            throw new ConflictException(
              `Id ${item.id} đang thuộc về bài tập của một người dùng`,
            );
          }
          await this.assertUniqueName(manager, null, item.name, item.id);

          const columns = this.columnsOf(item);
          if (existing) {
            // withDeleted: bài tập hệ thống từng bị xóa mềm sẽ được khôi phục.
            await manager.update(
              Exercise,
              { id: item.id },
              { ...columns, deletedAt: null, updatedAt: new Date() },
            );
            updated++;
          } else {
            await manager.insert(Exercise, {
              id: item.id,
              userId: null,
              ...columns,
            });
            created++;
          }
        }
        for (const item of items) {
          const ids = item.substituteIds ?? [];
          await this.resolveSubstitutes(manager, ids, null, item.id);
          await this.setSubstitutes(manager, item.id, ids);
        }
      });
    } catch (error) {
      this.rethrowConflict(error);
    }

    this.logger.warn(
      `SYSTEM_EXERCISES_IMPORTED actor=${actorId} created=${created} updated=${updated}`,
    );
    return { created, updated };
  }

  // ================= Lõi dùng chung (scope = chủ sở hữu) =================

  private async createInScope(
    scope: Scope,
    dto: ExerciseFields & { id?: string },
  ): Promise<ExerciseView> {
    this.validateCombination(
      dto.muscleGroup,
      dto.secondaryMuscles ?? [],
      dto.category,
    );
    const id = dto.id ?? randomUUID();
    const substituteIds = dto.substituteIds ?? [];

    try {
      await this.dataSource.transaction(async (manager) => {
        if (scope !== null) await this.assertQuota(manager, scope);
        await this.assertUniqueName(manager, scope, dto.name);
        await this.resolveSubstitutes(manager, substituteIds, scope, id);

        // BẮT BUỘC dùng insert, không dùng save: với id do client cung cấp, save() sẽ
        // UPDATE đè lên bài tập đang tồn tại (kể cả của người khác) thay vì báo trùng.
        await manager.insert(Exercise, {
          id,
          userId: scope,
          ...this.columnsOf(dto),
        });
        await this.setSubstitutes(manager, id, substituteIds);
      });
    } catch (error) {
      this.rethrowConflict(error);
    }

    return this.viewOf(await this.repo.findOneByOrFail({ id }));
  }

  private async updateInScope(
    scope: Scope,
    id: string,
    patch: ExercisePatch,
  ): Promise<ExerciseView> {
    const fields = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as ExercisePatch;
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException('Không có thông tin nào để cập nhật');
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const current = await this.findEditable(manager, scope, id);

        // Kiểm tra tổ hợp trên giá trị SAU khi gộp, không chỉ trên phần được gửi lên.
        this.validateCombination(
          fields.muscleGroup ?? current.muscleGroup,
          fields.secondaryMuscles ?? current.secondaryMuscles,
          fields.category ?? current.category,
        );

        if (
          fields.name !== undefined &&
          fields.name.toLowerCase() !== current.name.toLowerCase()
        ) {
          await this.assertUniqueName(manager, scope, fields.name, id);
        }
        if (fields.substituteIds !== undefined) {
          await this.resolveSubstitutes(
            manager,
            fields.substituteIds,
            scope,
            id,
          );
          await this.setSubstitutes(manager, id, fields.substituteIds);
        }

        const { substituteIds: _ignored, ...columns } = fields;
        // Luôn đặt updatedAt để việc đổi riêng danh sách thay thế cũng được đồng bộ.
        await manager.update(
          Exercise,
          { id },
          { ...columns, updatedAt: new Date() },
        );
      });
    } catch (error) {
      this.rethrowConflict(error);
    }

    return this.viewOf(await this.repo.findOneByOrFail({ id }));
  }

  private async removeInScope(scope: Scope, id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.findEditable(manager, scope, id);
      // Xóa mềm: lịch sử tập luyện vẫn tham chiếu được, và client biết bài tập đã bị xóa khi đồng bộ.
      await manager.softDelete(Exercise, { id });
    });
  }

  // ================= Hàm phụ =================

  /** Tìm bài tập mà `scope` được phép sửa/xóa, và phân biệt đúng loại lỗi. */
  private async findEditable(
    manager: EntityManager,
    scope: Scope,
    id: string,
  ): Promise<Exercise> {
    const row = await manager.findOneBy(Exercise, { id });
    if (!row) throw new NotFoundException('Không tìm thấy bài tập');

    if (scope === null) {
      // Endpoint admin chỉ đụng tới bài tập hệ thống; bài của user coi như không tồn tại.
      if (row.userId !== null)
        throw new NotFoundException('Không tìm thấy bài tập');
      return row;
    }
    if (row.userId === null) {
      throw new ForbiddenException('Không thể sửa hoặc xóa bài tập hệ thống');
    }
    // Bài tập của người khác: trả 404 để không lộ sự tồn tại.
    if (row.userId !== scope)
      throw new NotFoundException('Không tìm thấy bài tập');
    return row;
  }

  private validateCombination(
    muscleGroup: MuscleGroup,
    secondaryMuscles: MuscleGroup[],
    category: ExerciseCategory,
  ): void {
    if (secondaryMuscles.includes(muscleGroup)) {
      throw new BadRequestException(
        'Nhóm cơ phụ không được trùng nhóm cơ chính',
      );
    }
    // Giả định về dữ liệu của Forge: cardio được theo dõi theo thời lượng và dùng nhóm cơ "cardio".
    // Nếu app thật không theo quy ước này, hãy xóa kiểm tra bên dưới.
    if (
      category === ExerciseCategory.Cardio &&
      muscleGroup !== MuscleGroup.Cardio
    ) {
      throw new BadRequestException(
        'Bài tập cardio phải có nhóm cơ chính là "cardio"',
      );
    }
  }

  private async assertQuota(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    const count = await manager.countBy(Exercise, { userId });
    if (count >= MAX_CUSTOM_EXERCISES) {
      throw new ForbiddenException(
        `Bạn đã đạt giới hạn ${MAX_CUSTOM_EXERCISES} bài tập tự tạo`,
      );
    }
  }

  /**
   * Tên là duy nhất trong từng phạm vi (hệ thống / từng user), không phân biệt hoa thường.
   * Index của DB chỉ chặn trùng tên chính xác; đây là lớp kiểm tra thân thiện bên trên.
   */
  private async assertUniqueName(
    manager: EntityManager,
    scope: Scope,
    name: string,
    ignoreId?: string,
  ): Promise<void> {
    const qb = manager
      .createQueryBuilder(Exercise, 'e')
      .where('LOWER(e.name) = LOWER(:name)', { name });
    if (scope === null) qb.andWhere('e.userId IS NULL');
    else qb.andWhere('e.userId = :scope', { scope });
    if (ignoreId) qb.andWhere('e.id <> :ignoreId', { ignoreId });

    if (await qb.getExists())
      throw new ConflictException('Đã có bài tập trùng tên');
  }

  /** Mọi bài thay thế phải tồn tại và nằm trong phạm vi mà chủ sở hữu được phép dùng. */
  private async resolveSubstitutes(
    manager: EntityManager,
    ids: string[],
    scope: Scope,
    selfId: string,
  ): Promise<void> {
    if (ids.length === 0) return;
    if (ids.includes(selfId)) {
      throw new BadRequestException('Bài tập không thể tự thay thế chính nó');
    }

    const qb = manager
      .createQueryBuilder(Exercise, 'e')
      .select('e.id')
      .where('e.id IN (:...ids)', { ids });
    // Bài hệ thống chỉ được thay thế bằng bài hệ thống; bài của user dùng được bài hệ thống + bài của chính họ.
    if (scope === null) qb.andWhere('e.userId IS NULL');
    else qb.andWhere('(e.userId IS NULL OR e.userId = :scope)', { scope });

    const found = await qb.getMany();
    if (found.length !== new Set(ids).size) {
      throw new BadRequestException(
        'Có bài tập thay thế không tồn tại hoặc bạn không có quyền sử dụng',
      );
    }
  }

  private async setSubstitutes(
    manager: EntityManager,
    id: string,
    ids: string[],
  ): Promise<void> {
    const rows: { substitute_id: string }[] = await manager.query(
      'SELECT substitute_id FROM exercise_substitutes WHERE exercise_id = $1',
      [id],
    );
    const current = rows.map((row) => row.substitute_id);
    const toAdd = ids.filter((value) => !current.includes(value));
    const toRemove = current.filter((value) => !ids.includes(value));
    if (toAdd.length === 0 && toRemove.length === 0) return;

    await manager
      .createQueryBuilder()
      .relation(Exercise, 'substitutes')
      .of(id)
      .addAndRemove(toAdd, toRemove);
  }

  /** Lấy substituteIds cho nhiều bài tập bằng một truy vấn, bỏ qua các bài thay thế đã bị xóa. */
  private async loadSubstituteIds(
    manager: EntityManager,
    ids: string[],
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>(ids.map((id) => [id, []]));
    if (ids.length === 0) return map;

    const rows: { exercise_id: string; substitute_id: string }[] =
      await manager.query(
        `SELECT s.exercise_id, s.substitute_id
         FROM exercise_substitutes s
         JOIN exercises e ON e.id = s.substitute_id
        WHERE s.exercise_id = ANY($1::uuid[]) AND e.deleted_at IS NULL
        ORDER BY lower(e.name), e.id`,
        [ids],
      );
    for (const row of rows) map.get(row.exercise_id)?.push(row.substitute_id);
    return map;
  }

  private columnsOf(fields: ExerciseFields) {
    return {
      name: fields.name,
      muscleGroup: fields.muscleGroup,
      secondaryMuscles: fields.secondaryMuscles ?? [],
      equipment: fields.equipment,
      category: fields.category,
      aliases: fields.aliases ?? [],
      guideImage: fields.guideImage ?? null,
    };
  }

  private rethrowConflict(error: unknown): never {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string })?.code === '23505'
    ) {
      throw new ConflictException('Bài tập đã tồn tại (trùng id hoặc tên)');
    }
    throw error;
  }

  private async viewOf(row: Exercise): Promise<ExerciseView> {
    const substitutes = await this.loadSubstituteIds(this.repo.manager, [
      row.id,
    ]);
    return this.toView(row, substitutes.get(row.id) ?? []);
  }

  private toView(row: Exercise, substituteIds: string[]): ExerciseView {
    return {
      id: row.id,
      name: row.name,
      muscleGroup: row.muscleGroup,
      secondaryMuscles: row.secondaryMuscles,
      equipment: row.equipment,
      category: row.category,
      aliases: row.aliases,
      guideImage: row.guideImage,
      substituteIds,
      custom: row.userId !== null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
