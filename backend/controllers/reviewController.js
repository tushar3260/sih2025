import Review from "../models/Review.js";
import Appointment from "../models/Appointment.js";
import Practitioner from "../models/Practitioner.js";
import { createNotification } from "./notificationController.js";

// ─────────────────────────────────────────────────────────────
// POST /api/reviews
// ─────────────────────────────────────────────────────────────
export const createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({ error: "appointmentId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Get appointment to validate it's completed
    const appt = await Appointment.findById(appointmentId)
      .populate("patient", "name _id")
      .populate({ path: "practitioner", populate: { path: "user", select: "name _id" } });

    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    if (appt.status !== "completed") {
      return res.status(400).json({ error: "Reviews can only be submitted for completed appointments" });
    }

    // Create review
    const review = await Review.create({
      patient:      appt.patient._id,
      practitioner: appt.practitioner._id,
      appointment:  appointmentId,
      rating,
      comment: comment || "",
    });

    // Notify doctor
    if (appt.practitioner?.user?._id) {
      await createNotification({
        userId:  appt.practitioner.user._id,
        title:   "New Review Received ⭐",
        message: `${appt.patient.name} gave you ${rating} star${rating > 1 ? "s" : ""}.${comment ? ` "${comment.slice(0, 60)}…"` : ""}`,
        type:    "review_received",
        data:    { reviewId: review._id, appointmentId },
      });
    }

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "You have already reviewed this appointment" });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reviews/:practitionerId
// ─────────────────────────────────────────────────────────────
export const getReviewsByPractitioner = async (req, res, next) => {
  try {
    const reviews = await Review.find({ practitioner: req.params.practitionerId })
      .populate("patient", "name")
      .sort({ createdAt: -1 })
      .lean();

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    res.json({ reviews, avgRating, total: reviews.length });
  } catch (err) {
    next(err);
  }
};
