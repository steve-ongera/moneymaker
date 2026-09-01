//components/Countdown.jsx 
import { useEffect, useState } from "react";

export default function Countdown({ closesAt }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!closesAt) return;
    const target = new Date(closesAt).getTime();

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setRemaining(diff / 1000);
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [closesAt]);

  if (!closesAt) return null;

  return (
    <div className="countdown countdown-compact">
      <span className="countdown-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </span>
      Betting closes in <span className="countdown-number">{remaining.toFixed(1)}s</span>
    </div>
  );
}