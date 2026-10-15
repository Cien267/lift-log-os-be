import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class TemplateExerciseInputDto {
  @ApiProperty()
  @IsUUID()
  exerciseId: string;

  @ApiProperty({ minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  targetSets: number;

  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetRepsMin?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetRepsMax?: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Giây nghỉ (0-900)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(900)
  restPreset?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Các bài cùng số tạo thành một superset',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  supersetGroup?: number | null;
}
