import React, { useEffect, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useNotice } from "../hooks/useNotice";
import {
  OutlineButton,
  PageHeader,
  PageSection,
  Section,
} from "../components/ui";
import {
  IdentityCard,
  LifetimeStats,
  SecurityCard,
  TelegramBotMenu,
} from "../components/profile";

export default function ProfilePage() {
  const { profile, setProfile, login, logout } = useAuth();
  const notice = useNotice();
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    api.me().then(setProfile).catch(() => null);
  }, [setProfile]);

  if (!profile) return <div className="loading">Loading profile…</div>;

  const updateToken = async (token) => {
    notice.clear();
    try {
      const response = await api.login(profile.wallet_address, token);
      login(response.token, response.profile);
      notice.success("Access token updated");
    } catch (err) {
      notice.error(err?.message || "Update failed");
    }
  };

  return (
    <>
      <PageHeader
        title="Profile"
        action={
          <OutlineButton tone="danger" onClick={logout}>
            Logout
          </OutlineButton>
        }
      />

      <PageSection gap="lg">
        <IdentityCard walletAddress={profile.wallet_address} />
      </PageSection>

      <Section title="Lifetime stats">
        <LifetimeStats profile={profile} />
      </Section>

      <Section title="Security">
        <SecurityCard notice={notice.notice} onUpdate={updateToken} />
      </Section>

      <Section title="Telegram bot">
        <TelegramBotMenu />
      </Section>
    </>
  );
}
