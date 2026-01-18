import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { TagInput } from "../components/TagInput";

const DEX_OPTIONS = ["Uniswap", "SushiSwap", "Curve"];

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [customDex, setCustomDex] = useState("");
  const [notice, setNotice] = useState(null);

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

  const addCustomDex = () => {
    if (!settings) return;
    const value = customDex.trim();
    if (!value || settings.dex_list.includes(value)) return;
    setSettings({ ...settings, dex_list: [...settings.dex_list, value] });
    setCustomDex("");
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
          <div className="checkbox-group">
            {DEX_OPTIONS.map((dex) => (
              <label key={dex} className="checkbox">
                <input
                  type="checkbox"
                  checked={settings.dex_list.includes(dex)}
                  onChange={() => updateDex(dex)}
                />
                {dex}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Custom DEX</label>
          <div className="tag-input">
            <input
              value={customDex}
              onChange={(event) => setCustomDex(event.target.value)}
              placeholder="Add DEX name"
            />
            <button type="button" className="ghost" onClick={addCustomDex}>
              Add
            </button>
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
    </div>
  );
};

export default SettingsPage;
