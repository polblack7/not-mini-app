import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { NoticeSlot } from "../ui/Notice";
import { OutlineButton, PrimaryButton } from "../ui/Button";
import { StatusPill } from "../ui/Pill";
import { TextInput } from "../ui/TextInput";
import { COLORS } from "../ui/tokens";

const PLACEHOLDER_ADDRESS = "0x0000…000000";

const formatDeployStatus = (result) => {
  if (!result) return null;
  if (result.kind === "success") {
    return `Deployed on ${result.network} · tx ${result.tx_hash?.slice(0, 16)}…`;
  }
  return result.message;
};

/**
 * Auto-execute card — handles the wallet-key + flash-loan contract sub-flow.
 * Inputs are uncontrolled at the page level: only the `onSaveKey/onDeleteKey/
 * onDeploy` callbacks bubble up.
 */
export const AutoExecuteCard = ({
  settings,
  notice,
  onSaveKey,
  onDeleteKey,
  onDeploy,
  deployState,
}) => {
  const [walletKey, setWalletKey] = useState("");
  const deployStatus = formatDeployStatus(deployState);

  return (
    <Card>
      <header className="auto-exec__head">
        <div>
          <h3 className="auto-exec__title">Auto-execute</h3>
          <p className="auto-exec__body">
            {settings.has_wallet_key
              ? "Wallet key stored on-device."
              : "Provide a private key to enable auto-execution."}
          </p>
        </div>
        <StatusPill tone={settings.has_wallet_key ? "success" : "dim"}>
          {settings.has_wallet_key ? "Enabled" : "Disabled"}
        </StatusPill>
      </header>

      <NoticeSlot notice={notice} className="auto-exec__notice" />

      <div className="subcard">
        <div className="subcard__head">
          <span className="subcard__label">Flash-loan contract</span>
          <StatusPill tone={settings.flash_loan_contract ? "success" : "dim"}>
            {settings.flash_loan_contract ? "Deployed" : "Not deployed"}
          </StatusPill>
        </div>
        <code
          className="mono subcard__address"
          style={{ color: settings.flash_loan_contract ? COLORS.fg : COLORS.dim }}
        >
          {settings.flash_loan_contract || PLACEHOLDER_ADDRESS}
        </code>
        {deployStatus && (
          <p
            className="subcard__status"
            style={{ color: deployState?.kind === "success" ? COLORS.success : COLORS.danger }}
          >
            {deployStatus}
          </p>
        )}
        <PrimaryButton
          block
          size="sm"
          glow={false}
          disabled={!settings.has_wallet_key || deployState?.pending}
          onClick={onDeploy}
          className="subcard__cta"
        >
          {deployState?.pending
            ? "Deploying…"
            : settings.flash_loan_contract
            ? "Re-deploy contract"
            : "Deploy contract"}
        </PrimaryButton>
      </div>

      {settings.has_wallet_key ? (
        <div className="auto-exec__key-stored">
          <StatusPill tone="success">Key stored</StatusPill>
          <OutlineButton tone="danger" onClick={onDeleteKey}>
            Remove key
          </OutlineButton>
        </div>
      ) : (
        <div className="auto-exec__key-form">
          <Field label="Private key">
            <TextInput
              type="password"
              value={walletKey}
              onChange={setWalletKey}
              placeholder="0x…"
            />
          </Field>
          <PrimaryButton
            block
            size="sm"
            glow={false}
            onClick={() => {
              if (!walletKey.trim()) return;
              onSaveKey(walletKey.trim());
              setWalletKey("");
            }}
          >
            Save key
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
};
