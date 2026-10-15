import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { WorkoutLocation } from '../../../common/enums/forge.enums';
import { PaginationQueryDto } from '../../../common/pagination/pagination';

export class ListTemplatesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: WorkoutLocation })
  @IsOptional()
  @IsEnum(WorkoutLocation)
  location?: WorkoutLocation;
}
