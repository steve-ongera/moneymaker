import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminTokenStore } from "../services/adminClient.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const WS_BASE = API_BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");

/**
 * Live feed from the game engine + bet stream, straight from
 * ws/admin/ (see api/admin_consumers.py). No polling — every round.*,
 * multiplier.update, admin.bet_placed, admin.bet_cashout, and
 * admin.round_summary event comes from the actual engine process.
 */
export function useAdminSocket() {
  const [status, setStatus] = useState("connecting"); // connecting | open | closed
  const [round, setRound] = useState(null);
  const [multiplier, setMultiplier] = useState("1.00");
  const [betsMap, setBetsMap] = useState({});
  const [lastRoundSummary, setLastRoundSummary] = useState(null);

  const socketRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    const token = adminTokenStore.getAccess();
    if (!token) {
      setStatus("closed");
      return;
    }

    const ws = new WebSocket(`${WS_BASE}/ws/admin/?token=${encodeURIComponent(token)}`);
    socketRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => setStatus("open");

    ws.onclose = () => {
      setStatus("closed");
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (payload.type) {
        case "round.started":
          setRound({
            round_id: payload.round_id,
            status: "BETTING_OPEN",
            server_seed_hash: payload.server_seed_hash,
            betting_closes_at: payload.betting_closes_at,
          });
          setMultiplier("1.00");
          setBetsMap({});
          setLastRoundSummary(null);
          break;

        case "round.running":
          setRound((r) => (r ? { ...r, status: "RUNNING" } : r));
          break;

        case "multiplier.update":
          setMultiplier(payload.multiplier);
          break;

        case "round.crashed":
          setMultiplier(payload.crash_multiplier);
          setRound((r) => (r ? { ...r, status: "CRASHED", crash_multiplier: payload.crash_multiplier } : r));
          // Anything still ACTIVE never cashed out in time — mark it lost
          // locally; admin.round_summary confirms the totals moments later.
          setBetsMap((prev) => {
            const next = { ...prev };
            for (const id of Object.keys(next)) {
              if (next[id].status === "ACTIVE") next[id] = { ...next[id], status: "LOST" };
            }
            return next;
          });
          break;

        case "round.settled":
          setRound((r) => (r ? { ...r, status: "SETTLED" } : r));
          break;

        case "admin.bet_placed":
          setBetsMap((prev) => ({
            ...prev,
            [payload.bet_id]: {
              bet_id: payload.bet_id,
              username: payload.username,
              amount: payload.amount,
              auto_cashout_multiplier: payload.auto_cashout_multiplier,
              status: payload.status,
              placed_at: payload.placed_at,
              cashout_multiplier: null,
              payout: null,
              auto: false,
            },
          }));
          break;

        case "admin.bet_cashout":
          setBetsMap((prev) => ({
            ...prev,
            [payload.bet_id]: {
              ...(prev[payload.bet_id] || { bet_id: payload.bet_id, username: payload.username, amount: null }),
              status: "CASHED_OUT",
              cashout_multiplier: payload.multiplier,
              payout: payload.payout,
              auto: !!payload.auto,
            },
          }));
          break;

        case "admin.round_summary":
          setLastRoundSummary(payload);
          break;

        default:
          break;
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, [connect]);

  const bets = useMemo(
    () => Object.values(betsMap).sort((a, b) => (a.placed_at < b.placed_at ? 1 : -1)),
    [betsMap]
  );

  const totals = useMemo(() => {
    let staked = 0;
    let payout = 0;
    for (const b of bets) {
      if (b.amount) staked += Number(b.amount);
      if (b.status === "CASHED_OUT" && b.payout) payout += Number(b.payout);
    }
    return { staked, payout, profit: staked - payout, count: bets.length };
  }, [bets]);

  return { status, round, multiplier, bets, totals, lastRoundSummary };
}