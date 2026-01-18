import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { getTelegramUserId } from "../hooks/useTelegramTheme";
import { isValidWallet } from "../utils/validators";

const ConnectPage = () => {
  const [wallet, setWallet] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (event) => {
    event.preventDefault();
    if (!isValidWallet(wallet)) {
      setWalletError("Wallet must start with 0x and contain 40 hex characters.");
      return;
    }
    setWalletError(null);
    setStatus(null);

    try {
      const telegramUserId = getTelegramUserId();
      const response = await api.login(wallet.trim(), token.trim(), telegramUserId);
      login(response.token, response.profile);
      setStatus({ type: "success", message: "Connected. Redirecting to dashboard..." });
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Connection failed" });
    }
  };

  return (
    <div className="connect-screen">
      <div className="connect-card">
        <h1>Connect to ØNE-ARB</h1>
        <p className="muted">Securely link your wallet and access token to control the bot.</p>
        {status && <div className={`alert ${status.type}`}>{status.message}</div>}
        <form onSubmit={submit} className="form">
          <div className="field">
            <label>Ethereum wallet address</label>
            <input
              value={wallet}
              onChange={(event) => setWallet(event.target.value)}
              placeholder="0x..."
              required
            />
            {walletError && <span className="field-error">{walletError}</span>}
          </div>
          <div className="field">
            <label>API key / private access token</label>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Enter your token"
              required
            />
          </div>
          <button type="submit" className="primary">
            Connect to Network
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConnectPage;
