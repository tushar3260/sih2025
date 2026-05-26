import { Router } from "express";
import { createReview, getReviewsByPractitioner } from "../controllers/reviewController.js";

const r = Router();

r.post("/",              createReview);
r.get("/:practitionerId", getReviewsByPractitioner);

export default r;
