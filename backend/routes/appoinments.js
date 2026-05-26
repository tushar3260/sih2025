import { Router } from "express";
import {
  myAppointments, slots, book, cancel,
  getPatientsByDoctorId, updateStatus, getStats,
  getAppointmentsByDoctorId, reschedule,
} from "../controllers/appointmentController.js";

const r = Router();

// Stats for dashboard
r.get("/stats/:userId", getStats);

// Patient appointments
r.get("/me/:userId", myAppointments);

// Doctor's full appointment list (ALL appointments with details)
r.get("/doctor/:pracDocId", getAppointmentsByDoctorId);

// Doctor's patients (unique)
r.get("/:id", getPatientsByDoctorId);

// Slots
r.post("/slots", slots);

// Book
r.post("/", book);

// Cancel
r.post("/:id/cancel", cancel);

// Reschedule (cancel old + create new)
r.patch("/:id/reschedule", reschedule);

// Doctor updates status (confirm / complete / cancel)
r.patch("/:id/status", updateStatus);

export default r;
