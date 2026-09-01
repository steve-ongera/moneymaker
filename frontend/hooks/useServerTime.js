import { useCallback, useRef, useState } from "react";

/**
 * Tracks the offset between this browser's clock and the server's clock, so the
 * UI can display server-accurate elapsed/remaining time without trusting the
 * local device clock as authoritative.
 */
export function useServerTime() {
  const [offsetMs, setOffsetMs] = useState(0);
  const lastSyncRef = useRef(0);

  // Call this whenever a message with a `server_time` ISO string arrives.
  const syncFromServerTime = useCallback((serverTimeIso) => {
    if (!serverTimeIso) return;
    const serverMs = new Date(serverTimeIso).getTime();
    const localMs = Date.now();
    lastSyncRef.current = localMs;
    setOffsetMs(serverMs - localMs);
  }, []);

  const now = useCallback(() => new Date(Date.now() + offsetMs), [offsetMs]);

  return { offsetMs, syncFromServerTime, now };
}
