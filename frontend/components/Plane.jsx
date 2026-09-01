//components/Plane.jsx
import { useEffect, useRef } from "react";

/**
 * Purely visual. Position/rotation are derived from `multiplier` and `crashed`,
 * both of which come from GameContext (server-driven). This component never
 * decides outcomes — it only animates what it's told.
 */
export default function Plane({ multiplier, crashed, running }) {
  const planeRef = useRef(null);

  useEffect(() => {
    const el = planeRef.current;
    if (!el) return;

    // Map multiplier (1x..~20x, clamped) onto a smooth flight path.
    const progress = Math.min((multiplier - 1) / 6, 1); // 0..1 easing window
    const x = 10 + progress * 70; // percent across the track
    const y = 85 - progress * 65; // percent up the track
    const rotate = -10 - progress * 25;

    el.style.transform = `translate(${x}%, ${y}%) rotate(${rotate}deg)`;
    el.style.opacity = crashed ? "0" : "1";
  }, [multiplier, crashed]);

  return (
    <div className="plane-track">
      <svg className="plane-trail" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={`M 10 90 Q 40 90 ${10 + Math.min((multiplier - 1) / 6, 1) * 70} ${85 - Math.min((multiplier - 1) / 6, 1) * 65}`}
          className={running ? "trail-path trail-active" : "trail-path"}
        />
      </svg>

      <div ref={planeRef} className={`plane-icon ${crashed ? "plane-crashed" : ""}`}>
        <i className="bi bi-airplane-fill" />
      </div>

      {crashed && (
        <div className="crash-burst">
          <i className="bi bi-stars" />
        </div>
      )}
    </div>
  );
}
