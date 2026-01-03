"use client";

import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFitToViewport, useFitToViewportPagination } from "@/hooks/use-fit-to-viewport";
import type { LogDistribution } from "@/lib/api";

interface LogDistributionChartProps {
  data: LogDistribution;
  loading?: boolean;
}

const SOURCE_ROW_HEIGHT = 36; // Height of each source row
const HEADER_HEIGHT = 100; // Distribution bar + legend section
const PAGINATION_HEIGHT = 44; // Pagination controls height
const ROW_GAP = 4; // Gap between rows

export function LogDistributionChart({ data, loading }: LogDistributionChartProps) {
  const { containerRef, pageSize } = useFitToViewport<HTMLDivElement>({
    rowHeight: SOURCE_ROW_HEIGHT,
    headerHeight: HEADER_HEIGHT,
    paginationHeight: PAGINATION_HEIGHT,
    gap: ROW_GAP,
    minRows: 2,
  });

  const {
    paginatedData: paginatedSources,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = useFitToViewportPagination(data.topSources || [], pageSize);

  if (loading) {
    return (
      <div ref={containerRef} className="rounded-xl border bg-card p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        {/* Distribution bar skeleton */}
        <Skeleton className="h-2.5 w-full rounded-full mb-3" />
        {/* Legend skeleton */}
        <div className="flex gap-4 mb-3 pb-3 border-b border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        {/* Top Sources header */}
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
        {/* Source rows skeleton */}
        <div className="flex-1 space-y-1">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded">
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
              <Skeleton className="h-3 w-8 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = data.total || 1;
  const levels = [
    { name: "Error", value: data.error, color: "bg-rose-500", shadow: "shadow-rose-500/30", percent: (data.error / total) * 100 },
    { name: "Warn", value: data.warn, color: "bg-amber-500", shadow: "shadow-amber-500/30", percent: (data.warn / total) * 100 },
    { name: "Info", value: data.info, color: "bg-emerald-500", shadow: "shadow-emerald-500/30", percent: (data.info / total) * 100 },
    { name: "Debug", value: data.debug, color: "bg-zinc-600", shadow: "", percent: (data.debug / total) * 100 },
  ];

  // Find max count for progress bar scaling
  const maxSourceCount = Math.max(...(data.topSources?.map(s => s.count) || [1]), 1);

  return (
    <div ref={containerRef} className="rounded-xl border bg-card p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200 tracking-tight">Log Distribution</h3>
        <span className="text-xs text-zinc-500 tabular-nums font-medium">
          {data.total.toLocaleString()} total
        </span>
      </div>

      {/* Stacked bar - clickable segments */}
      <div className="relative h-2.5 rounded-full overflow-hidden flex bg-zinc-800/80 mb-3">
        {levels.map((level, index) => (
          level.percent > 0 && (
            <Link
              key={level.name}
              href={`/logs?level=${level.name.toLowerCase()}&live=false`}
              className={cn(
                "h-full transition-all duration-500 hover:brightness-110",
                level.color,
                index === 0 && "rounded-l-full",
                index === levels.length - 1 && "rounded-r-full"
              )}
              style={{ width: `${level.percent}%` }}
              title={`${level.name}: ${level.value.toLocaleString()} (${level.percent.toFixed(1)}%)`}
            />
          )
        ))}
      </div>

      {/* Compact legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3 pb-3 border-b border-white/5">
        {levels.map((level) => (
          <Link
            key={level.name}
            href={`/logs?level=${level.name.toLowerCase()}&live=false`}
            className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
          >
            <div className={cn("w-2 h-2 rounded-full", level.color)} />
            <span className="text-zinc-500">{level.name}</span>
            <span className="text-zinc-400 font-medium tabular-nums">{level.percent.toFixed(0)}%</span>
          </Link>
        ))}
      </div>

      {/* Top Sources List */}
      {data.topSources && data.topSources.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Top Sources</span>
            <Link
              href="/logs"
              className="flex items-center gap-0.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              View Logs <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 space-y-1">
            {paginatedSources.map((source) => {
              const percentage = (source.count / maxSourceCount) * 100;
              const hasErrors = source.errorCount > 0;
              return (
                <Link
                  key={source.source}
                  href={`/logs?source=${encodeURIComponent(source.source)}&live=false`}
                  className="block group"
                >
                  <div className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 truncate transition-colors">
                          {source.source}
                        </span>
                        {hasErrors && (
                          <span className="text-[10px] text-rose-400 tabular-nums shrink-0">
                            {source.errorCount} err
                          </span>
                        )}
                      </div>
                      {/* Mini progress bar */}
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            hasErrors ? "bg-linear-to-r from-amber-500 to-rose-500" : "bg-emerald-500/60"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600 tabular-nums font-medium shrink-0">
                      {source.count.toLocaleString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
              <button
                onClick={prevPage}
                disabled={!hasPrevPage}
                className={cn(
                  "p-1 rounded transition-colors",
                  !hasPrevPage ? "text-zinc-700 cursor-not-allowed" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-zinc-600 tabular-nums">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={!hasNextPage}
                className={cn(
                  "p-1 rounded transition-colors",
                  !hasNextPage ? "text-zinc-700 cursor-not-allowed" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-zinc-600">No source data available</p>
        </div>
      )}
    </div>
  );
}
