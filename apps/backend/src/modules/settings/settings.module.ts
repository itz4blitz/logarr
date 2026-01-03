import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { AiProviderService } from './ai-provider.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, AiProviderService],
  exports: [SettingsService, AiProviderService],
})
export class SettingsModule {}
