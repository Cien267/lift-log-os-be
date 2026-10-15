/** Dùng với @ValidateIf: field không gửi (undefined) thì bỏ qua, nhưng null vẫn bị validator từ chối. */
export const isDefined = (_object: unknown, value: unknown) =>
  value !== undefined;

export const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const trimEach = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item.trim() : item))
    : value;

/** Nhận cả chuỗi ISO 8601 lẫn số epoch (ms), vì Dexie lưu thời gian dạng số. */
export const toDate = ({ value }: { value: unknown }) =>
  typeof value === 'number' || typeof value === 'string'
    ? new Date(value)
    : value;
