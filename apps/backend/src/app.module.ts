import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { ServersModule } from './modules/servers/servers.module';
import { LogsModule } from './modules/logs/logs.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { IssuesModule } from './modules/issues/issues.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { LoggerModule } from './common/logger/logger.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        '.env',
        '../../.env.local',
        '../../.env',
      ],
    }),
    LoggerModule,
    DatabaseModule,
    RedisModule,
    ServersModule,
    LogsModule,
    SessionsModule,
    IngestionModule,
    IssuesModule,
    SettingsModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
