"use client";

import { useEffect, useRef } from "react";
import { API_ORIGIN, getAccessToken } from "./api";

export interface RealtimeEvent {
  kind: "connected" | "notification" | "message";
  [key: string]: unknown;
}

/**
 * Opens a single authenticated WebSocket per page load and reconnects with
 * backoff. `onEvent` fires for notification and message pushes.
 */
export function useRealtime(
  onEvent: (event: RealtimeEvent) => void,
  enabled: boolean = true,
): void {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;
    const token = getAccessToken();
    if (!token) return;

    let closed = false;
    let retry = 1000;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (closed) return;
      const wsUrl = `${API_ORIGIN.replace(/^http/, "ws")}/api/v1/ws?token=${encodeURIComponent(token)}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        retry = 1000;
      };
      socket.onmessage = (message) => {
        if (message.data === "pong") return;
        try {
          const payload = JSON.parse(message.data) as RealtimeEvent;
          handlerRef.current(payload);
        } catch {
          /* ignore malformed frames */
        }
      };
      socket.onclose = () => {
        if (closed) return;
        timer = setTimeout(connect, retry);
        retry = Math.min(retry * 2, 15_000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();

    const heartbeat = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 25_000);

    return () => {
      closed = true;
      clearInterval(heartbeat);
      if (timer) clearTimeout(timer);
      socket?.close();
    };
  }, [enabled]);
}
