import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateBodyMeasurementDto } from './dto/create-body-measurement';
import { UpdateBodyMeasurementDto } from './dto/update-body-measurement';
import { BodyService } from './body.service';

@ApiTags('body')
@ApiBearerAuth()
@Controller('body')
export class BodyController {
  constructor(private readonly bodyService: BodyService) {}

  @Get('/measurements')
  measurements(@CurrentUser() user: AuthUser) {
    return this.bodyService.getMeasurement(user.userId);
  }

  @Post('/measurements')
  createMeasurement(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBodyMeasurementDto,
  ) {
    return this.bodyService.createMeasurement(user.userId, dto);
  }

  @Patch('/measurements/:id')
  updateMeasurement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBodyMeasurementDto,
  ) {
    return this.bodyService.updateMeasurement(user.userId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/measurements/:id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bodyService.deleteMeasurement(user.userId, id);
  }
}
