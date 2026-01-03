"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { LogEntry } from "@/lib/api";
import { config } from "@/lib/config";

const SOCKET_URL = config.wsUrl;

interface LogSubscription {
  serverId?: string;
  levels?: string[];
  logSources?: ('api' | 'file')[];
}

interface UseLogSocketOptions {
  enabled?: boolean;
  serverId?: string;
  levels?: string[];
  logSources?: ('api' | 'file')[];
  onLog?: (log: LogEntry) => void;
}

export function useLogSocket(options: UseLogSocketOptions = {}) {
  const { enabled = true, serverId, levels, logSources, onLog } = options;
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const subscriptionRef = useRef<LogSubscription>({});

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${SOCKET_URL}/logs`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Subscribe to logs with all filters
      const subscription: LogSubscription = { serverId, levels, logSources };
      socket.emit("subscribe", subscription);
      subscriptionRef.current = subscription;
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("log", (log: LogEntry) => {
      // Server-side filtering handles levels and logSources
      // We just add the log to the list
      setLogs((prev) => {
        const newLogs = [log, ...prev];
        // Keep only the last 1000 logs in memory
        return newLogs.slice(0, 1000);
      });

      onLog?.(log);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      socket.emit("unsubscribe");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, serverId, levels, logSources, onLog]);

  // Re-subscribe when filters change
  useEffect(() => {
    if (!socketRef.current?.connected) return;

    const newSubscription: LogSubscription = { serverId, levels, logSources };
    const currentSub = subscriptionRef.current;

    // Check if any filter changed
    const filtersChanged =
      newSubscription.serverId !== currentSub.serverId ||
      JSON.stringify(newSubscription.levels) !== JSON.stringify(currentSub.levels) ||
      JSON.stringify(newSubscription.logSources) !== JSON.stringify(currentSub.logSources);

    if (filtersChanged) {
      socketRef.current.emit("unsubscribe");
      socketRef.current.emit("subscribe", newSubscription);
      subscriptionRef.current = newSubscription;
      setLogs([]); // Clear logs when filters change
    }
  }, [serverId, levels, logSources]);

  return { connected, logs, clearLogs };
}
