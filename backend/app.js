import express from "express";
import connectToDb from "./models/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import UserRoutes         from "./routes/auth.js";
import patientroutes      from "./routes/patients.js";
import appointmentroutes  from "./routes/appointments.js";
import PracticionerRoutes from "./routes/practitioners.js";
import recordRoutes       from "./routes/record.js";
import therapyRoutes      from "./routes/therapies.js";
import notificationRoutes from "./routes/notifications.js";
import reviewRoutes       from "./routes/reviews.js";
import { errorHandler }   from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ayursutra-alpha.vercel.app"
];

if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(",").map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(cookieParser());

connectToDb();

// ── Routes ──────────────────────────────────────────────
app.use("/api/user",          UserRoutes);
app.use("/api/therapies",     therapyRoutes);
app.use("/api/practitioners", PracticionerRoutes);
app.use("/api/patients",      patientroutes);
app.use("/api/appointments",  appointmentroutes);
app.use("/api/records",       recordRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews",       reviewRoutes);

app.get("/", (req, res) => res.json({ message: "AyurSutra API 🌿", version: "2.0.0" }));

// ── Global error handler (must be last) ─────────────────
app.use(errorHandler);

export default app;