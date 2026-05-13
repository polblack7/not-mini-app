import React from "react";
import { cn } from "../../utils/cn";
import { BOT_STATUS } from "../../constants/status";
import { useErrorFlash } from "../../hooks/useErrorFlash";
import { StatusDot } from "../ui/StatusDot";
import { formatUsd } from "../../utils/format";

/**
 * Brand-deep balance card with the signature green/orange sweep animation.
 *
 *  - Green sweep is a persistent overlay clipped via `clip-path`. The 1.6s
 *    `cubic-bezier(0.65, 0, 0.35, 1)` transition handles fill-in on start and
 *    retract on stop.
 *  - Orange sweep mounts on each new `last_error` (counter from useErrorFlash)
 *    and runs a one-shot `oneArbErrorSweep` keyframe alongside the shine loop.
 */
export const HeroBalance = ({ status, onStart, onStop }) => {
  const state = status?.status || BOT_STATUS.STOPPED;
  const isActive = state === BOT_STATUS.ACTIVE;
  const profit = status?.kpis?.current_profit ?? 0;
  const errorFlash = useErrorFlash(status?.last_error);

  return (
    <div className="hero-balance">
      <div className="hero-balance__halo" />
      <div className="hero-balance__inner">
        <div className="hero-balance__overlay" />
        <div className={cn("hero-balance__sweep", isActive && "hero-balance__sweep--active")} />
        {errorFlash > 0 && (
          <div key={errorFlash} className="hero-balance__sweep hero-balance__sweep--error" />
        )}

        <div className="hero-balance__row">
          <div>
            <div className="hero-balance__label">Current Profit · 24h</div>
            <div className="hero-balance__value">
              {formatUsd(profit)}
            </div>
          </div>
          <span className="hero-balance__chip">
            <StatusDot state={state} />
            {state}
          </span>
        </div>

        <div className="hero-balance__actions">
          {isActive ? (
            <button type="button" className="btn-bot btn-bot--stop" onClick={onStop}>
              Stop Bot
            </button>
          ) : (
            <button type="button" className="btn-bot btn-bot--start" onClick={onStart}>
              Start Bot
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
