//components/Plane.jsx
import { useEffect, useRef, useState } from "react";

/**
 * Purely visual. Position/rotation are derived from `multiplier` and
 * `crashed`, both of which come from GameContext (server-driven). This
 * component never decides outcomes — it only animates what it's told.
 *
 * Rendered as three nested layers (see style/main.css, "Plane" section) so
 * JS-driven position, JS-driven pitch, and a continuous CSS wobble never
 * fight over the same `transform` property:
 *   .plane-icon (position) > .plane-pitch (rotation/scale) > .plane-sprite
 *   (artwork + turbulence wobble)
 *
 * Flight path contract:
 *   --plane-x / --plane-y are 0..1 fractions of the stage. They're clamped
 *   well short of 1 so the plane always looks like it's climbing but never
 *   reaches the stage edge — the crash animation is the only thing that
 *   "ends" the flight visually.
 */

const MAX_X = 0.82;
const MAX_Y = 0.78;
const STRAIN_THRESHOLD = 0.85; // progress past which the plane visibly strains

function flightProgress(multiplier) {
  // Log curve: fast climb early, visibly straining as the multiplier grows,
  // which reads more like real flight than a linear march to the corner.
  const raw = Math.log(Math.max(multiplier, 1)) / Math.log(20);
  return Math.min(Math.max(raw, 0), 1);
}

export default function Plane({ multiplier, crashed, running }) {
  const progress = flightProgress(multiplier);
  const x = progress * MAX_X;
  const y = progress * MAX_Y;
  const rotate = -6 - progress * 26;
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
  const midLeft = (startLeft + endLeft) / 2;
  const midBottom = startBottom + (endBottom - startBottom) * 0.85;
  const path = `M ${startLeft} ${100 - startBottom} Q ${midLeft} ${100 - midBottom} ${endLeft} ${100 - endBottom}`;

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

  const spriteClass = crashed
    ? "plane-sprite"
    : `plane-sprite${running ? " wobble" : ""}${progress >= STRAIN_THRESHOLD ? " strain" : ""}`;

  return (
    <div className="plane-track">
      <svg className="plane-trail" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={path} className={running ? "trail-path trail-active" : "trail-path"} />
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
        style={{ "--plane-x": x, "--plane-y": y }}
      >
        <div
          className="plane-pitch"
          style={{ "--plane-rot": `${rotate}deg`, "--plane-scale": scale }}
        >
          <div className={spriteClass} />
        </div>
      </div>
    </div>
  );
}