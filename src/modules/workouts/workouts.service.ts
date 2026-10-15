import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { dbValues } from '../../common/database/db-values';
import { isUniqueViolation } from '../../common/database/unique-violation';
import { Paginated, paginated } from '../../common/pagination/pagination';
import { Exercise } from '../exercises/entities/exercise.entity';
import { ExercisesService } from '../exercises/exercises.service';
import { WorkoutTemplate } from '../templates/entities/workout-template.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import {
  ListWorkoutsQueryDto,
  WorkoutStatus,
} from './dto/list-workouts-query.dto';
import { ReplaceWorkoutDto } from './dto/replace-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutExerciseInputDto } from './dto/workout-exercise-input.dto';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { WorkoutSet } from './entities/workout-set.entity';
import { Workout } from './entities/workout.entity';
import {
  assertInsightSize,
  assertPlausibleTimestamp,
  assertValidTimes,
  assertValidWorkoutDate,
  computeTotals,
  isCardioExercise,
  isRealCalendarDate,
  roundTo,
  TotalsInput,
} from './workout-rules';
import {
  LastPerformanceView,
  WorkoutExerciseView,
  WorkoutSetView,
  WorkoutSummary,
  WorkoutView,
} from './workout-view';

interface DesiredExercise {
  id: string;
  exerciseId: string;
  position: number;
  restPreset: number | null;
  notes: string | null;
  supersetGroup: number | null;
  targetSets: number | null;
}

interface DesiredSet {
  id: string;
  workoutExerciseId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  durationMin: number | null;
  rir: number | null;
  rpe: number | null;
  restTime: number | null;
  completed: boolean;
  isWarmup: boolean;
  notes: string | null;
  performedAt: Date;
}

interface DesiredTree {
  exercises: DesiredExercise[];
  sets: DesiredSet[];
  totals: { totalVolume: number; totalCardioMin: number };
}

type WorkoutBody = Pick<
  ReplaceWorkoutDto,
  | 'name'
  | 'date'
  | 'startTime'
  | 'endTime'
  | 'durationSec'
  | 'location'
  | 'templateId'
  | 'notes'
  | 'mood'
  | 'energyLevel'
  | 'estimatedCalories'
  | 'insight'
  | 'totalVolume'
  | 'totalCardioMin'
>;

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Workout) private readonly repo: Repository<Workout>,
    private readonly dataSource: DataSource,
    private readonly exercises: ExercisesService,
  ) {}

  // ================= Đọc =================

  async list(
    userId: string,
    query: ListWorkoutsQueryDto,
  ): Promise<Paginated<WorkoutSummary>> {
    if (query.from && !isRealCalendarDate(query.from))
      throw new BadRequestException('from không phải ngày hợp lệ');
    if (query.to && !isRealCalendarDate(query.to))
      throw new BadRequestException('to không phải ngày hợp lệ');
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('from không được lớn hơn to');
    }

    const qb = this.repo
      .createQueryBuilder('w')
      .where('w.userId = :userId', { userId });
    if (query.from) qb.andWhere('w.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('w.date <= :to', { to: query.to });
    if (query.location)
      qb.andWhere('w.location = :location', { location: query.location });
    if (query.templateId)
      qb.andWhere('w.templateId = :templateId', {
        templateId: query.templateId,
      });
    if (query.status === WorkoutStatus.Active) qb.andWhere('w.endTime IS NULL');
    if (query.status === WorkoutStatus.Finished)
      qb.andWhere('w.endTime IS NOT NULL');

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('w.date', 'DESC')
      .addOrderBy('w.startTime', 'DESC')
      .addOrderBy('w.id', 'ASC')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getMany();

    const counts = await this.loadCounts(rows.map((row) => row.id));
    return paginated(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        durationSec: row.durationSec,
        location: row.location,
        templateId: row.templateId,
        mood: row.mood,
        energyLevel: row.energyLevel,
        totalVolume: row.totalVolume,
        totalCardioMin: row.totalCardioMin,
        estimatedCalories: row.estimatedCalories,
        exerciseCount: counts.get(row.id)?.exercises ?? 0,
        setCount: counts.get(row.id)?.sets ?? 0,
        completedSetCount: counts.get(row.id)?.completedSets ?? 0,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      total,
      query.page,
      query.limit,
    );
  }

  async get(userId: string, id: string): Promise<WorkoutView> {
    const workout = await this.repo.findOneBy({ id, userId });
    if (!workout) throw new NotFoundException('Không tìm thấy buổi tập');

    const manager = this.repo.manager;
    const exerciseRows = await manager.find(WorkoutExercise, {
      where: { workoutId: id },
      order: { position: 'ASC', id: 'ASC' },
    });
    const setRows = exerciseRows.length
      ? await manager.find(WorkoutSet, {
          where: { workoutExerciseId: In(exerciseRows.map((row) => row.id)) },
          order: { performedAt: 'ASC', id: 'ASC' },
        })
      : [];

    // Lấy tên cả những bài đã bị xóa mềm để lịch sử vẫn đọc được.
    const exerciseIds = [...new Set(exerciseRows.map((row) => row.exerciseId))];
    const names = new Map<string, string>();
    if (exerciseIds.length > 0) {
      const found = await manager
        .createQueryBuilder(Exercise, 'e')
        .withDeleted()
        .select(['e.id', 'e.name'])
        .where('e.id IN (:...exerciseIds)', { exerciseIds })
        .getMany();
      found.forEach((row) => names.set(row.id, row.name));
    }

    const setsByExercise = new Map<string, WorkoutSetView[]>();
    for (const set of setRows) {
      const list = setsByExercise.get(set.workoutExerciseId) ?? [];
      list.push(this.toSetView(set));
      setsByExercise.set(set.workoutExerciseId, list);
    }

    const exercises: WorkoutExerciseView[] = exerciseRows.map((row) => ({
      id: row.id,
      exerciseId: row.exerciseId,
      exerciseName: names.get(row.exerciseId) ?? '',
      position: row.position,
      restPreset: row.restPreset,
      notes: row.notes,
      supersetGroup: row.supersetGroup,
      targetSets: row.targetSets,
      sets: setsByExercise.get(row.id) ?? [],
    }));

    return {
      id: workout.id,
      name: workout.name,
      date: workout.date,
      startTime: workout.startTime,
      endTime: workout.endTime,
      durationSec: workout.durationSec,
      location: workout.location,
      templateId: workout.templateId,
      notes: workout.notes,
      mood: workout.mood,
      energyLevel: workout.energyLevel,
      totalVolume: workout.totalVolume,
      totalCardioMin: workout.totalCardioMin,
      estimatedCalories: workout.estimatedCalories,
      insight: workout.insight,
      exercises,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
    };
  }

  /**
   * Dữ liệu để prefill weight/reps khi tập lại một bài (tương đương getLastPerformance của front-end):
   * buổi tập gần nhất (theo startTime), khác buổi bị loại trừ, có ít nhất một set đã hoàn thành
   * và không phải khởi động; trả về đúng những set đó. Không có thì trả về workout = null.
   */
  async lastPerformance(
    userId: string,
    exerciseId: string,
    excludeWorkoutId?: string,
  ): Promise<LastPerformanceView> {
    const rows: {
      entry_id: string;
      workout_id: string;
      date: string;
      start_time: Date;
    }[] = await this.repo.manager.query(
      `SELECT we.id AS entry_id, w.id AS workout_id,
                to_char(w.date, 'YYYY-MM-DD') AS date, w.start_time
           FROM workout_exercises we
           JOIN workouts w ON w.id = we.workout_id AND w.deleted_at IS NULL
          WHERE we.user_id = $1 AND we.exercise_id = $2 AND we.deleted_at IS NULL
            AND ($3::uuid IS NULL OR w.id <> $3::uuid)
            AND EXISTS (
              SELECT 1 FROM workout_sets s
               WHERE s.workout_exercise_id = we.id AND s.completed
                 AND NOT s.is_warmup AND s.deleted_at IS NULL)
          ORDER BY w.start_time DESC, we.position ASC
          LIMIT 1`,
      [userId, exerciseId, excludeWorkoutId ?? null],
    );
    if (rows.length === 0) return { workout: null, sets: [] };

    const row = rows[0];
    const sets = await this.repo.manager.find(WorkoutSet, {
      where: {
        workoutExerciseId: row.entry_id,
        completed: true,
        isWarmup: false,
      },
      order: { performedAt: 'ASC', id: 'ASC' },
    });
    return {
      workout: {
        id: row.workout_id,
        date: row.date,
        startTime: row.start_time,
      },
      sets: sets.map((set) => this.toSetView(set)),
    };
  }

  // ================= Ghi =================

  async create(userId: string, dto: CreateWorkoutDto): Promise<WorkoutView> {
    const id = dto.id ?? randomUUID();
    this.validateBody(dto);
    this.validatePayloadIds(dto.exercises);

    try {
      await this.dataSource.transaction(async (manager) => {
        await this.assertTemplateOwned(manager, userId, dto.templateId);
        const desired = await this.prepareTree(manager, userId, dto.exercises);

        // BẮT BUỘC dùng insert, không dùng save: id (của buổi tập, bài tập, set) do client gửi,
        // save() sẽ UPDATE đè lên dữ liệu đang tồn tại của người khác thay vì báo trùng.
        await manager.insert(
          Workout,
          dbValues({
            id,
            userId,
            ...this.workoutColumns(dto),
            ...this.resolveTotals(dto, desired),
          }),
        );
        if (desired.exercises.length > 0) {
          await manager.insert(
            WorkoutExercise,
            desired.exercises.map((item) => ({
              ...item,
              userId,
              workoutId: id,
            })),
          );
        }
        if (desired.sets.length > 0) {
          await manager.insert(
            WorkoutSet,
            desired.sets.map((item) => ({ ...item, userId })),
          );
        }
      });
    } catch (error) {
      this.rethrowConflict(error);
    }
    return this.get(userId, id);
  }

  /**
   * Thay thế toàn bộ buổi tập. Bài tập và set được so khớp theo id: có trong payload thì cập nhật
   * (chỉ khi thật sự thay đổi, để không làm nhiễu updatedAt khi đồng bộ), chưa có thì thêm,
   * thiếu trong payload thì xóa mềm.
   */
  async replace(
    userId: string,
    id: string,
    dto: ReplaceWorkoutDto,
  ): Promise<WorkoutView> {
    this.validateBody(dto);
    this.validatePayloadIds(dto.exercises);

    try {
      await this.dataSource.transaction(async (manager) => {
        // Khóa dòng buổi tập: hai lần PUT đồng thời được xử lý tuần tự, không xen kẽ nhau.
        const current = await manager.findOne(Workout, {
          where: { id, userId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!current) throw new NotFoundException('Không tìm thấy buổi tập');

        await this.assertTemplateOwned(manager, userId, dto.templateId);
        const desired = await this.prepareTree(manager, userId, dto.exercises);

        const existingExercises = await manager.find(WorkoutExercise, {
          where: { workoutId: id },
        });
        const existingSets = existingExercises.length
          ? await manager.find(WorkoutSet, {
              where: {
                workoutExerciseId: In(existingExercises.map((row) => row.id)),
              },
            })
          : [];

        await this.applyTree(
          manager,
          userId,
          id,
          desired,
          existingExercises,
          existingSets,
        );
        await manager.update(
          Workout,
          { id },
          dbValues({
            ...this.workoutColumns(dto),
            ...this.resolveTotals(dto, desired),
            updatedAt: new Date(),
          }),
        );
      });
    } catch (error) {
      this.rethrowConflict(error);
    }
    return this.get(userId, id);
  }

  /** Cập nhật thông tin chung (ví dụ kết thúc buổi tập: endTime, mood...). Không đụng tới set. */
  async update(
    userId: string,
    id: string,
    dto: UpdateWorkoutDto,
  ): Promise<WorkoutView> {
    const fields = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as UpdateWorkoutDto;
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException('Không có thông tin nào để cập nhật');
    }

    await this.dataSource.transaction(async (manager) => {
      const current = await manager.findOne(Workout, {
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current) throw new NotFoundException('Không tìm thấy buổi tập');

      // Kiểm tra trên giá trị SAU khi gộp, không chỉ trên phần được gửi lên.
      const startTime = fields.startTime ?? current.startTime;
      const endTime =
        'endTime' in fields ? (fields.endTime ?? null) : current.endTime;
      if (fields.date !== undefined) assertValidWorkoutDate(fields.date);
      assertValidTimes(
        startTime,
        endTime,
        fields.durationSec ?? current.durationSec,
      );
      assertInsightSize(fields.insight);
      if (fields.templateId)
        await this.assertTemplateOwned(manager, userId, fields.templateId);

      const columns: Record<string, unknown> = { ...fields };
      if ('name' in fields) columns.name = fields.name || null;
      // Kết thúc buổi tập mà client không gửi durationSec: tự tính từ hai mốc thời gian.
      if (
        endTime &&
        !('durationSec' in fields) &&
        current.durationSec === null
      ) {
        columns.durationSec = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 1000,
        );
      }

      await manager.update(
        Workout,
        { id },
        dbValues({ ...columns, updatedAt: new Date() }),
      );
    });
    return this.get(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const current = await manager.findOne(Workout, {
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current) throw new NotFoundException('Không tìm thấy buổi tập');

      await manager.softDelete(Workout, { id });
      // Xóa mềm cả các dòng con để client nhận được tombstone nhất quán khi đồng bộ.
      await manager.query(
        `UPDATE workout_sets SET deleted_at = now(), updated_at = now()
          WHERE deleted_at IS NULL
            AND workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = $1)`,
        [id],
      );
      await manager.query(
        `UPDATE workout_exercises SET deleted_at = now(), updated_at = now()
          WHERE workout_id = $1 AND deleted_at IS NULL`,
        [id],
      );
    });
  }

  // ================= Hàm phụ =================

  /**
   * Client tự tính tổng khi kết thúc buổi tập (finishWorkout) nên giá trị đó được giữ nguyên để hai
   * bên khớp nhau. Nếu client không gửi, server tự tính từ các set theo cùng quy tắc.
   */
  private resolveTotals(dto: WorkoutBody, desired: DesiredTree) {
    return {
      totalVolume: roundTo(dto.totalVolume ?? desired.totals.totalVolume, 2),
      totalCardioMin: roundTo(
        dto.totalCardioMin ?? desired.totals.totalCardioMin,
        2,
      ),
    };
  }

  private toSetView(set: WorkoutSet): WorkoutSetView {
    return {
      id: set.id,
      weight: set.weight,
      reps: set.reps,
      durationMin: set.durationMin,
      rir: set.rir,
      rpe: set.rpe,
      restTime: set.restTime,
      completed: set.completed,
      isWarmup: set.isWarmup,
      notes: set.notes,
      performedAt: set.performedAt,
    };
  }

  private validateBody(dto: WorkoutBody): void {
    assertValidWorkoutDate(dto.date);
    assertValidTimes(
      dto.startTime,
      dto.endTime ?? null,
      dto.durationSec ?? null,
    );
    assertInsightSize(dto.insight);
  }

  /** Id do client gửi không được trùng nhau trong cùng một payload. */
  private validatePayloadIds(items: WorkoutExerciseInputDto[]): void {
    const exerciseIds = new Set<string>();
    const setIds = new Set<string>();
    for (const item of items) {
      if (item.id) {
        if (exerciseIds.has(item.id))
          throw new BadRequestException(
            `Trùng id bài tập trong payload: ${item.id}`,
          );
        exerciseIds.add(item.id);
      }
      for (const set of item.sets) {
        if (set.id) {
          if (setIds.has(set.id))
            throw new BadRequestException(
              `Trùng id set trong payload: ${set.id}`,
            );
          setIds.add(set.id);
        }
      }
    }
  }

  private workoutColumns(dto: WorkoutBody) {
    const endTime = dto.endTime ?? null;
    return {
      name: dto.name || null,
      date: dto.date,
      startTime: dto.startTime,
      endTime,
      durationSec:
        dto.durationSec ??
        (endTime
          ? Math.floor((endTime.getTime() - dto.startTime.getTime()) / 1000)
          : null),
      location: dto.location,
      templateId: dto.templateId ?? null,
      notes: dto.notes ?? null,
      mood: dto.mood ?? null,
      energyLevel: dto.energyLevel ?? null,
      estimatedCalories: dto.estimatedCalories ?? null,
      insight: dto.insight ?? null,
    };
  }

  /** Template phải thuộc về user (kể cả template đã xóa mềm: lịch sử vẫn trỏ tới nó được). */
  private async assertTemplateOwned(
    manager: EntityManager,
    userId: string,
    templateId: string | null | undefined,
  ): Promise<void> {
    if (!templateId) return;
    const exists = await manager
      .createQueryBuilder(WorkoutTemplate, 't')
      .withDeleted()
      .where('t.id = :templateId AND t.userId = :userId', {
        templateId,
        userId,
      })
      .getExists();
    if (!exists)
      throw new BadRequestException(
        'Template không tồn tại hoặc không thuộc về bạn',
      );
  }

  /**
   * Biến payload thành trạng thái mong muốn: gán id, vị trí, đồng bộ exerciseId của từng set
   * theo bài tập cha, làm tròn số, và tính tổng. Không ép quy tắc nào lên nội dung từng set
   * (ví dụ set cardio trống vừa tạo): trạng thái đang tập dở của client phải lưu được nguyên vẹn.
   */
  private async prepareTree(
    manager: EntityManager,
    userId: string,
    items: WorkoutExerciseInputDto[],
  ): Promise<DesiredTree> {
    const refs = await this.exercises.findReferencable(
      manager,
      userId,
      items.map((item) => item.exerciseId),
    );

    const exercises: DesiredExercise[] = [];
    const sets: DesiredSet[] = [];
    const totalsInput: TotalsInput[] = [];

    items.forEach((item, index) => {
      const ref = refs.get(item.exerciseId);
      const cardio = ref ? isCardioExercise(ref) : false;
      const exerciseEntryId = item.id ?? randomUUID();
      exercises.push({
        id: exerciseEntryId,
        exerciseId: item.exerciseId,
        position: index,
        restPreset: item.restPreset ?? null,
        notes: item.notes ?? null,
        supersetGroup: item.supersetGroup ?? null,
        targetSets: item.targetSets ?? null,
      });

      item.sets.forEach((set, setIndex) => {
        assertPlausibleTimestamp(
          set.performedAt,
          `exercises[${index}].sets[${setIndex}].performedAt`,
        );
        // Làm tròn theo độ chính xác của cột trong DB: weight đổi từ lb sang kg có thể có rất nhiều
        // chữ số thập phân. Làm tròn ở đây (thay vì để DB làm) để so sánh "có đổi không" khi PUT
        // khớp với giá trị đã lưu, tránh ghi lại mọi dòng mỗi lần.
        const desired: DesiredSet = {
          id: set.id ?? randomUUID(),
          workoutExerciseId: exerciseEntryId,
          exerciseId: item.exerciseId, // luôn trùng bài tập cha, client không gửi trường này
          weight: roundTo(set.weight, 2),
          reps: set.reps,
          durationMin:
            set.durationMin == null ? null : roundTo(set.durationMin, 2),
          rir: set.rir ?? null,
          rpe: set.rpe == null ? null : roundTo(set.rpe, 1),
          restTime: set.restTime ?? null,
          completed: set.completed ?? false,
          isWarmup: set.isWarmup ?? false,
          notes: set.notes ?? null,
          performedAt: set.performedAt,
        };
        sets.push(desired);
        totalsInput.push({
          completed: desired.completed,
          weight: desired.weight,
          reps: desired.reps,
          durationMin: desired.durationMin,
          cardio,
        });
      });
    });

    return { exercises, sets, totals: computeTotals(totalsInput) };
  }

  private async applyTree(
    manager: EntityManager,
    userId: string,
    workoutId: string,
    desired: DesiredTree,
    existingExercises: WorkoutExercise[],
    existingSets: WorkoutSet[],
  ): Promise<void> {
    const exerciseById = new Map(existingExercises.map((row) => [row.id, row]));
    const setById = new Map(existingSets.map((row) => [row.id, row]));
    const keptExercises = new Set<string>();
    const keptSets = new Set<string>();

    const newExercises: (DesiredExercise & {
      userId: string;
      workoutId: string;
    })[] = [];
    for (const item of desired.exercises) {
      const old = exerciseById.get(item.id);
      if (!old) {
        newExercises.push({ ...item, userId, workoutId });
        continue;
      }
      keptExercises.add(item.id);
      if (!this.sameExercise(old, item)) {
        const { id: _id, ...columns } = item;
        await manager.update(
          WorkoutExercise,
          { id: item.id },
          { ...columns, updatedAt: new Date() },
        );
      }
    }
    if (newExercises.length > 0)
      await manager.insert(WorkoutExercise, newExercises);

    const newSets: (DesiredSet & { userId: string })[] = [];
    for (const item of desired.sets) {
      const old = setById.get(item.id);
      if (!old) {
        newSets.push({ ...item, userId });
        continue;
      }
      keptSets.add(item.id);
      if (!this.sameSet(old, item)) {
        const { id: _id, ...columns } = item;
        await manager.update(
          WorkoutSet,
          { id: item.id },
          { ...columns, updatedAt: new Date() },
        );
      }
    }
    if (newSets.length > 0) await manager.insert(WorkoutSet, newSets);

    const removedSets = existingSets
      .filter((row) => !keptSets.has(row.id))
      .map((row) => row.id);
    if (removedSets.length > 0)
      await manager.softDelete(WorkoutSet, { id: In(removedSets) });
    const removedExercises = existingExercises
      .filter((row) => !keptExercises.has(row.id))
      .map((row) => row.id);
    if (removedExercises.length > 0)
      await manager.softDelete(WorkoutExercise, { id: In(removedExercises) });
  }

  private sameExercise(old: WorkoutExercise, next: DesiredExercise): boolean {
    return (
      old.exerciseId === next.exerciseId &&
      old.position === next.position &&
      old.restPreset === next.restPreset &&
      old.notes === next.notes &&
      old.supersetGroup === next.supersetGroup &&
      old.targetSets === next.targetSets
    );
  }

  private sameSet(old: WorkoutSet, next: DesiredSet): boolean {
    return (
      old.workoutExerciseId === next.workoutExerciseId &&
      old.exerciseId === next.exerciseId &&
      old.weight === next.weight &&
      old.reps === next.reps &&
      old.durationMin === next.durationMin &&
      old.rir === next.rir &&
      old.rpe === next.rpe &&
      old.restTime === next.restTime &&
      old.completed === next.completed &&
      old.isWarmup === next.isWarmup &&
      old.notes === next.notes &&
      old.performedAt.getTime() === next.performedAt.getTime()
    );
  }

  private async loadCounts(
    workoutIds: string[],
  ): Promise<
    Map<string, { exercises: number; sets: number; completedSets: number }>
  > {
    const map = new Map<
      string,
      { exercises: number; sets: number; completedSets: number }
    >();
    if (workoutIds.length === 0) return map;
    for (const id of workoutIds)
      map.set(id, { exercises: 0, sets: 0, completedSets: 0 });

    const exerciseRows: { workout_id: string; n: number }[] =
      await this.repo.manager.query(
        `SELECT workout_id, count(*)::int AS n
         FROM workout_exercises
        WHERE workout_id = ANY($1::uuid[]) AND deleted_at IS NULL
        GROUP BY workout_id`,
        [workoutIds],
      );
    for (const row of exerciseRows) {
      const entry = map.get(row.workout_id);
      if (entry) entry.exercises = row.n;
    }

    const setRows: { workout_id: string; total: number; completed: number }[] =
      await this.repo.manager.query(
        `SELECT we.workout_id,
                count(*)::int AS total,
                count(*) FILTER (WHERE s.completed)::int AS completed
           FROM workout_sets s
           JOIN workout_exercises we ON we.id = s.workout_exercise_id
          WHERE we.workout_id = ANY($1::uuid[]) AND s.deleted_at IS NULL
          GROUP BY we.workout_id`,
        [workoutIds],
      );
    for (const row of setRows) {
      const entry = map.get(row.workout_id);
      if (entry) {
        entry.sets = row.total;
        entry.completedSets = row.completed;
      }
    }
    return map;
  }

  private rethrowConflict(error: unknown): never {
    if (isUniqueViolation(error)) {
      throw new ConflictException(
        'Buổi tập, bài tập hoặc set đã tồn tại (trùng id)',
      );
    }
    throw error;
  }
}
