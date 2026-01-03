import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { IssuesGateway } from './issues.gateway';
import { IssueContextService } from './issue-context.service';
import { AnalysisPromptBuilder } from './analysis-prompt-builder';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [IssuesController],
  providers: [IssuesService, IssuesGateway, IssueContextService, AnalysisPromptBuilder],
  exports: [IssuesService, IssuesGateway],
})
export class IssuesModule {}
