import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';
import { DATE_ONLY_REGEX } from '../../../common/constants/date.constants';
import { WorkoutLocation } from '../../../common/enums/forge.enums';
import { PaginationQueryDto } from '../../../common/pagination/pagination';

export enum WorkoutStatus {
  /** Chưa kết thúc (endTime = null): đang tập dở. */
  Active = 'active',
  Finished = 'finished',
}

export class ListWorkoutsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Từ ngày (bao gồm)',
  })
  @IsOptional()
  @Matches(DATE_ONLY_REGEX, { message: 'from phải có dạng YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description: 'Đến ngày (bao gồm)',
  })
  @IsOptional()
  @Matches(DATE_ONLY_REGEX, { message: 'to phải có dạng YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ enum: WorkoutLocation })
  @IsOptional()
  @IsEnum(WorkoutLocation)
  location?: WorkoutLocation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    enum: WorkoutStatus,
    description: 'active = đang tập dở (chưa có endTime)',
  })
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;
}
