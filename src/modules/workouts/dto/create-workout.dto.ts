import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';
import { isDefined } from '../../../common/validation/validation.helpers';
import { ReplaceWorkoutDto } from './replace-workout.dto';

export class CreateWorkoutDto extends ReplaceWorkoutDto {
  @ApiPropertyOptional({
    description:
      'UUID do client sinh (offline-first). Bỏ trống để server tự sinh.',
  })
  @ValidateIf(isDefined)
  @IsUUID()
  id?: string;
}
