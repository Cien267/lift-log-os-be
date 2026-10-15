import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class LastPerformanceQueryDto {
  @ApiPropertyOptional({
    description: 'Bỏ qua buổi tập này (thường là buổi đang tập)',
  })
  @IsOptional()
  @IsUUID()
  excludeWorkoutId?: string;
}
