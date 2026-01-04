"use client";

import { Zap, AlertTriangle, Activity, Server } from "lucide-react";

import {
  HealthBar,
  ActivityChart,
  LogDistributionChart,
  MetricCard,
  NowPlayingCard,
  SourcesCard,
  TopIssuesCard,
} from "@/components/dashboard";
import { useDashboardStats, useActiveSessions, useServers } from "@/hooks/use-api";
import { useSessionSocket } from "@/hooks/use-session-socket";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const { data: activeSessions, isLoading: loadingSessions } = useActiveSessions();
  const { data: servers, isLoading: loadingServers } = useServers();

  // Connect to WebSocket for real-time session updates
  useSessionSocket({ enabled: true });

  const loading = isLoading || !data;

  return (
    <div className="flex flex-col h-full gap-4 min-h-0 overflow-hidden">
      {/* Health Status Bar */}
      <HealthBar
        health={data?.health || { status: "healthy", sources: { online: 0, total: 0 }, issues: { critical: 0, high: 0, open: 0 }, activeStreams: 0 }}
        loading={loading}
      />

      {/* Key Metrics Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 shrink-0">
        <MetricCard
          title="Errors Today"
          value={data?.logDistribution.error.toLocaleString() || "0"}
          icon={Zap}
          href="/logs?levels=error"
          trend={data?.metrics.errorRate.trend}
          loading={loading}
          valueClassName={
            (data?.logDistribution.error || 0) > 100
              ? "text-rose-500"
              : (data?.logDistribution.error || 0) > 20
              ? "text-amber-500"
              : undefined
          }
        />
        <MetricCard
          title="Open Issues"
          value={data?.metrics.issueCount.open || 0}
          icon={AlertTriangle}
          href="/issues"
          trend={data?.metrics.issueCount.trend}
          loading={loading}
        />
        <MetricCard
          title="Log Volume"
          value={data?.metrics.logVolume.today.toLocaleString() || "0"}
          icon={Activity}
          href="/logs"
          trend={data?.metrics.logVolume.trend}
          loading={loading}
        />
        <MetricCard
          title="Sessions"
          value={data?.metrics.sessionCount.today || 0}
          icon={Server}
          href="/sessions"
          trend={data?.metrics.sessionCount.trend}
          loading={loading}
        />
      </div>

      {/* Main Content Grid - fills remaining height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 grid-rows-[1fr_1fr] gap-4">
        {/* Activity Chart - spans 2 columns */}
        <div className="lg:col-span-2 min-h-0">
          <ActivityChart
            data={data?.activityChart || []}
            loading={loading}
          />
        </div>

        {/* Source Status */}
        <div className="min-h-0">
          <SourcesCard
            sources={data?.sources || []}
            loading={loading}
          />
        </div>

        {/* Log Distribution */}
        <div className="min-h-0">
          <LogDistributionChart
            data={data?.logDistribution || { error: 0, warn: 0, info: 0, debug: 0, total: 0, topSources: [] }}
            loading={loading}
          />
        </div>

        {/* Now Playing */}
        <div className="min-h-0">
          <NowPlayingCard
            sessions={activeSessions || []}
            servers={servers || []}
            loading={loadingSessions || loadingServers}
          />
        </div>

        {/* Top Issues */}
        <div className="min-h-0">
          <TopIssuesCard
            issues={data?.topIssues || []}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
