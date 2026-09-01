//components/Notification.jsx
import { useAviator } from "../hooks/useAviator.js";

const ICONS = {
  success: "bi-check-circle-fill",
  error: "bi-exclamation-triangle-fill",
  crash: "bi bi-x-circle",
};

export default function Notification() {
  const { notifications } = useAviator();

  if (!notifications.length) return null;

  return (
    <div className="notification-stack">
      {notifications.map((n) => (
        <div key={n.id} className={`notification notification-${n.kind}`}>
          <i className={`bi ${ICONS[n.kind] || "bi-info-circle-fill"}`} />
          <span>{n.text}</span>
        </div>
      ))}
    </div>
  );
}
