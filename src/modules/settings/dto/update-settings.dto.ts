import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  AppLanguage,
  Equipment,
  ThemePreference,
  WeightUnit,
} from '../../../common/enums/forge.enums';

/**
 * Ngữ nghĩa PATCH:
 * - không gửi field (undefined) = giữ nguyên
 * - cột NOT NULL: ValidateIf(không phải undefined) để gửi null bị validator từ chối
 * - cột cho phép NULL (weeklyGoal, targetWeight): IsOptional để gửi null = xóa giá trị
 */
const isDefined = (_object: unknown, value: unknown) => value !== undefined;

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: WeightUnit })
  @ValidateIf(isDefined)
  @IsEnum(WeightUnit)
  unit?: WeightUnit;

  @ApiPropertyOptional({ enum: ThemePreference })
  @ValidateIf(isDefined)
  @IsEnum(ThemePreference)
  theme?: ThemePreference;

  @ApiPropertyOptional({ enum: AppLanguage })
  @ValidateIf(isDefined)
  @IsEnum(AppLanguage)
  language?: AppLanguage;

  @ApiPropertyOptional({
    description: 'Giây nghỉ mặc định giữa các set (10-600)',
  })
  @ValidateIf(isDefined)
  @IsInt()
  @Min(10)
  @Max(600)
  defaultRest?: number;

  @ApiPropertyOptional()
  @ValidateIf(isDefined)
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({ enum: Equipment, isArray: true })
  @ValidateIf(isDefined)
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsEnum(Equipment, { each: true })
  availableEquipment?: Equipment[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Số buổi tập mỗi tuần (1-14), null để xóa',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  weeklyGoal?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Cân nặng mục tiêu, luôn tính bằng kg (20-500), null để xóa',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(500)
  targetWeight?: number | null;

  @ApiPropertyOptional()
  @ValidateIf(isDefined)
  @IsBoolean()
  trainingAssistant?: boolean;
}
