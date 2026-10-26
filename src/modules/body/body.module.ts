import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyMeasurement } from './entities/body-measurement.entity';
import { BodyService } from './body.service';
import { BodyController } from './body.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BodyMeasurement])],
  controllers: [BodyController],
  providers: [BodyService],
})
export class BodyModule {}
