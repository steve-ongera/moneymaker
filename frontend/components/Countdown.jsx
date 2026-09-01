//components/Countdown.jsx 
import { useEffect, useState } from "react";

export default function Countdown({ closesAt }) {
  const [remaining, setRemaining] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!closesAt) return;
    const target = new Date(closesAt).getTime();
    const initialDiff = Math.max(0, target - Date.now());
    const totalTime = 10; // assuming 10 second countdown

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setRemaining(diff / 1000);
      
      // Calculate progress percentage for the bar
      const elapsed = totalTime - (diff / 1000);
      const pct = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
      setProgress(pct);
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [closesAt]);

  if (!closesAt) return null;

  return (
    <div className="countdown">
      <div className="countdown-content">
        <span className="countdown-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </span>
        <span className="countdown-label">Betting closes in</span>
        <span className="countdown-number">{remaining.toFixed(1)}s</span>
      </div>
      <div className="countdown-bar-wrapper">
        <div 
          className="countdown-bar" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}