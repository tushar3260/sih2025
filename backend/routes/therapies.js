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

const r = Router();

// List all (supports ?category=&search= query params)
r.get("/",                            listTherapies);
r.get("/user/:userId",                getTherapiesByUserId);
r.get("/practitioner/:practitionerId",getTherapiesByPractitionerId);
r.get("/:id",                         getTherapyById);
r.post("/",                           createTherapy);
r.patch("/:id",                       updateTherapy);
r.delete("/:id",                      deleteTherapy);

export default r;
