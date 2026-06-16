import { Router } from "express";
import { register, login, getPatientsList } from "../controllers/authController.js";
import { registerValidation, loginValidation } from "../utils/validation.js";
import { runValidation } from "../middleware/validation.js";
import { protect } from "../middleware/auth.js";

const r = Router();

r.post("/register", registerValidation, runValidation, register);
r.post("/login",  loginValidation, runValidation, login);
r.get("/patients", protect, getPatientsList);

export default r;
