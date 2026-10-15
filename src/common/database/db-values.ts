/**
 * TypeORM không suy ra được kiểu của cột jsonb khai báo là Record<string, unknown> khi dùng
 * insert()/update() (lỗi biên dịch dù dữ liệu hoàn toàn đúng). Ép kiểu ở đúng một chỗ này
 * thay vì rải `as` khắp nơi. Dữ liệu đã được validate bởi DTO trước khi tới đây.
 */
export const dbValues = (values: object): never => values as never;
