import { useEffect, useRef, useState } from "react";
import planeImg from "../src/assets/plane.png";

const MAX_X = 0.82;
const MAX_Y = 0.78;

function flightProgress(multiplier) {
  const raw = Math.log(Math.max(multiplier, 1)) / Math.log(20);
  return Math.min(Math.max(raw, 0), 1);
}

export default function Plane({ multiplier, crashed, running }) {
  // Smooth interpolated value for rendering frame-by-frame
  const [smoothMultiplier, setSmoothMultiplier] = useState(multiplier || 1);
  const targetMultiplierRef = useRef(multiplier || 1);
  const animFrameRef = useRef(null);

  // Keep target updated with incoming server multiplier props
  useEffect(() => {
    targetMultiplierRef.current = multiplier;
  }, [multiplier]);

  // Smoothly interpolate smoothMultiplier toward targetMultiplier using rAF
  useEffect(() => {
    if (!running || crashed) {
      if (!running) setSmoothMultiplier(1);
      return;
    }

    let lastTime = performance.now();

    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      setSmoothMultiplier((prev) => {
        const target = targetMultiplierRef.current;
        const diff = target - prev;

        if (Math.abs(diff) < 0.0001) return target;

        // Smooth exponential lerp
        const lerpFactor = 1 - Math.exp(-12 * dt);
        return prev + diff * lerpFactor;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [running, crashed]);

  // Derive flight visual coordinates from interpolated smoothMultiplier
  const progress = flightProgress(smoothMultiplier);
  const x = progress * MAX_X;
  const y = progress * MAX_Y;
  const scale = 1 + progress * 0.18;

  // Ground shadow
  const shadowScale = Math.max(1 - progress * 0.7, 0.25);
  const shadowOpacity = Math.max(0.32 - progress * 0.26, 0.04);

  // Trail coordinates
  const startLeft = 8;
  const startBottom = 10;
  const endLeft = 8 + x * 74;
  const endBottom = 10 + y * 68;

  // Calculate direction vector to pull back the trail end by a small gap
  const dxRaw = endLeft - startLeft;
  const dyRaw = endBottom - startBottom;
  const dist = Math.hypot(dxRaw, dyRaw) || 1;
  const dirX = dxRaw / dist;
  const dirY = dyRaw / dist;

  // Small offset value to create a subtle space between the plane tail and trail
  const tailOffset = 5.9 + progress * 0.6; // % of stage width
  const tailLeft = endLeft - dirX * tailOffset;
  const tailBottom = endBottom - dirY * tailOffset;

  const topY = 100 - startBottom;
  const tailY = 100 - tailBottom;
  const linePath = `M ${startLeft} ${topY} L ${tailLeft} ${tailY}`;
  const fillPath = `${linePath} L ${tailLeft} ${topY} L ${startLeft} ${topY} Z`;

  // Smoke trail logic
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