import Patient from "../models/Patient.js";
import User from "../models/User.js";

// GET /api/patients/me  — requires auth token
export const getProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id })
      .populate("user", "name email phone")
      .lean();

    res.json(patient || {
      user: { _id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone },
    });
  } catch (err) { next(err); }
};

// GET /api/patients/by-user/:userId  — open, used by doctors
export const getProfileByUserId = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.params.userId })
      .populate("user", "name email phone")
      .lean();
    res.json(patient || null);
  } catch (err) { next(err); }
};

// POST /api/patients/me  — upsert full profile
export const createOrUpdateProfile = async (req, res, next) => {
  try {
    const allowed = [
      "dob", "gender", "bloodGroup", "medicalHistory", "allergies",
      "prakriti", "address", "emergencyContact", "lifestyle"
    ];
    const update = { user: req.user._id };
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const doc = await Patient.findOneAndUpdate(
      { user: req.user._id },
      update,
      { upsert: true, new: true, runValidators: true }
    ).populate("user", "name email phone");

    res.json(doc);
  } catch (err) { next(err); }
};
