import React from "react";
import { Card } from "../ui/Card";
import { LogRow } from "./LogRow";

const MAX = 5;

export const LogList = ({ items }) => (
  <Card padding={14}>
    {items.length === 0 ? (
      <div className="empty-row">No logs yet.</div>
    ) : (
      items.slice(0, MAX).map((l) => <LogRow key={l.id || l.created_at} item={l} />)
    )}
  </Card>
);
