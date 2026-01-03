"use client";

import Link from "next/link";
import { Server, ArrowRight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionStatus } from "@/components/connection-status";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { DashboardSource } from "@/lib/api";
import { AddSourceModal } from "@/components/add-source-modal";

interface SourceStatusProps {
  sources: DashboardSource[];
  loading?: boolean;
}

export function SourceStatus({ sources, loading }: SourceStatusProps) {
  if (loading) {
    return (
      <Card className="flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Source Status</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col min-h-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Source Status</CardTitle>
          <Link href="/sources">
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
              Manage
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Server className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No sources configured</p>
            <AddSourceModal
              trigger={
                <Button size="sm" variant="outline">
                  Add Your First Source
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ConnectionStatus
                    apiConnected={source.isConnected}
                    fileIngestionEnabled={source.fileIngestionEnabled}
                    fileIngestionConnected={source.fileIngestionConnected}
                    lastSeen={source.lastSeen}
                    variant="dot"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {source.name}
                    </span>
                    {source.version && (
                      <span className="text-xs text-muted-foreground">
                        v{source.version}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {source.activeStreams > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-500">
                      <Activity className="h-3 w-3" />
                      <span>{source.activeStreams}</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {source.lastSeen
                      ? formatDistanceToNow(new Date(source.lastSeen), { addSuffix: true })
                      : "Never"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
