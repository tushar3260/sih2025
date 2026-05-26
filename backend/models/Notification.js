import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "appointment_booked",
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_completed",
        "appointment_reminder",
        "review_received",
        "general",
      ],
      default: "general",
    },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra payload (appointmentId etc.)
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Notification", notificationSchema);
