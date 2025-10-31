import { Module } from '@nestjs/common';
import { WasteLocationsService } from './waste-locations.service';
import { WasteLocationsController } from './waste-locations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WasteLocationsController],
  providers: [WasteLocationsService],
  exports: [WasteLocationsService],
})
export class WasteLocationsModule {}
