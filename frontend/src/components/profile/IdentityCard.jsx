import React from "react";

const initialsFromAddress = (address) =>
  (address?.slice(2, 4).toUpperCase() || "0x");

export const IdentityCard = ({ walletAddress }) => (
  <div className="identity-card">
    <div className="identity-card__halo" />
    <div className="identity-card__body">
      <div className="avatar">{initialsFromAddress(walletAddress)}</div>
      <div className="identity-card__text">
        <div className="identity-card__label">Connected wallet</div>
        <div className="identity-card__wallet">{walletAddress || "—"}</div>
      </div>
    </div>
  </div>
);
