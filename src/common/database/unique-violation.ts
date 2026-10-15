import { QueryFailedError } from 'typeorm';

/** Lỗi vi phạm ràng buộc UNIQUE / khóa chính của PostgreSQL (mã 23505). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string })?.code === '23505'
  );
}
