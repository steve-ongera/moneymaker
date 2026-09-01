//components/Plane.jsx
import { useEffect, useRef, useState } from "react";
import planeImg from "../src/assets/plane.png";

/**
 * Purely visual. Position is derived from `multiplier` and `crashed`, both
 * of which come from GameContext (server-driven). This component never
 * decides outcomes — it only animates what it's told.
 *
 * Rendered as two nested layers (see style/main.css, "Plane" section):
 *   .plane-icon (position, smooth CSS transition) > .plane-sprite (artwork)
 * No rotation and no wobble/strain shake — the plane stays level and moves
 * smoothly along the flight path, matching the straight triangular trail
 * beneath it with no jitter.
 *
 * Flight path contract:
 *   --plane-x / --plane-y are 0..1 fractions of the stage. They're clamped
 *   well short of 1 so the plane always looks like it's climbing but never
 *   reaches the stage edge — the crash animation is the only thing that
 *   "ends" the flight visually.
 *
 * Trail: a straight-edged triangular wedge from the launch point to the
 * plane's tail — filled with a gradient that's bright near the plane and
 * fades toward the launch point. The tail point is pulled back from the
 * plane's position anchor along the flight direction so the wedge visually
 * meets the back of the plane instead of stopping at its geometric center.
 */

const MAX_X = 0.82;
const MAX_Y = 0.78;

function flightProgress(multiplier) {
  // Log curve: fast climb early, easing off as the multiplier grows, which
  // reads more like real flight than a linear march to the corner.
  const raw = Math.log(Math.max(multiplier, 1)) / Math.log(20);
  return Math.min(Math.max(raw, 0), 1);
}

export default function Plane({ multiplier, crashed, running }) {
  const progress = flightProgress(multiplier);
  const x = progress * MAX_X;
  const y = progress * MAX_Y;
  const scale = 1 + progress * 0.18;

  // Ground shadow: shrinks and fades as altitude increases.
  const shadowScale = Math.max(1 - progress * 0.7, 0.25);
  const shadowOpacity = Math.max(0.32 - progress * 0.26, 0.04);

  // Trail path drawn through the same coordinate space as .plane-icon
  // (left: 8% + x*74%, bottom: 10% + y*68%), converted to SVG's top-down Y.
  const startLeft = 8;
  const startBottom = 10;
  const endLeft = 8 + x * 74;
  const endBottom = 10 + y * 68;

  // Pull the trail's endpoint back from the plane's position anchor along
  // the flight direction, so the wedge meets the tail of the sprite rather
  // than its center. Offset grows slightly with progress since the sprite
  // itself scales up as it climbs.
  const dxRaw = endLeft - startLeft;
  const dyRaw = endBottom - startBottom;
  const dist = Math.hypot(dxRaw, dyRaw) || 1;
  const dirX = dxRaw / dist;
  const dirY = dyRaw / dist;
  const tailOffset = 3 + progress * 2.5; // % of stage
  const tailLeft = endLeft - dirX * tailOffset;
  const tailBottom = endBottom - dirY * tailOffset;

  // Straight-line trail: a simple triangle from launch point to the plane's
  // tail, closed down to the launch-height baseline.
  const topY = 100 - startBottom;
  const tailY = 100 - tailBottom;
  const linePath = `M ${startLeft} ${topY} L ${tailLeft} ${tailY}`;
  const fillPath = `${linePath} L ${tailLeft} ${topY} L ${startLeft} ${topY} Z`;

  // Light smoke trail while climbing — a periodic wisp, not a CSS loop, so
  // it visibly thins out if the round stalls rather than animating forever.
  const [smoke, setSmoke] = useState([]);
  const posRef = useRef({ left: endLeft, bottom: endBottom });
  posRef.current = { left: endLeft, bottom: endBottom };

  useEffect(() => {
    if (!running || crashed) return;
    const id = setInterval(() => {
      const { left, bottom } = posRef.current;
      setSmoke((prev) => [...prev.slice(-4), { id: Date.now(), left, bottom }]);
    }, 320);
    return () => clearInterval(id);
  }, [running, crashed]);

  useEffect(() => {
    if (crashed) setSmoke([]);
  }, [crashed]);

  return (
    <div className="plane-track">
      <svg className="plane-trail" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="planeTrailGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="trail-stop-top" />
            <stop offset="55%" className="trail-stop-mid" />
            <stop offset="100%" className="trail-stop-bottom" />
          </linearGradient>
        </defs>
        <path
          d={fillPath}
          className={running || crashed ? "trail-fill trail-active" : "trail-fill"}
        />
        <path
          d={linePath}
          className={running ? "trail-line trail-active" : "trail-line"}
        />
      </svg>

      <div
        className="plane-shadow"
        style={{
          "--shadow-scale": shadowScale,
          "--shadow-opacity": running ? shadowOpacity : 0,
        }}
      />

      {smoke.map((s) => (
        <span
          key={s.id}
          className="plane-smoke"
          style={{ left: `${s.left}%`, bottom: `${s.bottom}%` }}
        />
      ))}

      <div
        className={`plane-icon ${crashed ? "plane-crashed" : ""}`}
        style={{ "--plane-x": x, "--plane-y": y, "--plane-scale": scale }}
      >
        <div
          className="plane-sprite"
          style={{ backgroundImage: `url(${planeImg})` }}
        />
      </div>
    </div>
  );
}