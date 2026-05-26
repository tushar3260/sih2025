import { Router } from "express";
import { getProfile, getProfileByUserId, createOrUpdateProfile } from "../controllers/patientController.js";
import { protect } from "../middleware/auth.js";

const r = Router();

r.get("/me",              protect, getProfile);
r.post("/me",             protect, createOrUpdateProfile);
r.get("/by-user/:userId", getProfileByUserId);

export default r;
