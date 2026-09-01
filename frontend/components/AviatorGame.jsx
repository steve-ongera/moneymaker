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

  return (
    <div className="aviator-game">
      <Notification />

      {/* grid-area: stage — connection badge lives here, not as its own
          grid child, so it doesn't need a named area of its own */}
      <div className="game-stage-wrap">
        <div className="connection-badge">
          <span className={`dot dot-${connectionStatus}`} />
          {CONNECTION_LABEL[connectionStatus] || "Reconnecting..."}
        </div>

        <div className="game-stage">
          <div className="game-status-label">{STATUS_LABEL[status] || "Loading..."}</div>

          <div className="game-stage-grid" aria-hidden="true" />

          <Multiplier value={multiplier} status={status} />

          <Plane multiplier={multiplier} crashed={crashed} running={running} />
          <CrashAnimation crashed={crashed} crashMultiplier={lastCrash} />

          {status === "BETTING_OPEN" && <Countdown closesAt={round?.betting_closes_at} />}
        </div>
      </div>

      {/* grid-area: history */}
      <GameHistory />

      {/* grid-area: panel — bet slate stays visible/sticky on desktop,
          sits right after the stage on mobile since it's the primary action */}
      <div className="betting-panel-wrap">
        <BettingPanel />
      </div>

      {/* grid-area: bets */}
      <LiveBets />
    </div>
  );
}