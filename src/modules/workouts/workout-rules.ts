import { BadRequestException } from '@nestjs/common';
import { DATE_ONLY_REGEX } from '../../common/constants/date.constants';
import { ExerciseCategory, MuscleGroup } from '../../common/enums/forge.enums';
import {
  MAX_FUTURE_DAYS,
  MAX_INSIGHT_BYTES,
  MAX_WORKOUT_DURATION_SEC,
  MIN_WORKOUT_DATE,
} from './constants/workouts.constants';

const DAY_MS = 86_400_000;

/** Làm tròn tới `decimals` chữ số thập phân (khớp độ chính xác của cột numeric trong DB). */
export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** Kiểm tra chuỗi YYYY-MM-DD là một ngày có thật trên lịch (từ chối 2026-02-30). */
export function isRealCalendarDate(date: string): boolean {
  if (!DATE_ONLY_REGEX.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

export function assertValidWorkoutDate(date: string): void {
  if (!isRealCalendarDate(date)) {
    throw new BadRequestException(
      'date phải là một ngày hợp lệ dạng YYYY-MM-DD',
    );
  }
  const latest = new Date(Date.now() + MAX_FUTURE_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);
  if (date < MIN_WORKOUT_DATE || date > latest) {
    throw new BadRequestException(
      `date phải nằm trong khoảng ${MIN_WORKOUT_DATE} đến ${latest}`,
    );
  }
}

/** Thời điểm hợp lý: sau năm 2000 và không quá 1 ngày trong tương lai. */
export function assertPlausibleTimestamp(value: Date, label: string): void {
  const earliest = new Date(`${MIN_WORKOUT_DATE}T00:00:00.000Z`).getTime();
  const latest = Date.now() + MAX_FUTURE_DAYS * DAY_MS;
  if (value.getTime() < earliest || value.getTime() > latest) {
    throw new BadRequestException(`${label} nằm ngoài khoảng thời gian hợp lệ`);
  }
}

export function assertValidTimes(
  startTime: Date,
  endTime: Date | null,
  durationSec: number | null,
): void {
  assertPlausibleTimestamp(startTime, 'startTime');
  if (endTime) {
    assertPlausibleTimestamp(endTime, 'endTime');
    if (endTime.getTime() < startTime.getTime()) {
      throw new BadRequestException('endTime không được sớm hơn startTime');
    }
    if (
      endTime.getTime() - startTime.getTime() >
      MAX_WORKOUT_DURATION_SEC * 1000
    ) {
      throw new BadRequestException(
        'Một buổi tập không thể kéo dài quá 24 giờ',
      );
    }
  }
  if (durationSec !== null && durationSec > MAX_WORKOUT_DURATION_SEC) {
    throw new BadRequestException('durationSec không được vượt quá 24 giờ');
  }
}

export function assertInsightSize(
  insight: Record<string, unknown> | null | undefined,
): void {
  if (
    insight &&
    Buffer.byteLength(JSON.stringify(insight)) > MAX_INSIGHT_BYTES
  ) {
    throw new BadRequestException(
      `insight không được lớn hơn ${MAX_INSIGHT_BYTES / 1024}KB`,
    );
  }
}

/**
 * Giống hệt isCardioExercise của front-end (analytics.ts): một bài là cardio nếu nhóm cơ
 * HOẶC loại bài là "cardio". Phải giữ hai bên đồng bộ.
 */
export const isCardioExercise = (exercise: {
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
}): boolean =>
  exercise.muscleGroup === MuscleGroup.Cardio ||
  exercise.category === ExerciseCategory.Cardio;

export interface TotalsInput {
  completed: boolean;
  weight: number;
  reps: number;
  durationMin: number | null;
  cardio: boolean;
}

/**
 * Phản chiếu computeWorkoutAggregate của front-end (analytics.ts), chỉ khi client không tự gửi tổng:
 * - chỉ tính set đã hoàn thành
 * - KHÔNG loại set khởi động (front-end tính cả khởi động vào volume)
 * - set của bài cardio cộng vào phút cardio, không cộng vào volume
 * Tính bằng số nguyên (đơn vị 0,01) để cộng nhiều set không bị sai số dấu phẩy động.
 */
export function computeTotals(sets: TotalsInput[]): {
  totalVolume: number;
  totalCardioMin: number;
} {
  let volume = 0;
  let cardio = 0;
  for (const set of sets) {
    if (!set.completed) continue;
    if (set.cardio) {
      cardio += Math.round((set.durationMin ?? 0) * 100);
    } else {
      volume += Math.round(set.weight * 100) * set.reps;
    }
  }
  return { totalVolume: volume / 100, totalCardioMin: cardio / 100 };
}
