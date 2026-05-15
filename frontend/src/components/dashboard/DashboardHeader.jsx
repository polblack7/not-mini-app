import React from "react";
import { Icon } from "../ui/Icon";
import { truncateAddress } from "../../utils/format";

export const DashboardHeader = ({ walletAddress, unreadCount, onBellClick }) => (
  <header className="page-header dashboard-header">
    <div className="page-header__lead">
      <div className="greeting">Hello, Trader</div>
      <div className="wallet-preview">{truncateAddress(walletAddress)}</div>
    </div>
    <button
      type="button"
      className="bell"
      aria-label="Notifications"
      onClick={onBellClick}
    >
      <Icon name="bell" size={18} color="#fff" />
      {unreadCount > 0 && <span className="bell__badge">{unreadCount}</span>}
    </button>
  </header>
);
