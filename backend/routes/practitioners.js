import { Router } from "express";
import {
  listPractitioners,
  getPractitionerById,
  getPractitionerByUserId,
  createPractitioner,
  updatePractitioner,
  updateAvailability,
} from "../controllers/practitionerController.js";
import { protect, permit } from "../middleware/auth.js";
import { body } from "express-validator";

const r = Router();

r.get("/",                     listPractitioners);
r.get("/user/:userId",         getPractitionerByUserId);
r.get("/:id",                  getPractitionerById);
r.post("/",                    protect, permit("practitioner", "admin"), body("user").notEmpty(), createPractitioner);
r.patch("/:id",                protect, permit("practitioner", "admin"), updatePractitioner);
r.put("/:id/availability",     protect, permit("admin","practitioner"), body("availability").isArray(), updateAvailability);

export default r;
