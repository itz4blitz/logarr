import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardDataDto } from './dashboard.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated dashboard data' })
  @ApiResponse({ status: 200, type: DashboardDataDto })
  async getDashboardData() {
    return this.dashboardService.getDashboardData();
  }
}
