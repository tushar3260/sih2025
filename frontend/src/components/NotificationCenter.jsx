import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, CheckCheck, Trash2,
  Calendar, Star, Info, CheckCircle2, XCircle
} from "lucide-react";
import { useNotifications } from "../context/notificationContext";

// ── Icon per notification type ────────────────────────────────
const TYPE_CONFIG = {
  appointment_booked:    { icon: Calendar,     color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-100"   },
  appointment_confirmed: { icon: CheckCircle2, color: "text-emerald-600",bg: "bg-emerald-50", border: "border-emerald-100" },
  appointment_cancelled: { icon: XCircle,      color: "text-red-500",    bg: "bg-red-50",     border: "border-red-100"    },
  appointment_completed: { icon: CheckCheck,   color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-100" },
  review_received:       { icon: Star,         color: "text-amber-500",  bg: "bg-amber-50",   border: "border-amber-100"  },
  general:               { icon: Info,         color: "text-stone-500",  bg: "bg-stone-50",   border: "border-stone-100"  },
};

const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)     return "just now";
  if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

// ── Bell Icon ─────────────────────────────────────────────────
export const NotificationBell = ({ className = "" }) => {
  const { unreadCount, openPanel } = useNotifications();
  return (
    <button
      onClick={openPanel}
      className={`relative p-2 rounded-full hover:bg-white/20 transition-all group ${className}`}
      aria-label="Notifications"
    >
      <Bell size={22} className="text-current group-hover:scale-110 transition-transform" />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

// ── Slide-out Panel ───────────────────────────────────────────
export const NotificationPanel = () => {
  const {
    notifications, unreadCount,
    isPanelOpen, closePanel,
    markRead, markAllRead, deleteNotif,
  } = useNotifications();

  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (isPanelOpen && panelRef.current && !panelRef.current.contains(e.target)) {
        closePanel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isPanelOpen]);

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-[2px]"
            onClick={closePanel}
          />

          {/* Panel */}
          <motion.aside
            ref={panelRef}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            style={{ willChange: "transform" }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white/98 backdrop-blur-[8px] border-l border-stone-200/60 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Bell size={18} />
                  <h2 className="font-bold text-lg">Notifications</h2>
                </div>
                <p className="text-emerald-300 text-xs font-medium">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up ✓"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
                <button onClick={closePanel}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100/80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-stone-400">
                  <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                    <Bell size={32} className="opacity-30" />
                  </div>
                  <p className="font-medium text-stone-500">No notifications yet</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => {
                    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={notif._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => !notif.isRead && markRead(notif._id)}
                        className={`flex gap-4 px-5 py-4 cursor-pointer transition-all hover:bg-stone-50/80 group relative
                          ${!notif.isRead ? "bg-emerald-50/40" : ""}`}
                      >
                        {/* Unread dot */}
                        {!notif.isRead && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}

                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center shrink-0`}>
                          <Icon size={18} className={cfg.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold mb-0.5 ${notif.isRead ? "text-stone-600" : "text-stone-900"}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-stone-400 mt-1.5 font-medium">{timeAgo(notif.createdAt)}</p>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-stone-400 hover:text-red-500 transition-all shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-4 border-t border-stone-100 bg-stone-50/80 text-center">
                <p className="text-xs text-stone-400 font-medium">
                  Showing last {notifications.length} notifications
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
