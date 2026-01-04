"use client";

import { PlayCircle, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import type { Session, Server } from "@/lib/api";

import { SessionCard, SessionCardSkeleton } from "@/components/session-card";
import { useFitToViewport, useFitToViewportPagination } from "@/hooks/use-fit-to-viewport";
import { cn } from "@/lib/utils";

interface NowPlayingCardProps {
  sessions: Session[];
  servers: Server[];
  loading?: boolean;
}

// Mini card dimensions - more compact for dashboard
const SESSION_ROW_HEIGHT = 48; // Height of each mini session card
const HEADER_HEIGHT = 32; // Title row height
const PAGINATION_HEIGHT = 36; // Pagination controls height (smaller)
const ROW_GAP = 4; // Gap between rows (smaller)

const SORT_KEY = "logarr-nowplaying-sort";
type SortOption = "user" | "progress" | "started";

export function NowPlayingCard({ sessions, servers, loading }: NowPlayingCardProps) {
  const [sortBy, setSortBy] = useState<SortOption>("started");

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SORT_KEY);
    if (stored && ["user", "progress", "started"].includes(stored)) {
      setSortBy(stored as SortOption);
    }
  }, []);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    localStorage.setItem(SORT_KEY, option);
  };

  const { containerRef, pageSize } = useFitToViewport<HTMLDivElement>({
    rowHeight: SESSION_ROW_HEIGHT,
    headerHeight: HEADER_HEIGHT,
    paginationHeight: PAGINATION_HEIGHT,
    gap: ROW_GAP,
    minRows: 1,
  });

  const serverMap = useMemo(() => {
    return servers?.reduce((acc, server) => {
      acc[server.id] = server;
      return acc;
    }, {} as Record<string, Server>) || {};
  }, [servers]);

  const sortedSessions = useMemo(() => {
    const sorted = [...sessions];
    switch (sortBy) {
      case "user":
        return sorted.sort((a, b) => (a.userName || "").localeCompare(b.userName || ""));
      case "progress":
        // Sort by progress percentage (highest first)
        return sorted.sort((a, b) => {
          const durationA = a.nowPlaying?.runTimeTicks ? parseFloat(a.nowPlaying.runTimeTicks) : 0;
          const durationB = b.nowPlaying?.runTimeTicks ? parseFloat(b.nowPlaying.runTimeTicks) : 0;
          const positionA = a.nowPlaying?.positionTicks ? parseFloat(a.nowPlaying.positionTicks) : 0;
          const positionB = b.nowPlaying?.positionTicks ? parseFloat(b.nowPlaying.positionTicks) : 0;
          const progA = durationA > 0 ? positionA / durationA : 0;
          const progB = durationB > 0 ? positionB / durationB : 0;
          return progB - progA;
        });
      case "started":
      default:
        // Most recently started first
        return sorted.sort((a, b) => {
          if (!a.startedAt && !b.startedAt) return 0;
          if (!a.startedAt) return 1;
          if (!b.startedAt) return -1;
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        });
    }
  }, [sessions, sortBy]);

  const {
    paginatedData: paginatedSessions,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = useFitToViewportPagination(sortedSessions || [], pageSize);

  if (loading) {
    return (
      <div ref={containerRef} className="rounded-xl border bg-card p-3 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex-1 space-y-1">
          {Array.from({ length: pageSize }).map((_, i) => <SessionCardSkeleton key={i} mini />)}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rounded-xl border bg-card p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-200 tracking-tight">Now Playing</h3>
        <div className="flex items-center gap-2">
          {/* Sort toggle - more compact */}
          <div className="flex items-center rounded border border-white/10 p-0.5">
            <button
              onClick={() => handleSortChange("started")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                sortBy === "started"
                  ? "bg-white/10 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Recent
            </button>
            <button
              onClick={() => handleSortChange("user")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                sortBy === "user"
                  ? "bg-white/10 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              User
            </button>
            <button
              onClick={() => handleSortChange("progress")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                sortBy === "progress"
                  ? "bg-white/10 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Progress
            </button>
          </div>
          <Link
            href="/sessions"
            className="flex items-center gap-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
          >
            View All <ChevronRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-3 text-center">
          <PlayCircle className="h-6 w-6 text-zinc-700 mb-1.5" />
          <p className="text-xs text-zinc-600">No active playback</p>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-1">
            {paginatedSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                server={serverMap[session.serverId]}
                mini
              />
            ))}
          </div>

          {/* Pagination - more compact */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-white/5">
              <button
                onClick={prevPage}
                disabled={!hasPrevPage}
                className={cn(
                  "p-0.5 rounded transition-colors",
                  !hasPrevPage ? "text-zinc-700 cursor-not-allowed" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] text-zinc-600 tabular-nums">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={!hasNextPage}
                className={cn(
                  "p-0.5 rounded transition-colors",
                  !hasNextPage ? "text-zinc-700 cursor-not-allowed" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
