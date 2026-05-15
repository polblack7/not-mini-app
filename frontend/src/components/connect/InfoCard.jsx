import React from "react";
import { Icon } from "../ui/Icon";
import { COLORS } from "../ui/tokens";

export const InfoCard = ({ title, body }) => (
  <div className="info-card">
    <div className="info-card__icon">
      <Icon name="shield" size={16} color={COLORS.primary} />
    </div>
    <div>
      <div className="info-card__title">{title}</div>
      <div className="info-card__body">{body}</div>
    </div>
  </div>
);
