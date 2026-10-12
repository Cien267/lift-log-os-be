import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MuscleGroup } from '../../../common/enums/forge.enums';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const trimEach = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item.trim() : item))
    : value;

/** Dùng với @ValidateIf để field không gửi (undefined) thì bỏ qua, nhưng null vẫn bị validator từ chối. */
export const isDefined = (_object: unknown, value: unknown) =>
  value !== undefined;

export const ExerciseName = () =>
  applyDecorators(
    Transform(trimString),
    IsString(),
    MinLength(2),
    MaxLength(120),
  );

export const SecondaryMusclesRule = () =>
  applyDecorators(
    IsArray(),
    ArrayUnique(),
    ArrayMaxSize(5),
    IsEnum(MuscleGroup, { each: true }),
  );

export const AliasesRule = () =>
  applyDecorators(
    Transform(trimEach),
    IsArray(),
    ArrayMaxSize(10),
    // Không phân biệt hoa/thường; phần tử không phải chuỗi sẽ bị IsString từ chối bên dưới.
    ArrayUnique((alias: unknown) =>
      typeof alias === 'string' ? alias.toLowerCase() : alias,
    ),
    IsString({ each: true }),
    MinLength(1, { each: true }),
    MaxLength(60, { each: true }),
  );

export const SubstituteIdsRule = () =>
  applyDecorators(
    IsArray(),
    ArrayUnique(),
    ArrayMaxSize(10),
    IsUUID(undefined, { each: true }),
  );

/**
 * Chỉ nhận URL https hoặc đường dẫn trên chính site (một dấu / ở đầu).
 * Từ chối javascript:/data:, và cả "//host" lẫn "/\host": trình duyệt hiểu các dạng này là
 * URL tương đối theo giao thức, tức trỏ sang site khác.
 */
export const GuideImageRule = () =>
  applyDecorators(
    IsString(),
    MaxLength(255),
    Matches(/^(https:\/\/[^\s\\]+|\/(?![\/\\])[^\s\\]*)$/, {
      message:
        'guideImage phải là URL https hoặc đường dẫn bắt đầu bằng một dấu /',
    }),
  );
