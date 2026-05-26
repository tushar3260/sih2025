import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useUser } from "./userContext";

const NotificationContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL   = import.meta.env.VITE_SOCKET_URL   || "http://localhost:5000";

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isPanelOpen,   setIsPanelOpen]   = useState(false);
  const socketRef = useRef(null);

  const userId = user?.id || user?._id;

  // ── Fetch from DB ──────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/notifications/${userId}`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent — notifications are non-critical
    }
  }, [userId]);

  // ── Socket.io real-time ────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinRoom", userId);
      if (user?.role === "practitioner") {
        socket.emit("joinAsDoctor", userId);
      }
    });

    socket.on("notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  // ── Actions ────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await axios.patch(`${API_BASE_URL}/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    if (!userId) return;
    try {
      await axios.patch(`${API_BASE_URL}/notifications/read-all/${userId}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${id}`);
      const removed = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (removed && !removed.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const openPanel  = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isPanelOpen,
      openPanel,
      closePanel,
      markRead,
      markAllRead,
      deleteNotif,
      fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
