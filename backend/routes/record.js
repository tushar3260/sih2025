import express from "express";
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} from "../controllers/recordController.js";
import { protect, permit } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, permit("practitioner", "admin"), createRecord);
router.get("/", protect, getRecords);
router.get("/:id", protect, getRecordById);
router.put("/:id", protect, permit("practitioner", "admin"), updateRecord);
router.delete("/:id", protect, permit("practitioner", "admin"), deleteRecord);

export default router;