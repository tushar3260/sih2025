import { Router } from "express";
import { getNotifications, markRead, markAllRead, deleteNotification } from "../controllers/notificationController.js";

const r = Router();

r.get("/:userId",            getNotifications);
r.patch("/:id/read",         markRead);
r.patch("/read-all/:userId", markAllRead);
r.delete("/:id",             deleteNotification);

export default r;
