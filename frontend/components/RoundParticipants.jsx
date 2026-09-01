//components/RoundParticipants.jsx
import { useEffect, useRef, useState } from "react";
import { useAviator } from "../hooks/useAviator.js";

/**
 * MOCK / NO-BACKEND VERSION
 * ─────────────────────────
 * There's no server event for "other players' bets" yet. Once that exists
 * (something like a `bet.joined` / `bet.cashed_out` broadcast in
 * GameContext's handleMessage, mirroring bet.confirmed/cashout.success but
 * for *other* users), this component should stop generating fake players
 * and instead just render off state pushed down from GameContext — same
 * shape as `players` below ({ id, phone, stake, cashout, status }), so the
 * JSX/render part of this file can stay almost untouched. The only thing
 * that needs to be swapped out is the simulation effect block.
 */

const KENYAN_PREFIXES = ["070", "071", "072", "074", "075", "079", "011"];

function randomPhone() {
  const prefix = KENYAN_PREFIXES[Math.floor(Math.random() * KENYAN_PREFIXES.length)];
  let rest = "";
  for (let i = 0; i < 7; i++) rest += Math.floor(Math.random() * 10);
  return `${prefix}${rest}`; // 10 digits total
}

// 07577xx68x style masking — keep the first 5 and last 2 digits, hide the rest.
function maskPhone(phone) {
  const chars = phone.split("");
  for (let i = 5; i < chars.length - 2; i++) chars[i] = "x";
  return chars.join("");
}

function randomStake() {
  const stakes = [20, 50, 100, 100, 100, 200, 300, 500, 1000, 2000];
  return stakes[Math.floor(Math.random() * stakes.length)];
}

// Skewed so most cashout targets are low (realistic — most people bail early)
// and a few are greedy and ride it out.
function randomTargetMultiplier() {
  const r = Math.random();
  if (r < 0.55) return +(1.1 + Math.random() * 0.9).toFixed(2); // 1.10x–2.00x
  if (r < 0.85) return +(2 + Math.random() * 3).toFixed(2); // 2x–5x
  return +(5 + Math.random() * 15).toFixed(2); // 5x–20x
}

function formatMoney(n) {
  return `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function RoundParticipants() {
  const { round, multiplier } = useAviator();
  const [players, setPlayers] = useState([]);

  const joinTimersRef = useRef([]);
  const cashoutPollRef = useRef(null);
  const lastRoundIdRef = useRef(null);
  const multiplierRef = useRef(multiplier);

  const status = round?.status;

  // Keep a ref mirror of the live multiplier so the interval below always
  // reads the current value instead of closing over a stale one from
  // whenever the RUNNING effect first ran.
  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);

  // New round → reset and stagger in a fresh batch of fake joiners during
  // the betting window.
  useEffect(() => {
    if (!round?.round_id || round.round_id === lastRoundIdRef.current) return;
    lastRoundIdRef.current = round.round_id;

    joinTimersRef.current.forEach(clearTimeout);
    joinTimersRef.current = [];
    setPlayers([]);

    const playerCount = 80 + Math.floor(Math.random() * 161); // 80–240 players
    for (let i = 0; i < playerCount; i++) {
      const delay = Math.random() * 8000; // spread joins over ~8s given the larger crowd
      const timer = setTimeout(() => {
        setPlayers((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            phone: maskPhone(randomPhone()),
            stake: randomStake(),
            targetMultiplier: randomTargetMultiplier(),
            cashout: null,
            status: "joined", // joined | cashed_out | lost
          },
        ]);
      }, delay);
      joinTimersRef.current.push(timer);
    }

    return () => {
      joinTimersRef.current.forEach(clearTimeout);
      joinTimersRef.current = [];
    };
  }, [round?.round_id]);

  // While RUNNING, poll the live multiplier and cash out anyone whose
  // personal target has been hit. Polling (rather than reacting to every
  // multiplier tick) keeps this cheap since multiplier updates via rAF.
  useEffect(() => {
    if (status !== "RUNNING") {
      if (cashoutPollRef.current) clearInterval(cashoutPollRef.current);
      return;
    }

    cashoutPollRef.current = setInterval(() => {
      const currentMultiplier = multiplierRef.current;
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.status !== "joined") return p;
          if (currentMultiplier >= p.targetMultiplier) {
            return {
              ...p,
              status: "cashed_out",
              cashout: +(p.stake * p.targetMultiplier).toFixed(2),
            };
          }
          return p;
        })
      );
    }, 250);

    return () => {
      if (cashoutPollRef.current) clearInterval(cashoutPollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Crash → anyone still "joined" lost their stake.
  useEffect(() => {
    if (status !== "CRASHED") return;
    setPlayers((prev) => prev.map((p) => (p.status === "joined" ? { ...p, status: "lost" } : p)));
  }, [status]);

  useEffect(() => {
    return () => {
      joinTimersRef.current.forEach(clearTimeout);
      if (cashoutPollRef.current) clearInterval(cashoutPollRef.current);
    };
  }, []);

  const totalStaked = players.reduce((sum, p) => sum + p.stake, 0);

  return (
    <div className="round-participants">
      <div className="round-participants-header">
        <span className="round-participants-title">Players in this round</span>
        <span className="round-participants-count">
          {players.length} players · {formatMoney(totalStaked)} staked
        </span>
      </div>

      <div className="round-participants-list">
        {players.length === 0 && <div className="round-participants-empty">Waiting for players to join…</div>}

        {players.map((p) => (
          <div key={p.id} className={`round-participant round-participant-${p.status}`}>
            <span className="round-participant-phone">{p.phone}</span>
            <span className="round-participant-stake">{formatMoney(p.stake)}</span>
            <span className="round-participant-cashout">
              {p.status === "cashed_out" && (
                <span className="round-participant-win">
                  +{formatMoney(p.cashout)} @ {p.targetMultiplier}x
                </span>
              )}
              {p.status === "lost" && <span className="round-participant-loss">Lost</span>}
              {p.status === "joined" && <span className="round-participant-pending">—</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}