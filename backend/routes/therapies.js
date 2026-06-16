import { Router } from "express";
import {
  listTherapies,
  getTherapyById,
  getTherapiesByUserId,
  getTherapiesByPractitionerId,
  createTherapy,
  updateTherapy,
  deleteTherapy,
} from "../controllers/therapyController.js";
import { protect, permit } from "../middleware/auth.js";

const r = Router();

// List all (supports ?category=&search= query params)
r.get("/",                            listTherapies);
r.get("/user/:userId",                getTherapiesByUserId);
r.get("/practitioner/:practitionerId",getTherapiesByPractitionerId);
r.get("/:id",                         getTherapyById);
r.post("/",                           protect, permit("practitioner", "admin"), createTherapy);
r.patch("/:id",                       protect, permit("practitioner", "admin"), updateTherapy);
r.delete("/:id",                      protect, permit("practitioner", "admin"), deleteTherapy);

export default r;
