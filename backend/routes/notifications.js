import { Router } from "express";
import { getNotifications, markRead, markAllRead, deleteNotification } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const r = Router();

r.get("/:userId",            protect, getNotifications);
r.patch("/:id/read",         protect, markRead);
r.patch("/read-all/:userId", protect, markAllRead);
r.delete("/:id",             protect, deleteNotification);

export default r;
