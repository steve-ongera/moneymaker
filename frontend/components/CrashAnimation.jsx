//components/CrashAnimation.jsx
import { useEffect, useState } from "react";

/**
 * Purely decorative particle burst triggered when `crashed` flips true. Reads
 * the outcome (crashMultiplier) but never computes or influences it.
 */
export default function CrashAnimation({ crashed, crashMultiplier }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!crashed) {
      setParticles([]);
      return;
    }
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: (360 / 18) * i,
      distance: 40 + Math.random() * 40,
      delay: Math.random() * 0.15,
    }));
    setParticles(generated);
  }, [crashed]);

  if (!crashed) return null;

  return (
    <div className="crash-animation">
      {particles.map((p) => (
        <span
          key={p.id}
          className="crash-particle"
          style={{
            "--angle": `${p.angle}deg`,
            "--distance": `${p.distance}px`,
            "--delay": `${p.delay}s`,
          }}
        />
      ))}
      <div className="crash-label">Flew away @ {crashMultiplier?.toFixed(2)}x</div>
    </div>
  );
}
