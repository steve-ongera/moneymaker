//components/Multiplier.jsx
export default function Multiplier({ value, status }) {
  const label = status === "CRASHED" ? "💥 CRASHED" : `${value.toFixed(2)}x`;
  const cssClass = status === "CRASHED" ? "multiplier crashed" : "multiplier rising";

  return (
    <div className="multiplier-wrapper">
      <div className={cssClass}>
        {label}
        {status !== "CRASHED" && status !== "WAITING" && status !== "BETTING_OPEN" && (
          <span className="multiplier-trend">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}