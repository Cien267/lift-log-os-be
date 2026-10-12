import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/forge.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireVerifiedEmail } from '../auth/decorators/require-verified-email.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUser } from '../auth/types/auth.types';
import {
  AdminCreateExerciseDto,
  AdminUpdateExerciseDto,
  ImportExercisesDto,
} from './dto/admin-exercise.dto';
import { ExercisesService } from './exercises.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@RequireVerifiedEmail()
@Controller('admin/exercises')
export class AdminExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Post()
  create(@CurrentUser() actor: AuthUser, @Body() dto: AdminCreateExerciseDto) {
    return this.exercises.createSystem(actor.userId, dto);
  }

  /** Nạp hàng loạt bài tập hệ thống với UUID cố định; chạy lại nhiều lần vẫn an toàn. */
  @HttpCode(HttpStatus.OK)
  @Post('import')
  import(@CurrentUser() actor: AuthUser, @Body() dto: ImportExercisesDto) {
    return this.exercises.importSystem(actor.userId, dto.exercises);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateExerciseDto,
  ) {
    return this.exercises.updateSystem(actor.userId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.exercises.removeSystem(actor.userId, id);
  }
}
