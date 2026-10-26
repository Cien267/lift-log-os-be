import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { isDefined } from '../../../common/validation/validation.helpers';
import { IsUUID, ValidateIf } from 'class-validator';

export class CreateBodyMeasurementDto {
  @ApiPropertyOptional({
    description:
      'UUID do client sinh (offline-first). Bỏ trống để server tự sinh.',
  })
  @ValidateIf(isDefined)
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Ngày đo', type: 'string', format: 'date' })
  date: string;

  @ApiPropertyOptional({ description: 'Cân nặng (kg)', type: 'number' })
  @ValidateIf(isDefined)
  weight?: number;

  @ApiPropertyOptional({ description: 'Chiều cao (cm)', type: 'number' })
  @ValidateIf(isDefined)
  height?: number;

  @ApiPropertyOptional({ description: 'Tỷ lệ mỡ cơ thể (%)', type: 'number' })
  @ValidateIf(isDefined)
  bodyFat?: number;

  @ApiPropertyOptional({ description: 'Vòng ngực (cm)', type: 'number' })
  @ValidateIf(isDefined)
  chest?: number;

  @ApiPropertyOptional({ description: 'Vòng eo (cm)', type: 'number' })
  @ValidateIf(isDefined)
  waist?: number;

  @ApiPropertyOptional({ description: 'Vòng tay (cm)', type: 'number' })
  @ValidateIf(isDefined)
  arm?: number;

  @ApiPropertyOptional({ description: 'Vòng đùi (cm)', type: 'number' })
  @ValidateIf(isDefined)
  thigh?: number;

  @ApiPropertyOptional({ description: 'Vòng vai (cm)', type: 'number' })
  @ValidateIf(isDefined)
  shoulder?: number;

  @ApiPropertyOptional({ description: 'Vòng hông (cm)', type: 'number' })
  @ValidateIf(isDefined)
  hip?: number;

  @ApiPropertyOptional({ description: 'Ghi chú', type: 'string' })
  @ValidateIf(isDefined)
  notes?: string;
}
