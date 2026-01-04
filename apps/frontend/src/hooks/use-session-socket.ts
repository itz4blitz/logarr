"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { queryKeys } from "./use-api";

import type { Socket } from "socket.io-client";

import { config } from "@/lib/config";

const SOCKET_URL = config.wsUrl;

interface SessionSubscription {
  serverId?: string;
}

interface SessionUpdatePayload {
  type: "sessions" | "playbackStart" | "playbackStop" | "playbackProgress";
  serverId: string;
  data: unknown;
}

interface UseSessionSocketOptions {
  enabled?: boolean;
  serverId?: string;
}

export function useSessionSocket(options: UseSessionSocketOptions = {}) {
  const { enabled = true, serverId } = options;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const subscriptionRef = useRef<SessionSubscription>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    console.log("[SessionSocket] Connecting to", `${SOCKET_URL}/sessions`);

    const socket = io(`${SOCKET_URL}/sessions`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[SessionSocket] Connected");
      setConnected(true);
      // Subscribe to sessions
      const subscription: SessionSubscription = { serverId };
      socket.emit("subscribe", subscription);
      subscriptionRef.current = subscription;
    });

    socket.on("disconnect", () => {
      console.log("[SessionSocket] Disconnected");
      setConnected(false);
    });

    socket.on("sessionUpdate", (payload: SessionUpdatePayload) => {
      console.log("[SessionSocket] Received update:", payload.type);
      // Invalidate queries to refetch with latest data
      // This provides instant updates while keeping React Query as source of truth
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeSessions });
    });

    socket.on("connect_error", (error) => {
      console.error("[SessionSocket] Connection error:", error);
    });

    return () => {
      socket.emit("unsubscribe");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, serverId, queryClient]);

  // Re-subscribe when filters change
  useEffect(() => {
    const socket = socketRef.current;
    if (socket === null || !connected) return;

    const newSubscription: SessionSubscription = { serverId };
    if (newSubscription.serverId !== subscriptionRef.current.serverId) {
      socket.emit("unsubscribe");
      socket.emit("subscribe", newSubscription);
      subscriptionRef.current = newSubscription;
    }
  }, [connected, serverId]);

  return { connected };
}
