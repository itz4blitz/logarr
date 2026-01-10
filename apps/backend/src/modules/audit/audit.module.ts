import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditGateway } from './audit.gateway';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditGateway],
  exports: [AuditService, AuditGateway],
})
export class AuditModule {}
