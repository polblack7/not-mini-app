import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

export const NotificationsPanel = () => {
  const [items, setItems] = useState([]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const load = async () => {
    const data = await api.notifications(20);
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    const ids = items.filter((item) => !item.read && item.id).map((item) => item.id);
    if (ids.length === 0) return;
    await api.markNotifications(ids);
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <section className="card notification-panel">
      <div className="panel-header">
        <h3>Notifications</h3>
        <div className="panel-actions">
          <span className="badge">{unreadCount}</span>
          <button className="ghost" onClick={markAllRead}>
            Mark as read
          </button>
        </div>
      </div>
      <div className="panel-list">
        {items.length === 0 ? (
          <p className="muted">No notifications yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id || item.created_at} className={item.read ? "panel-item" : "panel-item unread"}>
              <div>
                <p className="panel-title">{item.title}</p>
                <p className="panel-message">{item.message}</p>
              </div>
              <span className="panel-meta">{new Date(item.created_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
