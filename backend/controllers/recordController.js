import Record from "../models/Record.js";
import Patient from "../models/Patient.js";
import Therapy from "../models/Therapy.js";
import Practitioner from "../models/Practicioner.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// POST /api/records  — Create new Record
// ─────────────────────────────────────────────
export const createRecord = async (req, res) => {
  try {
    const { patient, therapy, doctor, sessionDate, notes, status, payment } = req.body;

    if (!patient || !therapy || !doctor || !sessionDate || !status) {
      return res.status(400).json({
        message: "Patient, therapy, doctor, sessionDate, and status are required",
      });
    }

    const patientId = mongoose.Types.ObjectId.isValid(patient)
      ? new mongoose.Types.ObjectId(patient)
      : null;
    const therapyId = mongoose.Types.ObjectId.isValid(therapy)
      ? new mongoose.Types.ObjectId(therapy)
      : null;
    const doctorId = mongoose.Types.ObjectId.isValid(doctor)
      ? new mongoose.Types.ObjectId(doctor)
      : null;

    if (!patientId || !therapyId || !doctorId) {
      return res.status(400).json({ message: "One or more IDs are invalid" });
    }

    // Validate patient (must exist as a User with role "patient")
    const [patientExists, therapyExists, doctorExists] = await Promise.all([
      User.findOne({ _id: patientId, role: "patient" }),
      Therapy.findById(therapyId),
      Practitioner.findById(doctorId),
    ]);

    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (!therapyExists) {
      return res.status(404).json({ message: "Therapy not found" });
    }
    if (!doctorExists) {
      return res.status(404).json({ message: "Doctor (Practitioner) not found" });
    }

    // ✅ Fix: payment.method must match enum ["Cash","Card","UPI","Insurance"]
    // Remove non-schema field "status" from payment
    const safePayment = {
      amount: payment?.amount || 0,
      paid: payment?.paid || false,
      method: ["Cash", "Card", "UPI", "Insurance"].includes(payment?.method)
        ? payment.method
        : "Cash",
    };

    const record = await Record.create({
      patient: patientId,
      therapy: therapyId,
      doctor: doctorId,
      sessionDate,
      notes: notes || "",
      status,
      payment: safePayment,
    });

    res.status(201).json(record);
  } catch (err) {
    console.error("Error creating record:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/records  — Get all Records
// ─────────────────────────────────────────────
export const getRecords = async (req, res) => {
  try {
    const records = await Record.find()
      .populate("patient", "name email")
      .populate("therapy", "name code duration price")
      .populate("doctor", "user specialty")
      .lean();

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/records/:id  — Get Record by ID
// ─────────────────────────────────────────────
export const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const record = await Record.findById(id)
      .populate("patient", "name email role")
      .populate("therapy", "name code duration price")
      .populate({ path: "doctor", populate: { path: "user", select: "name email" } })
      .lean();

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/records/:id  — Update Record
// ─────────────────────────────────────────────
export const updateRecord = async (req, res) => {
  try {
    const record = await Record.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!record) return res.status(404).json({ message: "Record not found" });

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/records/:id  — Delete Record
// ─────────────────────────────────────────────
export const deleteRecord = async (req, res) => {
  try {
    const record = await Record.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
