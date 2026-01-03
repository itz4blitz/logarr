"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFitToViewport, useFitToViewportPagination } from "@/hooks/use-fit-to-viewport";

interface Issue {
  id: string;
  title: string;
  severity: string;
  occurrenceCount: number;
  impactScore?: number;
}

interface TopIssuesCardProps {
  issues: Issue[];
  loading?: boolean;
}

const ISSUE_ROW_HEIGHT = 36; // Height of each issue row
const HEADER_HEIGHT = 28; // Title row (~14px) + mb-3 (12px) + small buffer
const PAGINATION_HEIGHT = 40; // Pagination controls (pt-3 + mt-2 + ~24px button)
const ROW_GAP = 0; // No gap - rows are flush

const SORT_KEY = "logarr-issues-sort";
type SortOption = "count" | "severity";

const severityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function TopIssuesCard({ issues, loading }: TopIssuesCardProps) {
  const [sortBy, setSortBy] = useState<SortOption>("severity");

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SORT_KEY);
    if (stored && ["count", "severity"].includes(stored)) {
      setSortBy(stored as SortOption);
    }
  }, []);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    localStorage.setItem(SORT_KEY, option);
  };

  const sortedIssues = useMemo(() => {
    const sorted = [...issues];
    switch (sortBy) {
      case "count":
        // Primary: count desc, Secondary: severity
        return sorted.sort((a, b) => {
          const countDiff = b.occurrenceCount - a.occurrenceCount;
          if (countDiff !== 0) return countDiff;
          return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
        });
      case "severity":
      default:
        // Primary: severity, Secondary: count desc
        return sorted.sort((a, b) => {
          const sevDiff = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
          if (sevDiff !== 0) return sevDiff;
          return b.occurrenceCount - a.occurrenceCount;
        });
    }
  }, [issues, sortBy]);

  const { containerRef, pageSize } = useFitToViewport<HTMLDivElement>({
    rowHeight: ISSUE_ROW_HEIGHT,
    headerHeight: HEADER_HEIGHT,
    paginationHeight: PAGINATION_HEIGHT,
    gap: ROW_GAP,
    minRows: 2,
  });

  const {
    paginatedData: paginatedIssues,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = useFitToViewportPagination(sortedIssues || [], pageSize);

  if (loading) {
    return (
      <div ref={containerRef} className="rounded-xl border bg-card p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24 bg-white/5" />
          <Skeleton className="h-3 w-16 bg-white/5" />
        </div>
        <div className="flex-1">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-2 rounded-lg" style={{ height: 36 }}>
              <Skeleton className="h-5 w-12 rounded bg-white/5 shrink-0" />
              <Skeleton className="h-3.5 flex-1 bg-white/5" />
              <Skeleton className="h-3 w-8 bg-white/5 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rounded-xl border bg-card p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200 tracking-tight">Top Issues</h3>
        <div className="flex items-center gap-3">
          {/* Sort toggle */}
          <div className="flex items-center rounded-md border border-white/10 p-0.5">
            <button
              onClick={() => handleSortChange("severity")}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                sortBy === "severity"
                  ? "bg-white/10 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Severity
            </button>
            <button
              onClick={() => handleSortChange("count")}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                sortBy === "count"
                  ? "bg-white/10 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Count
            </button>
          </div>
          <Link
            href="/issues"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
          >
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
          <AlertTriangle className="h-8 w-8 text-zinc-700 mb-2" />
          <p className="text-sm text-zinc-600">No open issues</p>
        </div>
      ) : (
        <>
          <div className="flex-1">
            {paginatedIssues.map((issue) => (
              <Link key={issue.id} href={`/issues?id=${issue.id}`}>
                <div
                  className="flex items-center gap-2.5 px-2 rounded-lg hover:bg-white/4 transition-colors group"
                  style={{ height: 36 }}
                >
                  <div className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0",
                    issue.severity === "critical" && "bg-rose-500/20 text-rose-400",
                    issue.severity === "high" && "bg-amber-500/20 text-amber-400",
                    issue.severity === "medium" && "bg-blue-500/20 text-blue-400",
                    issue.severity === "low" && "bg-zinc-500/20 text-zinc-400"
                  )}>
                    {issue.severity}
                  </div>
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-300 truncate flex-1 transition-colors">
                    {issue.title}
                  </span>
                  <span className="text-xs text-zinc-600 tabular-nums shrink-0 font-medium">{issue.occurrenceCount.toLocaleString()}×</span>
                </div>
              </Link>
            ))}
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
