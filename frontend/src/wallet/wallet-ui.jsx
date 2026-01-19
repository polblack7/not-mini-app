import React from "react";

export const WalletSection = ({ state, actions }) => {
  const {
    statusText,
    errorMessage,
    addressLabel,
    networkName,
    chainLabel,
    connectionLabel,
    connectHint,
    copyHint,
    isConnecting,
    canConnect,
    showDisconnect,
    showSwitchNetwork,
    hasProvider,
    hasAddress,
    isWrongNetwork
  } = state;

  return (
    <section className="card wallet-section">
      <div className="wallet-header">
        <div>
          <p className="eyebrow">Wallet</p>
          <h3>Connect your wallet</h3>
          <p className="wallet-status">{statusText}</p>
          {errorMessage && <p className="wallet-error">{errorMessage}</p>}
          {connectHint && <p className="wallet-hint">{connectHint}</p>}
        </div>
        <div className="wallet-actions">
          <button
            type="button"
            className="primary"
            onClick={actions.onConnect}
            disabled={!canConnect || !hasProvider || isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect with MetaMask"}
          </button>
          {showDisconnect && (
            <button type="button" className="ghost" onClick={actions.onDisconnect}>
              Disconnect
            </button>
          )}
          {showSwitchNetwork && (
            <button type="button" className="ghost" onClick={actions.onSwitchNetwork}>
              Switch network
            </button>
          )}
        </div>
      </div>

      <div className="wallet-details">
        <div className="wallet-detail">
          <p className="wallet-label">Address</p>
          <div className="wallet-address">
            <span>{addressLabel}</span>
            <button
              type="button"
              className="wallet-copy"
              onClick={actions.onCopyAddress}
              disabled={!hasAddress}
              aria-label="Copy wallet address"
              title={hasAddress ? "Copy" : "Connect first"}
            >
              <span>Copy</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M9 9h10v10H9V9zm-4 6H4V4h11v1H6v10z"
                  fill="currentColor"
                />
              </svg>
            </button>
            {copyHint && <span className="wallet-copy-hint">{copyHint}</span>}
          </div>
        </div>
        <div className="wallet-detail">
          <p className="wallet-label">Network</p>
          <p className="wallet-value">{networkName}</p>
          <p className="wallet-meta">{chainLabel}</p>
        </div>
        <div className="wallet-detail">
          <p className="wallet-label">Connection</p>
          <p
            className={`wallet-state ${
              isWrongNetwork ? "wrong" : connectionLabel === "Connected" ? "connected" : "disconnected"
            }`}
          >
            {connectionLabel}
          </p>
        </div>
      </div>
    </section>
  );
};
