import { Module } from '@nestjs/common';
import { ChangesController } from './changes.controller';
import { DashboardController } from './dashboard.controller';
import { ChangesService } from './changes.service';
import { RequestsService } from './requests.service';

@Module({
  controllers: [ChangesController, DashboardController],
  providers: [ChangesService, RequestsService],
})
export class ChangesModule {}
