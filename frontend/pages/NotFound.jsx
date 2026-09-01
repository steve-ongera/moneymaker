import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page page-not-found">
      <i className="bi bi-airplane-engines" style={{ fontSize: "3rem" }} />
      <h1>404</h1>
      <p>This page took off without you.</p>
      <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
    </div>
  );
}
