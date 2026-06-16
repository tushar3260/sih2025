import { Router } from "express";
import {
  myAppointments, slots, book, cancel,
  getPatientsByDoctorId, updateStatus, getStats,
  getAppointmentsByDoctorId, reschedule,
} from "../controllers/appointmentController.js";
import { protect, permit } from "../middleware/auth.js";

const r = Router();

// Stats for dashboard
r.get("/stats/:userId", protect, getStats);

// Patient appointments
r.get("/me/:userId", protect, myAppointments);

// Doctor's full appointment list (ALL appointments with details)
r.get("/doctor/:pracDocId", protect, permit("practitioner", "admin"), getAppointmentsByDoctorId);

// Doctor's patients (unique)
r.get("/:id", protect, permit("practitioner", "admin"), getPatientsByDoctorId);

// Slots
r.post("/slots", protect, slots);

// Book
r.post("/", protect, book);

// Cancel
r.post("/:id/cancel", protect, cancel);

// Reschedule (cancel old + create new)
r.patch("/:id/reschedule", protect, reschedule);

// Doctor updates status (confirm / complete / cancel)
r.patch("/:id/status", protect, permit("practitioner", "admin"), updateStatus);

export default r;
