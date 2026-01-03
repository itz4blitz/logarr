import { Module, forwardRef } from '@nestjs/common';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { FileIngestionModule } from '../file-ingestion/file-ingestion.module';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [
    forwardRef(() => FileIngestionModule),
    forwardRef(() => IngestionModule),
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
