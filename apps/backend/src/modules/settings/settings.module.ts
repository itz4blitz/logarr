import { Module } from '@nestjs/common';

import { AiProviderService } from './ai-provider.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, AiProviderService],
  exports: [SettingsService, AiProviderService],
})
export class SettingsModule {}
