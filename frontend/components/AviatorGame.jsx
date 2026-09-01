//components/AviatorGame.jsx
import { useAviator } from "../hooks/useAviator.js";
import Plane from "./Plane.jsx";
import Multiplier from "./Multiplier.jsx";
import Countdown from "./Countdown.jsx";
import CrashAnimation from "./CrashAnimation.jsx";
import BettingPanel from "./BettingPanel.jsx";
import LiveBets from "./LiveBets.jsx";
import GameHistory from "./GameHistory.jsx";
import Notification from "./Notification.jsx";

const STATUS_LABEL = {
  WAITING: "Get ready...",
  BETTING_OPEN: "Place your bets",
  RUNNING: "Flying...",
  CRASHED: "Crashed!",
  SETTLED: "Round settled",
};

const CONNECTION_LABEL = {
  connected: "Live",
  connecting: "Connecting...",
  disconnected: "Reconnecting...",
};

export default function AviatorGame() {
  const { round, multiplier, connectionStatus, lastCrash } = useAviator();

  const status = round?.status;
  const crashed = status === "CRASHED";
  const running = status === "RUNNING";
  const isBettingOpen = status === "BETTING_OPEN";

  return (
    <div className="aviator-game">
      <Notification />

      {/* grid-area: stage — connection badge and history live here */}
      <div className="game-stage-wrap">
        <div className="game-stage-header">
          <div className="connection-badge">
            <span className={`dot dot-${connectionStatus}`} />
            {CONNECTION_LABEL[connectionStatus] || "Reconnecting..."}
          </div>
          <div className="game-history">
            <GameHistory />
          </div>
        </div>

        <div className="game-stage">
          <div className="game-status-label">{STATUS_LABEL[status] || "Loading..."}</div>

          <div className="game-stage-grid" aria-hidden="true" />

          <Multiplier value={multiplier} status={status} />

          <Plane multiplier={multiplier} crashed={crashed} running={running} />
          <CrashAnimation crashed={crashed} crashMultiplier={lastCrash} />

          {/* Countdown - centralized in the middle of the stage */}
          {isBettingOpen && (
            <div className="countdown-wrapper">
              <Countdown closesAt={round?.betting_closes_at} />
            </div>
          )}
        </div>
      </div>

      {/* grid-area: panel — bet slate stays visible/sticky on desktop */}
      <div className="betting-panel-wrap">
        <BettingPanel />
      </div>

      {/* grid-area: bets */}
      <div className="live-bets">
        <LiveBets />
      </div>
    </div>
  );
}