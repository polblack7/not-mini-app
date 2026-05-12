import React, { useState } from "react";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useNotice } from "../hooks/useNotice";
import { PageHeader, PageSection } from "../components/ui";
import { AutoExecuteCard, StrategyForm } from "../components/settings";

export default function SettingsPage() {
  const { data: settings, setData: setSettings, loading } = useApi(api.getSettings);
  const strategyNotice = useNotice();
  const keyNotice = useNotice();
  const [deployState, setDeployState] = useState(null);

  if (loading || !settings) return <div className="loading">Loading settings…</div>;

  const save = async () => {
    strategyNotice.clear();
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      strategyNotice.success("Strategy saved");
    } catch (err) {
      strategyNotice.error(err?.message || "Failed to save");
    }
  };

  const saveKey = async (key) => {
    keyNotice.clear();
    try {
      await api.setWalletKey(key);
      setSettings({ ...settings, has_wallet_key: true });
      keyNotice.success("Wallet key saved");
    } catch (err) {
      keyNotice.error(err?.message || "Failed to save key");
    }
  };

  const removeKey = async () => {
    keyNotice.clear();
    try {
      await api.deleteWalletKey();
      setSettings({ ...settings, has_wallet_key: false });
      keyNotice.success("Wallet key removed");
    } catch (err) {
      keyNotice.error(err?.message || "Failed to remove key");
    }
  };

  const deploy = async () => {
    setDeployState({ pending: true });
    keyNotice.clear();
    try {
      const result = await api.deployContract();
      setDeployState({ kind: "success", ...result });
      setSettings({ ...settings, flash_loan_contract: result.address });
    } catch (err) {
      setDeployState({ kind: "error", message: err?.message || "Deploy failed" });
    }
  };

  return (
    <>
      <PageHeader title="Strategy" eyebrow="v0.1" subtitle="Tune execution thresholds & venues" />

      <PageSection gap="lg">
        <StrategyForm
          settings={settings}
          onChange={setSettings}
          onSave={save}
          notice={strategyNotice.notice}
        />
      </PageSection>

      <PageSection gap="md">
        <AutoExecuteCard
          settings={settings}
          notice={keyNotice.notice}
          deployState={deployState}
          onSaveKey={saveKey}
          onDeleteKey={removeKey}
          onDeploy={deploy}
        />
      </PageSection>
    </>
  );
}
