"use client";

import { formatDistanceToNow } from "date-fns";
import { Server, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

import type { DashboardSource } from "@/lib/api";

import { ConnectionStatus, ConnectionStatusBadge } from "@/components/connection-status";
import { ProviderIcon, getProviderMeta } from "@/components/provider-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useFitToViewport, useFitToViewportPagination } from "@/hooks/use-fit-to-viewport";
import { cn } from "@/lib/utils";


interface SourcesCardProps {
  sources: DashboardSource[];
  loading?: boolean;
}

const SOURCE_ROW_HEIGHT = 52; // Height of each source item (icon + text + padding)
const HEADER_HEIGHT = 32; // Title row height
const PAGINATION_HEIGHT = 44; // Pagination controls height
const ROW_GAP = 8; // Gap between rows

const SORT_KEY = "logarr-sources-sort";
type SortOption = "name" | "lastSeen";

export function SourcesCard({ sources, loading }: SourcesCardProps) {
  const [sortBy, setSortBy] = useState<SortOption>("name");

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SORT_KEY);
    if (stored && ["name", "lastSeen"].includes(stored)) {
      setSortBy(stored as SortOption);
    }
  }, []);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    localStorage.setItem(SORT_KEY, option);
  };

  const sortedSources = useMemo(() => {
    const sorted = [...sources];
    switch (sortBy) {
      case "lastSeen":
        // Most recently seen first, then by name
        return sorted.sort((a, b) => {
          if (!a.lastSeen && !b.lastSeen) return a.name.localeCompare(b.name);
          if (!a.lastSeen) return 1;
          if (!b.lastSeen) return -1;
          const timeDiff = new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
          if (timeDiff !== 0) return timeDiff;
          return a.name.localeCompare(b.name);
        });
      case "name":
      default:
        // Pure alphabetical
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [sources, sortBy]);

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
  } = useFitToViewportPagination(sortedSources || [], pageSize);

  if (loading) {
    return (
      <div ref={containerRef} className="rounded-xl border bg-card p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-20 bg-white/5" />
          <Skeleton className="h-3 w-16 bg-white/5" />
        </div>
        <div className="flex-1 space-y-2">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0 bg-white/5" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4 bg-white/5" />
                <Skeleton className="h-2.5 w-1/2 bg-white/5" />
              </div>
              <Skeleton className="h-4 w-4 rounded bg-white/5 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rounded-xl border bg-card p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200 tracking-tight">Sources</h3>
        <div className="flex items-center gap-3">
          {/* Sort toggle */}
          <div className="flex items-center rounded-md border border-white/10 p-0.5">
            <button
              onClick={() => handleSortChange("name")}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                sortBy === "name"
                  ? "bg-white/10 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Name
            </button>
            <button
              onClick={() => handleSortChange("lastSeen")}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                sortBy === "lastSeen"
                  ? "bg-white/10 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Recent
            </button>
          </div>
          <Link
            href="/sources"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
          >
            Manage <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
          <Server className="h-10 w-10 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">No sources configured</p>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-2">
            {paginatedSources.map((source) => {
              const meta = getProviderMeta(source.providerId);
              return (
                <Link key={source.id} href={`/sources?edit=${source.id}`} className="block group">
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    "hover:bg-white/5"
                  )}>
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      meta.bgColor,
                      !source.isConnected && "opacity-40 grayscale"
                    )}>
                      <ProviderIcon providerId={source.providerId} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100 truncate">{source.name}</span>
                        <ConnectionStatus
                          apiConnected={source.isConnected}
                          fileIngestionEnabled={source.fileIngestionEnabled}
                          fileIngestionConnected={source.fileIngestionConnected}
                          lastSeen={source.lastSeen}
                          variant="dot"
                        />
                      </div>
                      <span className="text-xs text-zinc-500">
                        {source.version && `v${source.version} • `}
                        {source.lastSeen ? formatDistanceToNow(new Date(source.lastSeen), { addSuffix: true }) : "Never"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
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
      )}
    </div>
  );
}
