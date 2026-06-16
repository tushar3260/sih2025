import Appointment from "../models/Appointment.js";
import Practitioner from "../models/Practitioner.js";
import Therapy from "../models/Therapy.js";
import User from "../models/User.js";
import { notifyDoctor } from "../services/socketService.js";
import { createNotification } from "./notificationController.js";
import { HttpError } from "../utils/helpers.js";
import { notifyBooking } from "../services/notificationService.js";
import { generateSlots } from "../services/scheduling.js";
import dayjs from "dayjs";

// ─────────────────────────────────────────────
// GET /api/appointments/me/:userId
// ─────────────────────────────────────────────
export const myAppointments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const query = { patient: userId };
    const statusFilter = req.query.status;
    if (statusFilter && statusFilter !== "all") query.status = statusFilter;

    const items = await Appointment.find(query)
      .populate("therapy", "name duration description price")
      .populate({ path: "practitioner", populate: { path: "user", select: "name email" } })
      .sort({ start: 1 })
      .lean();

    res.json(items);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/appointments/stats/:userId
// Dashboard stats for patient or doctor
// ─────────────────────────────────────────────
export const getStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.query; // "patient" or "practitioner"

    let query = {};
    if (role === "practitioner") {
      // find their practitioner doc first
      const prac = await Practitioner.findOne({ user: userId });
      if (!prac) return res.json({ total: 0, upcoming: 0, completed: 0, cancelled: 0, thisWeek: 0 });
      query.practitioner = prac._id;
    } else {
      query.patient = userId;
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const [total, upcoming, completed, cancelled, thisWeek] = await Promise.all([
      Appointment.countDocuments(query),
      Appointment.countDocuments({ ...query, status: { $in: ["confirmed", "pending"] }, start: { $gte: now } }),
      Appointment.countDocuments({ ...query, status: "completed" }),
      Appointment.countDocuments({ ...query, status: "cancelled" }),
      Appointment.countDocuments({ ...query, createdAt: { $gte: weekStart } }),
    ]);

    res.json({ total, upcoming, completed, cancelled, thisWeek });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/appointments/slots
// Returns available time slots for booking
// Body: { practitionerId, therapyId, from?, to? }
// ─────────────────────────────────────────────
export const slots = async (req, res, next) => {
  try {
    const { practitionerId, therapyId, from, to } = req.body;

    if (!practitionerId || !therapyId) {
      return res.status(400).json({ error: "practitionerId and therapyId are required" });
    }

    const therapy = await Therapy.findById(therapyId).lean();
    if (!therapy) return res.status(404).json({ error: "Therapy not found" });

    // Default window: today → 14 days from now
    const start = from ? dayjs(from) : dayjs().startOf("day");
    const end   = to   ? dayjs(to)   : start.add(14, "day").endOf("day");

    const available = await generateSlots(practitionerId, therapy.duration, start, end);
    res.json(available);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/appointments
// Book a new appointment
// ─────────────────────────────────────────────
export const book = async (req, res, next) => {
  try {
    const { patientId, therapyId, start, notes } = req.body;

    if (!patientId || !therapyId || !start) {
      return res.status(400).json({ error: "patientId, therapyId, and start are required" });
    }

    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const therapy = await Therapy.findById(therapyId).populate("practitioner");
    if (!therapy) return res.status(404).json({ error: "Therapy not found" });
    if (!therapy.practitioner) return res.status(400).json({ error: "No practitioner for this therapy" });

    const practitionerUser = therapy.practitioner;

    let practitionerDoc = await Practitioner.findOne({ user: practitionerUser._id });
    if (!practitionerDoc) {
      practitionerDoc = await Practitioner.create({
        user: practitionerUser._id,
        specialty: ["General"],
        availability: [],
        breaks: [],
      });
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return res.status(400).json({ error: "Invalid start date" });
    if (startDate <= new Date()) return res.status(400).json({ error: "Appointment must be in the future" });

    const endDate = new Date(startDate.getTime() + therapy.duration * 60000);

    const appointment = await Appointment.create({
      patient: patientId,
      practitioner: practitionerDoc._id,
      therapy: therapyId,
      start: startDate,
      end: endDate,
      notes: notes || "",
      status: "confirmed",
    });

    const populated = await Appointment.findById(appointment._id)
      .populate("patient", "name email phone")
      .populate({ path: "practitioner", populate: { path: "user", select: "name email" } })
      .populate("therapy", "name duration price description");

    // 🔔 Notify doctor via socket + DB
    const dateStr = startDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    notifyDoctor(practitionerUser._id, {
      message: `New appointment by ${patient.name} for ${therapy.name}`,
      appointment: populated,
    });
    await createNotification({
      userId:  practitionerUser._id,
      title:   "New Appointment Booked 📅",
      message: `${patient.name} booked ${therapy.name} on ${dateStr}`,
      type:    "appointment_booked",
      data:    { appointmentId: appointment._id },
    });

    // 🔔 Notify patient via DB
    await createNotification({
      userId:  patientId,
      title:   "Booking Confirmed ✅",
      message: `Your ${therapy.name} session on ${dateStr} is confirmed.`,
      type:    "appointment_confirmed",
      data:    { appointmentId: appointment._id },
    });

    // 📧 Email (non-fatal)
    try {
      await notifyBooking({
        patientEmail:      patient.email,
        patientName:       patient.name,
        practitionerEmail: practitionerUser.email,
        when:              startDate,
      });
    } catch (emailErr) {
      console.warn("Email failed (non-fatal):", emailErr.message);
    }

    return res.status(201).json({ message: "Appointment booked successfully", appointment: populated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/appointments/:id/cancel
// ─────────────────────────────────────────────
export const cancel = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const appt = await Appointment.findById(req.params.id)
      .populate("patient", "name email _id")
      .populate({ path: "practitioner", populate: { path: "user", select: "name _id" } })
      .populate("therapy", "name");

    if (!appt) throw new HttpError(404, "Appointment not found");
    if (appt.status === "cancelled") return res.status(400).json({ error: "Already cancelled" });

    const isPatient      = String(appt.patient?._id) === userId;
    const isPractitioner = String(appt.practitioner?.user?._id) === userId;
    const isAdmin        = role === "admin";

    if (!isPatient && !isPractitioner && !isAdmin) throw new HttpError(403, "Not authorized");

    appt.status = "cancelled";
    await appt.save();

    const therapyName = appt.therapy?.name || "your session";
    const dateStr     = new Date(appt.start).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    // Notify patient
    if (appt.patient?._id) {
      await createNotification({
        userId:  appt.patient._id,
        title:   "Appointment Cancelled",
        message: `Your ${therapyName} on ${dateStr} has been cancelled.`,
        type:    "appointment_cancelled",
        data:    { appointmentId: appt._id },
      });
    }
    // Notify doctor
    if (appt.practitioner?.user?._id) {
      await createNotification({
        userId:  appt.practitioner.user._id,
        title:   "Appointment Cancelled",
        message: `${appt.patient?.name || "A patient"} cancelled ${therapyName} on ${dateStr}.`,
        type:    "appointment_cancelled",
        data:    { appointmentId: appt._id },
      });
    }

    res.json({ ok: true, message: "Appointment cancelled" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/appointments/:id/status
// Doctor updates appointment status
// ─────────────────────────────────────────────
export const updateStatus = async (req, res, next) => {
  try {
    const { status, doctorUserId } = req.body;
    const allowed = ["confirmed", "completed", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
    }

    const appt = await Appointment.findById(req.params.id)
      .populate("patient", "name _id")
      .populate("therapy", "name")
      .populate({ path: "practitioner", populate: { path: "user", select: "_id name" } });

    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    appt.status = status;
    await appt.save();

    const therapyName = appt.therapy?.name || "session";
    const dateStr     = new Date(appt.start).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    const notifConfig = {
      confirmed: {
        title:   "Appointment Confirmed ✅",
        message: `Your ${therapyName} on ${dateStr} has been confirmed by your doctor.`,
        type:    "appointment_confirmed",
      },
      completed: {
        title:   "Session Completed 🎉",
        message: `Your ${therapyName} on ${dateStr} is marked as completed. Please leave a review!`,
        type:    "appointment_completed",
      },
      cancelled: {
        title:   "Appointment Cancelled",
        message: `Your ${therapyName} on ${dateStr} was cancelled by the doctor.`,
        type:    "appointment_cancelled",
      },
    };

    // Notify patient
    if (appt.patient?._id) {
      const cfg = notifConfig[status];
      await createNotification({
        userId:  appt.patient._id,
        title:   cfg.title,
        message: cfg.message,
        type:    cfg.type,
        data:    { appointmentId: appt._id },
      });
    }

    res.json({ ok: true, appointment: appt });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/appointments/:id
// Returns unique patients for a practitioner document
// ─────────────────────────────────────────────
export const getPatientsByDoctorId = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ practitioner: req.params.id })
      .populate("patient", "name email phone")
      .populate("therapy", "name duration price");

    const patientMap = {};
    appointments.forEach((app) => {
      if (app.patient?._id) {
        patientMap[String(app.patient._id)] = {
          _id:   app.patient._id,
          id:    app.patient._id,
          name:  app.patient.name  || "Unknown Patient",
          email: app.patient.email || "No email",
          phone: app.patient.phone,
        };
      }
    });

    res.status(200).json(Object.values(patientMap));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/appointments/doctor/:pracDocId
// Returns ALL appointments (with full details) for a practitioner
// ─────────────────────────────────────────────
export const getAppointmentsByDoctorId = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ practitioner: req.params.pracDocId })
      .populate("patient", "name email phone")
      .populate("therapy", "name duration price description")
      .populate({ path: "practitioner", populate: { path: "user", select: "name email" } })
      .sort({ start: 1 })
      .lean();

    res.status(200).json(appointments);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/appointments/:id/reschedule
// Cancel old appointment and create a new one
// Body: { patientId, start }
// ─────────────────────────────────────────────
export const reschedule = async (req, res, next) => {
  try {
    const { patientId, start } = req.body;
    if (!patientId || !start) {
      return res.status(400).json({ error: "patientId and start are required" });
    }

    const oldAppt = await Appointment.findById(req.params.id)
      .populate("patient", "name email _id")
      .populate({ path: "practitioner", populate: { path: "user", select: "name email _id" } })
      .populate("therapy", "name duration price");

    if (!oldAppt) return res.status(404).json({ error: "Appointment not found" });
    if (String(oldAppt.patient._id) !== patientId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (["completed", "cancelled"].includes(oldAppt.status)) {
      return res.status(400).json({ error: "Cannot reschedule a completed or cancelled appointment" });
    }

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return res.status(400).json({ error: "Invalid start date" });
    if (startDate <= new Date()) return res.status(400).json({ error: "New time must be in the future" });

    const endDate = new Date(startDate.getTime() + (oldAppt.therapy?.duration || 60) * 60000);

    // Cancel old
    oldAppt.status = "cancelled";
    await oldAppt.save();

    // Create new
    const newAppt = await Appointment.create({
      patient:      patientId,
      practitioner: oldAppt.practitioner._id,
      therapy:      oldAppt.therapy._id,
      start:        startDate,
      end:          endDate,
      notes:        oldAppt.notes,
      status:       "confirmed",
    });

    const populated = await Appointment.findById(newAppt._id)
      .populate("patient", "name email")
      .populate({ path: "practitioner", populate: { path: "user", select: "name email" } })
      .populate("therapy", "name duration price");

    const dateStr = startDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const therapyName = oldAppt.therapy?.name || "session";

    await createNotification({
      userId:  patientId,
      title:   "Appointment Rescheduled 🔄",
      message: `Your ${therapyName} has been rescheduled to ${dateStr}.`,
      type:    "appointment_confirmed",
      data:    { appointmentId: newAppt._id },
    });
    if (oldAppt.practitioner?.user?._id) {
      await createNotification({
        userId:  oldAppt.practitioner.user._id,
        title:   "Appointment Rescheduled 🔄",
        message: `${oldAppt.patient?.name} rescheduled ${therapyName} to ${dateStr}.`,
        type:    "appointment_booked",
        data:    { appointmentId: newAppt._id },
      });
    }

    res.status(201).json({ message: "Appointment rescheduled", appointment: populated });
  } catch (err) {
    next(err);
  }
};


