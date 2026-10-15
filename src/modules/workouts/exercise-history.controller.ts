import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';
import { LastPerformanceQueryDto } from './dto/last-performance-query.dto';
import { WorkoutsService } from './workouts.service';

/** Lịch sử tập theo từng bài tập. Cùng tiền tố /exercises nhưng thuộc về module workouts. */
@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExerciseHistoryController {
  constructor(private readonly workouts: WorkoutsService) {}

  /** Dữ liệu prefill weight/reps cho lần tập tiếp theo của một bài tập. */
  @Get(':exerciseId/last-performance')
  lastPerformance(
    @CurrentUser() user: AuthUser,
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Query() query: LastPerformanceQueryDto,
  ) {
    return this.workouts.lastPerformance(
      user.userId,
      exerciseId,
      query.excludeWorkoutId,
    );
  }
}
