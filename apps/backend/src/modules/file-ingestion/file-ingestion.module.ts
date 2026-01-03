import { Module, forwardRef } from '@nestjs/common';
import { FileIngestionService } from './file-ingestion.service';
import { FileStateService } from './file-state.service';
import { FileDiscoveryService } from './file-discovery.service';
import { LogsModule } from '../logs/logs.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    forwardRef(() => LogsModule),
    forwardRef(() => IssuesModule),
  ],
  providers: [
    FileIngestionService,
    FileStateService,
    FileDiscoveryService,
  ],
  exports: [
    FileIngestionService,
    FileStateService,
    FileDiscoveryService,
  ],
})
export class FileIngestionModule {}
