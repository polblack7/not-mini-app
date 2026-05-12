import React from "react";
import { Card } from "../ui/Card";
import { NotificationRow } from "./NotificationRow";

const MAX = 4;

export const NotificationList = ({ items }) => (
  <Card padding="4px 14px">
    {items.length === 0 ? (
      <div className="empty-row">No notifications yet.</div>
    ) : (
      items
        .slice(0, MAX)
        .map((n) => <NotificationRow key={n.id || n.created_at} item={n} />)
    )}
  </Card>
);
