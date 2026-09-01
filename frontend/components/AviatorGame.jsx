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
import RoundParticipants from "./RoundParticipants.jsx";

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

  // Belt-and-suspenders on top of the GameContext fix: once crashed, the
  // display is driven ONLY by lastCrash (set once, straight from the server
  // message, never touched again) — never by the live `multiplier` state.
  // That way this component structurally cannot show a stale/overwritten
  // value on the crash screen, even if some other race slips a stray update
  // into `multiplier` in the future.
  const displayMultiplier = crashed ? (lastCrash ?? multiplier) : multiplier;

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
          <div className="game-history-wrapper">
            <GameHistory />
          </div>
        </div>

        <div className="game-stage">
          <div className="game-status-label">{STATUS_LABEL[status] || "Loading..."}</div>

          <div className="game-stage-grid" aria-hidden="true" />

          <Multiplier value={displayMultiplier} status={status} />

          <Plane multiplier={displayMultiplier} crashed={crashed} running={running} />
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

        {/* Mock, no backend yet — see RoundParticipants.jsx for swap notes */}
        <RoundParticipants />
      </div>

      {/* grid-area: bets */}
      <div className="live-bets">
        <LiveBets />
      </div>
    </div>
  );
}