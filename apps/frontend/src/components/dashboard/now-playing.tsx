"use client";

import { PlayCircle, ArrowRight, Film, Music, Tv } from "lucide-react";
import Link from "next/link";

import type { DashboardNowPlaying } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";


interface NowPlayingProps {
  sessions: DashboardNowPlaying[];
  loading?: boolean;
}

function getMediaIcon(type: string | null) {
  switch (type?.toLowerCase()) {
    case "movie":
      return Film;
    case "audio":
    case "musicalbum":
      return Music;
    case "series":
    case "episode":
      return Tv;
    default:
      return PlayCircle;
  }
}

export function NowPlaying({ sessions, loading }: NowPlayingProps) {
  if (loading) {
    return (
      <Card className="flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Now Playing</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
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
          <CardTitle className="text-sm font-medium">Now Playing</CardTitle>
          <Link href="/sessions">
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <PlayCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No active playback</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => {
              const MediaIcon = getMediaIcon(session.nowPlayingItemType);
              return (
                <div
                  key={session.id}
                  className="p-3 rounded-lg bg-muted/30 space-y-2"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <MediaIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {session.nowPlayingItemName || "Unknown Media"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.userName || "Unknown"} • {session.deviceName || "Unknown Device"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={session.progress} className="h-1" />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{session.serverName}</span>
                      <span>{session.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {sessions.length > 5 && (
              <Link href="/sessions" className="block">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all {sessions.length} sessions
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
