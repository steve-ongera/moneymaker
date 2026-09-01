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
    <div className="countdown">
      <i className="bi bi-hourglass-split" /> Betting closes in {remaining.toFixed(1)}s
    </div>
  );
}
