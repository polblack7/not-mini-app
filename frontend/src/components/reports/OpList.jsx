import React from "react";
import { Card } from "../ui/Card";
import { OpRow } from "./OpRow";

const MAX = 12;

export const OpList = ({ ops }) => (
  <Card padding={4}>
    {ops.length === 0 ? (
      <div className="empty-row" style={{ padding: 16 }}>
        No operations yet.
      </div>
    ) : (
      ops.slice(0, MAX).map((op) => (
        <OpRow key={op.id || `${op.pair}-${op.timestamp}`} op={op} />
      ))
    )}
  </Card>
);
