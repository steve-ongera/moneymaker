//context/GameContext.jsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as api from "../services/api.js";
import { AuthContext } from "./AuthContext.jsx";
import { WalletContext } from "./WalletContext.jsx";
import { useServerTime } from "../hooks/useServerTime.js";
import { useWebSocket } from "../hooks/useWebSocket.js";

export const GameContext = createContext(null);

// Mirrors api/game_engine.py's calculate_multiplier — used ONLY to interpolate
// the animation smoothly between authoritative server broadcasts. The actual
// payout multiplier always comes from the server.
function interpolateMultiplier(elapsedSeconds, growthRate = 0.08) {
  if (elapsedSeconds <= 0) return 1.0;
  return Math.floor(Math.exp(growthRate * elapsedSeconds) * 100) / 100;
}

export function GameProvider({ children }) {
  const auth = useContext(AuthContext);
  const wallet = useContext(WalletContext);
  const { syncFromServerTime, now } = useServerTime();

  const [round, setRound] = useState(null); // { round_id, status, ... }
  const [multiplier, setMultiplier] = useState(1.0);
  const [activeBet, setActiveBet] = useState(null);
  const [recentRounds, setRecentRounds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lastCrash, setLastCrash] = useState(null);

  const runningSinceRef = useRef(null); // server-time Date the current round started RUNNING

  const pushNotification = useCallback((notification) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, ...notification }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const handleMessage = useCallback(
    (msg) => {
      if (msg.server_time) syncFromServerTime(msg.server_time);

      switch (msg.type) {
        case "state.sync": {
          setRound(msg.round);
          setActiveBet(msg.active_bet ? { ...msg.active_bet, bet_id: msg.active_bet.id } : null);
          if (msg.wallet_balance) wallet?.setBalanceFromServer(msg.wallet_balance);
          if (msg.round?.status === "RUNNING") {
            runningSinceRef.current = new Date(msg.server_time);
          }
          break;
        }

        case "round.started": {
          setRound({
            round_id: msg.round_id,
            status: "BETTING_OPEN",
            server_seed_hash: msg.server_seed_hash,
            client_seed: msg.client_seed,
            nonce: msg.nonce,
            betting_closes_at: msg.betting_closes_at,
          });
          setMultiplier(1.0);
          setActiveBet(null);
          setLastCrash(null);
          break;
        }

        case "round.running": {
          runningSinceRef.current = new Date(msg.server_time);
          setRound((prev) => (prev ? { ...prev, status: "RUNNING" } : prev));
          break;
        }

        case "multiplier.update": {
          setMultiplier(parseFloat(msg.multiplier));
          break;
        }

        case "round.crashed": {
          setRound((prev) => (prev ? { ...prev, status: "CRASHED" } : prev));
          setMultiplier(parseFloat(msg.crash_multiplier));
          setLastCrash(parseFloat(msg.crash_multiplier));
          setActiveBet((prev) => (prev && prev.status === "ACTIVE" ? { ...prev, status: "LOST" } : prev));
          // Push the crash straight into the history chips instantly, instead of
          // waiting for the next REST refetch of /aviator/history/.
          setRecentRounds((prev) => {
            const alreadyThere = prev.some((r) => r.round_id === msg.round_id);
            if (alreadyThere) return prev;
            return [{ round_id: msg.round_id, crash_multiplier: msg.crash_multiplier }, ...prev].slice(0, 50);
          });
          pushNotification({ kind: "crash", text: `Crashed at ${msg.crash_multiplier}x` });
          break;
        }

        case "round.settled": {
          setRound((prev) => (prev ? { ...prev, status: "SETTLED" } : prev));
          break;
        }

        case "bet.confirmed": {
          setActiveBet({ bet_id: msg.bet_id, amount: msg.amount, status: "ACTIVE" });
          wallet?.setBalanceFromServer(msg.balance);
          pushNotification({ kind: "success", text: `Bet placed: ${msg.amount}` });
          break;
        }

        case "bet.rejected": {
          pushNotification({ kind: "error", text: msg.reason || "Bet rejected" });
          break;
        }

        case "cashout.success": {
          setActiveBet((prev) =>
            prev ? { ...prev, status: "CASHED_OUT", cashout_multiplier: msg.multiplier, payout: msg.payout } : prev
          );
          wallet?.setBalanceFromServer(msg.balance);
          pushNotification({ kind: "success", text: `Cashed out at ${msg.multiplier}x — +${msg.payout}` });
          break;
        }

        case "cashout.failed": {
          pushNotification({ kind: "error", text: msg.reason || "Cash-out failed" });
          break;
        }

        default:
          break;
      }
    },
    [syncFromServerTime, wallet, pushNotification]
  );

  const ws = useWebSocket(handleMessage);

  // Smooth client-side interpolation between authoritative multiplier broadcasts.
  useEffect(() => {
    if (round?.status !== "RUNNING" || !runningSinceRef.current) return;
    let raf;
    const tick = () => {
      const elapsed = (now().getTime() - runningSinceRef.current.getTime()) / 1000;
      setMultiplier((prevServerAligned) => {
        const interpolated = interpolateMultiplier(elapsed);
        // Never let interpolation run ahead of what makes visual sense; the next
        // authoritative multiplier.update message will correct any drift anyway.
        return Math.max(prevServerAligned, interpolated);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [round?.status, now]);

  // Initial load + reconnect resync via REST (covers the gap before the WS opens).
  const syncFromRest = useCallback(async () => {
    if (!auth?.isAuthenticated) return;
    try {
      const data = await api.getCurrentRound();
      syncFromServerTime(data.server_time);
      setRound(data.round);
      setActiveBet(data.active_bet ? { ...data.active_bet, bet_id: data.active_bet.id } : null);
      if (data.wallet_balance) wallet?.setBalanceFromServer(data.wallet_balance);
      if (data.round?.status === "RUNNING") {
        runningSinceRef.current = new Date(data.server_time);
      }
    } catch {
      // ignore — WS state.sync will follow shortly after connecting
    }
  }, [auth?.isAuthenticated, syncFromServerTime, wallet]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.getGameHistory();
      setRecentRounds(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    syncFromRest();
    loadHistory();
  }, [syncFromRest, loadHistory]);

  // Bet / cash-out actions — optimistic UI handled by the calling component;
  // this just wraps the REST calls with request IDs for idempotency.
  const placeBet = useCallback(async (amount, autoCashoutMultiplier) => {
    const requestId = crypto.randomUUID();
    const bet = await api.placeBet({ amount, requestId, autoCashoutMultiplier });
    setActiveBet({ bet_id: bet.id, amount: bet.amount, status: bet.status });
    return bet;
  }, []);

  const cashOutBet = useCallback(async () => {
    if (!activeBet?.bet_id) return;
    const requestId = crypto.randomUUID();
    const bet = await api.cashOut({ betId: activeBet.bet_id, requestId });
    setActiveBet((prev) => ({
      ...prev,
      status: bet.status,
      cashout_multiplier: bet.cashout_multiplier,
      payout: bet.payout,
    }));
    return bet;
  }, [activeBet]);

  return (
    <GameContext.Provider
      value={{
        connectionStatus: ws.status,
        round,
        multiplier,
        activeBet,
        recentRounds,
        notifications,
        lastCrash,
        placeBet,
        cashOutBet,
        refreshHistory: loadHistory,
        requestStateSync: ws.requestStateSync,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}