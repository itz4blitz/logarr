import { ApiProperty } from '@nestjs/swagger';

export class HealthDto {
  @ApiProperty({ enum: ['healthy', 'warning', 'critical'] })
  status: 'healthy' | 'warning' | 'critical';

  @ApiProperty()
  sources: { online: number; total: number };

  @ApiProperty()
  issues: { critical: number; high: number; open: number };

  @ApiProperty()
  activeStreams: number;
}

export class ActivityHourDto {
  @ApiProperty()
  hour: string;

  @ApiProperty()
  error: number;

  @ApiProperty()
  warn: number;

  @ApiProperty()
  info: number;

  @ApiProperty()
  debug: number;
}

export class HeatmapDayDto {
  @ApiProperty()
  day: string;

  @ApiProperty({ type: [Number] })
  hours: number[];
}

export class TopLogSourceDto {
  @ApiProperty()
  source: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  errorCount: number;
}

export class LogDistributionDto {
  @ApiProperty()
  error: number;

  @ApiProperty()
  warn: number;

  @ApiProperty()
  info: number;

  @ApiProperty()
  debug: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [TopLogSourceDto] })
  topSources: TopLogSourceDto[];
}

export class TrendMetricDto<T = number> {
  @ApiProperty()
  current: T;

  @ApiProperty({ type: [Number] })
  trend: number[];

  @ApiProperty()
  change: number;
}

export class MetricsDto {
  @ApiProperty()
  errorRate: TrendMetricDto<number>;

  @ApiProperty()
  logVolume: { today: number; average: number; trend: number[] };

  @ApiProperty()
  sessionCount: { today: number; trend: number[] };

  @ApiProperty()
  issueCount: { open: number; trend: number[] };
}

export class TopIssueDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  severity: string;

  @ApiProperty()
  occurrenceCount: number;

  @ApiProperty()
  impactScore: number;
}

export class SourceStatusDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  providerId: string;

  @ApiProperty()
  isConnected: boolean;

  @ApiProperty({ nullable: true })
  lastSeen: string | null;

  @ApiProperty({ nullable: true })
  version: string | null;

  @ApiProperty()
  activeStreams: number;

  @ApiProperty({ description: 'Whether file-based log ingestion is enabled' })
  fileIngestionEnabled: boolean;

  @ApiProperty({ description: 'Whether file-based log ingestion is connected and working' })
  fileIngestionConnected: boolean;
}

export class NowPlayingDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  userName: string | null;

  @ApiProperty({ nullable: true })
  nowPlayingItemName: string | null;

  @ApiProperty({ nullable: true })
  nowPlayingItemType: string | null;

  @ApiProperty({ nullable: true })
  deviceName: string | null;

  @ApiProperty({ nullable: true })
  clientName: string | null;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  serverName: string;
}

export class RecentEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['issue_new', 'issue_resolved', 'server_status', 'error_spike'] })
  type: 'issue_new' | 'issue_resolved' | 'server_status' | 'error_spike';

  @ApiProperty()
  title: string;

  @ApiProperty()
  timestamp: string;

  @ApiProperty({ nullable: true })
  severity?: string;
}

export class DashboardDataDto {
  @ApiProperty()
  health: HealthDto;

  @ApiProperty({ type: [ActivityHourDto] })
  activityChart: ActivityHourDto[];

  @ApiProperty({ type: [HeatmapDayDto] })
  activityHeatmap: HeatmapDayDto[];

  @ApiProperty()
  logDistribution: LogDistributionDto;

  @ApiProperty()
  metrics: MetricsDto;

  @ApiProperty({ type: [TopIssueDto] })
  topIssues: TopIssueDto[];

  @ApiProperty({ type: [SourceStatusDto] })
  sources: SourceStatusDto[];

  @ApiProperty({ type: [NowPlayingDto] })
  nowPlaying: NowPlayingDto[];

  @ApiProperty({ type: [RecentEventDto] })
  recentEvents: RecentEventDto[];
}
