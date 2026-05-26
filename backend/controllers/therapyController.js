import Therapy from "../models/Therapy.js";
import { HttpError } from "../utils/helpers.js";

// ── List all active therapies ─────────────────────────────────
export const listTherapies = async (req, res, next) => {
  try {
    const filter = { isActive: { $ne: false } };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };

    const items = await Therapy.find(filter)
      .populate("practitioner", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(items);
  } catch (err) { next(new HttpError(500, "Failed to fetch therapies")); }
};

// ── Get therapy by ID ─────────────────────────────────────────
export const getTherapyById = async (req, res, next) => {
  try {
    const therapy = await Therapy.findById(req.params.id)
      .populate("practitioner", "name email")
      .lean();
    if (!therapy) return res.status(404).json({ message: "Therapy not found." });
    res.status(200).json(therapy);
  } catch (err) { next(new HttpError(500, "Failed to fetch therapy")); }
};

// ── Get therapies by practitioner user ID ─────────────────────
export const getTherapiesByPractitionerId = async (req, res, next) => {
  try {
    const therapies = await Therapy.find({ practitioner: req.params.practitionerId })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(therapies);
  } catch (err) { next(new HttpError(500, "Failed to fetch therapies for the practitioner")); }
};

// ── Get therapies by patient user ID (legacy) ─────────────────
export const getTherapiesByUserId = async (req, res, next) => {
  try {
    const therapies = await Therapy.find({ patient: req.params.userId }).lean();
    res.status(200).json(therapies);
  } catch (err) { next(new HttpError(500, "Failed to fetch therapies for the user")); }
};

// ── Create therapy ────────────────────────────────────────────
export const createTherapy = async (req, res, next) => {
  try {
    const {
      name, description, code, duration, price,
      practitionerId, category, benefits, contraindications
    } = req.body;

    if (!name || !description || !practitionerId || !code) {
      return res.status(400).json({ message: "Missing required fields: name, description, code, practitionerId" });
    }

    const therapy = await Therapy.create({
      name, description, code, duration: parseInt(duration), price: parseFloat(price),
      practitioner: practitionerId,
      category: category || "Other",
      benefits: benefits || [],
      contraindications: contraindications || [],
    });

    const populated = await Therapy.findById(therapy._id)
      .populate("practitioner", "name email");

    res.status(201).json({ message: "Therapy created successfully", therapy: populated, success: true });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ message: `A therapy with this ${field} already exists.` });
    }
    next(err);
  }
};

// ── Update therapy ────────────────────────────────────────────
export const updateTherapy = async (req, res, next) => {
  try {
    const allowed = ["name", "description", "duration", "price", "category", "benefits", "contraindications", "isActive"];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const therapy = await Therapy.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate("practitioner", "name email");
    if (!therapy) return res.status(404).json({ message: "Therapy not found" });
    res.json({ message: "Therapy updated", therapy, success: true });
  } catch (err) { next(err); }
};

// ── Delete (soft-delete) therapy ──────────────────────────────
export const deleteTherapy = async (req, res, next) => {
  try {
    const therapy = await Therapy.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!therapy) return res.status(404).json({ message: "Therapy not found" });
    res.json({ message: "Therapy removed successfully", success: true });
  } catch (err) { next(err); }
};
