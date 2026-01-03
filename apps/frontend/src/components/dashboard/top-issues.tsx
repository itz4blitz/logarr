"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DashboardTopIssue } from "@/lib/api";

interface TopIssuesProps {
  issues: DashboardTopIssue[];
  loading?: boolean;
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case "critical":
      return { color: "text-red-500", bg: "bg-red-500/10", badge: "destructive" as const };
    case "high":
      return { color: "text-orange-500", bg: "bg-orange-500/10", badge: "default" as const };
    case "medium":
      return { color: "text-yellow-500", bg: "bg-yellow-500/10", badge: "secondary" as const };
    default:
      return { color: "text-blue-500", bg: "bg-blue-500/10", badge: "outline" as const };
  }
}

export function TopIssues({ issues, loading }: TopIssuesProps) {
  if (loading) {
    return (
      <Card className="flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Issues</CardTitle>
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
          <CardTitle className="text-sm font-medium">Top Issues</CardTitle>
          <Link href="/issues">
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No open issues</p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => {
              const config = getSeverityConfig(issue.severity);
              return (
                <Link key={issue.id} href={`/issues?id=${issue.id}`}>
                  <div
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-muted/50",
                      config.bg
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Badge variant={config.badge} className="shrink-0 text-[10px] px-1.5 py-0">
                        {issue.severity}
                      </Badge>
                      <span className="text-sm truncate">{issue.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                      <span className="tabular-nums">{issue.occurrenceCount}x</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
