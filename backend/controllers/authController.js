import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { HttpError } from "../utils/helpers.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: "Email already in use" });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, passwordHash, role: role || "patient" });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    // Send success response
    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });

  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Compare password
    const ok = await bcrypt.compare(password, user.passwordHash); // ensure bcrypt.compare instead of user.comparePassword
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    res.json({
      success: true,
      message: "Login successful!",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });

  } catch (err) {
    next(err);
  }
};

export const getPatientsList = async (req, res, next) => {
  try {
    const list = await User.find({ role: "patient" }).select("name email phone").lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
};
