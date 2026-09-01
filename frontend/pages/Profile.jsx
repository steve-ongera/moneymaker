import { useAuth } from "../hooks/useAuth.js";
import { useAviator } from "../hooks/useAviator.js";
import { useState } from "react";
import * as api from "../services/api.js";

export default function Profile() {
  const { user } = useAuth();
  const { round } = useAviator();
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!round?.server_seed) return; // only available once a round has crashed
    setVerifying(true);
    try {
      const result = await api.verifyFairness({
        serverSeed: round.server_seed,
        serverSeedHash: round.server_seed_hash,
        clientSeed: round.client_seed,
        nonce: round.nonce,
      });
      setVerifyResult(result);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="page page-profile">
      <h1><i className="bi bi-person-circle" /> Profile</h1>

      <div className="profile-card">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Phone:</strong> {user?.phone_number || "—"}</p>
        <p><strong>Verified:</strong> {user?.is_verified ? "Yes" : "No"}</p>
      </div>

      <div className="profile-card">
        <h3><i className="bi bi-shield-check" /> Provably Fair — Last Round</h3>
        {round ? (
          <>
            <p><strong>Round:</strong> {round.round_id}</p>
            <p><strong>Server seed hash:</strong> <code>{round.server_seed_hash}</code></p>
            <p><strong>Client seed:</strong> <code>{round.client_seed}</code></p>
            <p><strong>Nonce:</strong> {round.nonce}</p>
            {round.server_seed ? (
              <>
                <p><strong>Revealed server seed:</strong> <code>{round.server_seed}</code></p>
                <button className="btn btn-primary" onClick={handleVerify} disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify this round"}
                </button>
              </>
            ) : (
              <p className="empty-state">Seed reveals once the round crashes.</p>
            )}
            {verifyResult && (
              <div className={`alert ${verifyResult.is_valid ? "alert-success" : "alert-error"}`}>
                {verifyResult.is_valid ? "Valid — " : "Mismatch — "}
                recomputed crash: {verifyResult.recomputed_crash_multiplier}x
              </div>
            )}
          </>
        ) : (
          <p className="empty-state">No round data yet.</p>
        )}
      </div>
    </div>
  );
}
