import { Module, forwardRef } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { LogsModule } from '../logs/logs.module';
import { SessionsModule } from '../sessions/sessions.module';
import { IssuesModule } from '../issues/issues.module';
import { FileIngestionModule } from '../file-ingestion/file-ingestion.module';

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
