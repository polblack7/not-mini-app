import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { TagInput } from "../components/TagInput";

const DEX_OPTIONS = [
  "Uniswap V2",
  "Uniswap V3",
  "SushiSwap",
  "ShibaSwap",
  "Curve",
  "Balancer V2",
  "Balancer V3",
  "0x",
  "1inch",
  "KyberSwap Elastic",
  "DODO V2",
];

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [notice, setNotice] = useState(null);
  const [walletKey, setWalletKey] = useState("");
  const [keyNotice, setKeyNotice] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const updateDex = (dex) => {
    if (!settings) return;
    const list = settings.dex_list.includes(dex)
      ? settings.dex_list.filter((item) => item !== dex)
      : [...settings.dex_list, dex];
    setSettings({ ...settings, dex_list: list });
  };

  const save = async () => {
    if (!settings) return;
    setNotice(null);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setNotice({ type: "success", message: "Saved" });
    } catch (err) {
      setNotice({ type: "error", message: err.message || "Failed to save" });
    }
  };

  const submitWalletKey = async () => {
    setKeyNotice(null);
    if (!walletKey.trim()) return;
    try {
      await api.setWalletKey(walletKey.trim());
      setWalletKey("");
      setSettings({ ...settings, has_wallet_key: true });
      setKeyNotice({ type: "success", message: "Wallet key saved" });
    } catch (err) {
      setKeyNotice({ type: "error", message: err.message || "Failed to save key" });
    }
  };

  const deployContract = async () => {
    setDeploying(true);
    setDeployResult(null);
    setKeyNotice(null);
    try {
      const result = await api.deployContract();
      setDeployResult({ type: "success", ...result });
      setSettings({ ...settings, flash_loan_contract: result.address });
    } catch (err) {
      setDeployResult({ type: "error", message: err.message || "Deploy failed" });
    } finally {
      setDeploying(false);
    }
  };

  const removeWalletKey = async () => {
    setKeyNotice(null);
    try {
      await api.deleteWalletKey();
      setSettings({ ...settings, has_wallet_key: false });
      setKeyNotice({ type: "success", message: "Wallet key removed" });
    } catch (err) {
      setKeyNotice({ type: "error", message: err.message || "Failed to remove key" });
    }
  };

  if (!settings) {
    return <div className="card">Loading settings...</div>;
  }

  return (
    <div className="settings">
      <section className="card">
        <div className="panel-header">
          <h2>Strategy settings</h2>
          <span className="panel-meta">Tune execution thresholds</span>
        </div>
        {notice && <div className={`alert ${notice.type}`}>{notice.message}</div>}
        <TagInput
          label="Tokens / trading pairs"
          values={settings.pairs}
          onChange={(values) => setSettings({ ...settings, pairs: values })}
          placeholder="ETH/USDT"
        />
        <div className="field-grid">
          <div className="field">
            <label>Profit threshold (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.min_profit_pct}
              onChange={(event) =>
                setSettings({ ...settings, min_profit_pct: Number(event.target.value) })
              }
            />
          </div>
          <div className="field">
            <label>Loan limit</label>
            <input
              type="number"
              step="0.1"
              value={settings.loan_limit}
              onChange={(event) =>
                setSettings({ ...settings, loan_limit: Number(event.target.value) })
              }
            />
          </div>
        </div>
        <div className="field">
          <label>DEX selection</label>
          <div className="dex-chip-group">
            {DEX_OPTIONS.map((dex) => {
              const active = settings.dex_list.includes(dex);
              return (
                <button
                  key={dex}
                  type="button"
                  className={`dex-chip${active ? " dex-chip--active" : ""}`}
                  onClick={() => updateDex(dex)}
                  aria-pressed={active}
                >
                  {active && <span className="dex-chip__dot" />}
                  {dex}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label>Market scan frequency (seconds)</label>
          <input
            type="number"
            min="1"
            value={settings.scan_frequency_sec}
            onChange={(event) =>
              setSettings({ ...settings, scan_frequency_sec: Number(event.target.value) })
            }
          />
        </div>
        <button className="primary" onClick={save}>
          Save
        </button>
      </section>

      <section className="card">
        <div className="panel-header">
          <h2>Auto-execute</h2>
          <span className="panel-meta">
            {settings.has_wallet_key
              ? "Wallet key stored — trades will execute automatically"
              : "Provide your private key to enable auto-execution"}
          </span>
        </div>
        {keyNotice && <div className={`alert ${keyNotice.type}`}>{keyNotice.message}</div>}

        <div className="field">
          <label>Flash Loan contract</label>
          {settings.flash_loan_contract ? (
            <div>
              <span className="badge success">Deployed</span>
              <code style={{ marginLeft: 8, fontSize: "0.75rem", wordBreak: "break-all" }}>
                {settings.flash_loan_contract}
              </code>
            </div>
          ) : (
            <span className="badge" style={{ background: "var(--tg-theme-hint-color, #888)", color: "#fff" }}>
              Not deployed
            </span>
          )}
        </div>

        {deployResult && (
          <div className={`alert ${deployResult.type}`}>
            {deployResult.type === "success"
              ? `Deployed on ${deployResult.network} · tx ${deployResult.tx_hash?.slice(0, 18)}…`
              : deployResult.message}
          </div>
        )}

        <button
          className="primary"
          onClick={deployContract}
          disabled={deploying || !settings.has_wallet_key}
          style={{ marginBottom: 12 }}
        >
          {deploying ? "Deploying…" : settings.flash_loan_contract ? "Re-deploy contract" : "Deploy contract"}
        </button>
        {!settings.has_wallet_key && (
          <p style={{ fontSize: "0.8rem", color: "var(--tg-theme-hint-color, #888)", marginTop: 4 }}>
            Save your private key below to enable deployment.
          </p>
        )}

        {settings.has_wallet_key ? (
          <div className="field">
            <span className="badge success">Key stored</span>
            <button className="ghost" onClick={removeWalletKey} style={{ marginLeft: 8 }}>
              Remove key
            </button>
          </div>
        ) : (
          <div className="field">
            <label>Private key</label>
            <input
              type="password"
              value={walletKey}
              onChange={(event) => setWalletKey(event.target.value)}
              placeholder="0x..."
              autoComplete="off"
            />
            <button className="primary" onClick={submitWalletKey} style={{ marginTop: 8 }}>
              Save key
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default SettingsPage;
