import { Module, forwardRef } from '@nestjs/common';

import { FileIngestionModule } from '../file-ingestion/file-ingestion.module';
import { IssuesModule } from '../issues/issues.module';
import { LogsModule } from '../logs/logs.module';
import { SessionsModule } from '../sessions/sessions.module';

import { IngestionService } from './ingestion.service';

@Module({
  imports: [
    forwardRef(() => LogsModule),
    SessionsModule,
    IssuesModule,
    forwardRef(() => FileIngestionModule),
  ],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
