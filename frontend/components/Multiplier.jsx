export default function Multiplier({ value, status }) {
  const label = status === "CRASHED" ? "CRASHED" : `${value.toFixed(2)}x`;
  const cssClass = status === "CRASHED" ? "multiplier crashed" : "multiplier";

  return <div className={cssClass}>{label}</div>;
}
