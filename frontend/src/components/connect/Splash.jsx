import React from "react";
import { AuroraBg } from "../layout/AuroraBg";
import { PrimaryButton } from "../ui/Button";

export const Splash = ({ onContinue }) => (
  <div className="splash">
    <AuroraBg variant="splash" />
    <div className="splash__halo" />
    <div className="splash__wordmark">
      Ø<span className="ne">NE</span>-ARB
    </div>
    <div className="splash__subtitle">Flash-loan arbitrage</div>

    <div className="splash__bottom">
      <div className="splash__heading">
        Jump start your
        <br />
        arbitrage portfolio.
      </div>
      <div className="splash__body">
        Connect your wallet, set a strategy, let the bot scan DEX spreads while you sleep.
      </div>
    </div>
    <div className="splash__cta">
      <PrimaryButton block onClick={onContinue}>
        Connect Wallet
      </PrimaryButton>
    </div>
  </div>
);
