import Practitioner from "../models/Practicioner.js";
import User from "../models/User.js";

// ── List all practitioners ────────────────────────────────────
export const listPractitioners = async (req, res, next) => {
  try {
    const items = await Practitioner.find()
      .populate("user", "name email phone role")
      .lean();
    res.json(items);
  } catch (err) { next(err); }
};

// ── Get single practitioner by DB id ─────────────────────────
export const getPractitionerById = async (req, res, next) => {
  try {
    const doc = await Practitioner.findById(req.params.id)
      .populate("user", "name email phone role")
      .lean();
    if (!doc) return res.status(404).json({ error: "Practitioner not found" });
    res.json(doc);
  } catch (err) { next(err); }
};

// ── Get practitioner by User ID ───────────────────────────────
export const getPractitionerByUserId = async (req, res, next) => {
  try {
    const doc = await Practitioner.findOne({ user: req.params.userId })
      .populate("user", "name email phone role")
      .lean();
    if (!doc) return res.status(404).json({ error: "Practitioner profile not found" });
    res.json(doc);
  } catch (err) { next(err); }
};

// ── Create practitioner ───────────────────────────────────────
export const createPractitioner = async (req, res, next) => {
  try {
    const {
      user, specialty = [], availability = [],
      bio = "", qualifications = [], experience = 0,
      languages = [], consultationFee = 0
    } = req.body;

    const userExists = await User.findById(user);
    if (!userExists) return res.status(400).json({ error: "User not found" });

    // Check if already exists
    const existing = await Practitioner.findOne({ user });
    if (existing) {
      return res.status(409).json({ error: "Practitioner profile already exists for this user" });
    }

    const doc = await Practitioner.create({
      user, specialty, availability,
      bio, qualifications, experience,
      languages, consultationFee
    });

    const populated = await doc.populate("user", "name email role");
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

// ── Update practitioner profile ───────────────────────────────
export const updatePractitioner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = [
      "specialty", "availability", "breaks",
      "bio", "qualifications", "experience",
      "languages", "consultationFee", "profilePhoto"
    ];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const updated = await Practitioner.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate("user", "name email phone role")
      .lean();

    if (!updated) return res.status(404).json({ error: "Practitioner not found" });
    res.json(updated);
  } catch (err) { next(err); }
};

// ── Update availability ───────────────────────────────────────
export const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    if (!Array.isArray(availability))
      return res.status(400).json({ error: "Availability must be an array" });

    const updated = await Practitioner.findByIdAndUpdate(
      req.params.id, { availability }, { new: true }
    ).populate("user", "name email role").lean();

    if (!updated) return res.status(404).json({ error: "Practitioner not found" });
    res.json(updated);
  } catch (err) { next(err); }
};
