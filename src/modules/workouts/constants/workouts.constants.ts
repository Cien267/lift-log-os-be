export const MAX_EXERCISES_PER_WORKOUT = 50;
export const MAX_SETS_PER_EXERCISE = 50;

/** Ngày sớm nhất được chấp nhận cho một buổi tập. */
export const MIN_WORKOUT_DATE = '2000-01-01';
/** Cho phép lệch tối đa 1 ngày so với giờ UTC của server vì múi giờ của người dùng. */
export const MAX_FUTURE_DAYS = 1;

export const MAX_WORKOUT_DURATION_SEC = 24 * 60 * 60;
/** insight của buổi 40 bài tập ~15KB (đã đo), nên để dư nhiều. */
export const MAX_INSIGHT_BYTES = 64 * 1024;
export const MAX_TOTAL_VOLUME = 100_000_000;
export const MAX_TOTAL_CARDIO_MIN = 100_000;
