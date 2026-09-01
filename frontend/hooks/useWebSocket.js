//hooks/useWebSocket.js
import { useCallback, useEffect, useRef, useState } from "react";
import { tokenStore } from "../services/api.js";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/aviator/";

const HEARTBEAT_INTERVAL_MS = 15000;
const MAX_RECONNECT_DELAY_MS = 10000;

/**
 * Manages a single authenticated WebSocket connection to the Aviator room, with
 * automatic reconnect (exponential backoff) and a ping/pong heartbeat. Consumers
 * pass an `onMessage` callback; connection status is exposed as `status`.
 */
export function useWebSocket(onMessage) {
  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const manuallyClosedRef = useRef(false);

  onMessageRef.current = onMessage;

  const clearTimers = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
  };

  const connect = useCallback(() => {
    const token = tokenStore.getAccess();
    if (!token) return;

    manuallyClosedRef.current = false;
    setStatus("connecting");

    const socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onopen = () => {
      // Ignore events from a socket that's already been superseded by a
      // newer connect() call (e.g. StrictMode double-invoke, fast
      // unmount/remount, or a reconnect race).
      if (socketRef.current !== socket) return;
      setStatus("connected");
      reconnectAttemptRef.current = 0;
      heartbeatRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    socket.onmessage = (event) => {
      // A stale socket can still receive in-flight frames after being
      // superseded; drop them so messages aren't processed twice.
      if (socketRef.current !== socket) return;
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch {
        // ignore malformed frames
      }
    };

    socket.onclose = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      // If this socket has already been replaced, its closure is expected
      // (we closed it ourselves during cleanup/reconnect) — don't touch
      // status or schedule a reconnect on behalf of a socket nobody uses.
      if (socketRef.current !== socket) return;
      setStatus("disconnected");
      if (!manuallyClosedRef.current) {
        const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, MAX_RECONNECT_DELAY_MS);
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }, []);

  const disconnect = useCallback(() => {
    manuallyClosedRef.current = true;
    clearTimers();
    socketRef.current?.close();
  }, []);

  const requestStateSync = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "state.request" }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, requestStateSync, disconnect, reconnect: connect };
}