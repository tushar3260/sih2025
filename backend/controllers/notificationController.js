import Notification from "../models/Notification.js";
import { notifyUser } from "../services/socketService.js";

// ─────────────────────────────────────────────────────────────
// Helper: create a notification in DB + emit via Socket.io
// ─────────────────────────────────────────────────────────────
export const createNotification = async ({ userId, title, message, type, data = {} }) => {
  const notif = await Notification.create({ userId, title, message, type, data });
  // Real-time push to the user's socket room
  notifyUser(String(userId), {
    _id:       notif._id,
    title:     notif.title,
    message:   notif.message,
    type:      notif.type,
    isRead:    false,
    data:      notif.data,
    createdAt: notif.createdAt,
  });
  return notif;
};

// ─────────────────────────────────────────────────────────────
// GET /api/notifications/:userId
// ─────────────────────────────────────────────────────────────
export const getNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// ─────────────────────────────────────────────────────────────
export const markRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all/:userId
// ─────────────────────────────────────────────────────────────
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// ─────────────────────────────────────────────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
