import React, { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";

const ProfilePage = () => {
  const { profile, setProfile, login, logout } = useAuth();
  const [token, setToken] = useState("");
  const [notice, setNotice] = useState(null);
  const didFetchProfile = useRef(false);

  useEffect(() => {
    if (didFetchProfile.current) return;
    didFetchProfile.current = true;
    api.me().then(setProfile).catch(() => null);
  }, [setProfile]);

  const updateToken = async () => {
    if (!profile) return;
    setNotice(null);
    try {
      const response = await api.login(profile.wallet_address, token.trim());
      login(response.token, response.profile);
      setToken("");
      setNotice({ type: "success", message: "Access token updated" });
    } catch (err) {
      setNotice({ type: "error", message: err.message || "Update failed" });
    }
  };

  if (!profile) {
    return <div className="card">Loading profile...</div>;
  }

  return (
    <div className="profile">
      <section className="card">
        <div className="panel-header">
          <h2>User profile</h2>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
        {notice && <div className={`alert ${notice.type}`}>{notice.message}</div>}
        <div className="profile-grid">
          <div>
            <p className="kpi-label">Connected wallet</p>
            <p className="mono">{profile.wallet_address.slice(0, 8)}...{profile.wallet_address.slice(-6)}</p>
          </div>
          <div>
            <p className="kpi-label">Successful trades</p>
            <p>{profile.successful_arbs}</p>
          </div>
          <div>
            <p className="kpi-label">Total profit</p>
            <p>{profile.total_profit.toFixed(4)} ETH</p>
          </div>
          <div>
            <p className="kpi-label">Avg profitability</p>
            <p>{profile.avg_profitability.toFixed(4)} ETH</p>
          </div>
        </div>
        <div className="field">
          <label>Change access token</label>
          <div className="tag-input">
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="New access token"
            />
            <button type="button" className="ghost" onClick={updateToken}>
              Update
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
