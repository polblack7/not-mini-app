import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { getTelegramUserId } from "../../hooks/useTelegramTheme";
import { useNotice } from "../../hooks/useNotice";
import { isValidWallet } from "../../utils/validators";
import { AuroraBg } from "../layout/AuroraBg";
import { Field } from "../ui/Field";
import { IconButton, PrimaryButton } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { NoticeSlot } from "../ui/Notice";
import { TextInput } from "../ui/TextInput";
import { InfoCard } from "./InfoCard";

const MIN_TOKEN_LENGTH = 3;
const REDIRECT_DELAY_MS = 400;

export const ConnectForm = ({ onBack }) => {
  const [wallet, setWallet] = useState("");
  const [token, setToken] = useState("");
  const [walletError, setWalletError] = useState(null);
  const notice = useNotice();
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (event) => {
    event.preventDefault();
    if (!isValidWallet(wallet)) {
      setWalletError("Wallet must start with 0x and contain 40 hex characters.");
      return;
    }
    if (token.trim().length < MIN_TOKEN_LENGTH) {
      notice.error("Access token too short.");
      return;
    }
    setWalletError(null);
    notice.clear();

    try {
      const response = await api.login(wallet.trim(), token.trim(), getTelegramUserId());
      login(response.token, response.profile);
      notice.success("Connected. Loading…");
      setTimeout(() => navigate("/dashboard"), REDIRECT_DELAY_MS);
    } catch (error) {
      notice.error(error?.message || "Connection failed");
    }
  };

  return (
    <form className="connect-screen" onSubmit={submit}>
      <AuroraBg variant="splash" />
      <header className="connect-screen__top">
        <IconButton onClick={onBack} ariaLabel="Back">
          <Icon name="chevron-left" size={16} color="currentColor" />
        </IconButton>
        <span className="page-eyebrow">Authentication</span>
      </header>

      <div className="connect-screen__body">
        <h1 className="connect-screen__title">
          Connect to <span className="accent">ØNE-ARB</span>
        </h1>
        <p className="connect-screen__intro">
          Link your wallet and access token to control the bot. Your private key never leaves this
          device until you opt-in.
        </p>

        <NoticeSlot notice={notice.notice} className="connect-screen__notice" />

        <div className="connect-screen__fields">
          <Field label="Ethereum wallet address" error={walletError}>
            <TextInput value={wallet} onChange={setWallet} placeholder="0x…" />
          </Field>
          <Field label="API / private access token">
            <TextInput
              type="password"
              value={token}
              onChange={setToken}
              placeholder="Enter your token"
              autoComplete="off"
            />
          </Field>
        </div>

        <InfoCard
          title="Read-only by default"
          body="Auto-execute is opt-in from Strategy → Auto-execute."
        />
      </div>

      <div className="connect-screen__cta">
        <PrimaryButton type="submit" block>
          Connect to Network
        </PrimaryButton>
      </div>
    </form>
  );
};
