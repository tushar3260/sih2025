import express from "express";
import connectToDb from "./models/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import UserRoutes from "./routes/auth.js"
import patientroutes from './routes/patients.js'
import appointmentroutes from './routes/appoinments.js'
import PracticionerRoutes from "./routes/practitioners.js";
import recordRoutes from "./routes/record.js"
import therepyRoutes from "./routes/therapies.js"
import { notifyBooking } from "./services/notificationService.js";

// const testBooking = async () => {
//   await notifyBooking({
//     patientEmail: "aroravartul@gmail.com",
//     patientName: "Ravi Kumar",
//     practitionerEmail: "aroravartul5@gmail.com",
//     when: new Date(),   // abhi ka time
//   });
// };

// testBooking();

// import Workspaceoutes from "./routes/workspace.routes.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(
    {
        origin: ["http://localhost:5173","https://ayursutra-alpha.vercel.app/"],
        credentials: true,

    }
));
app.use(cookieParser());
connectToDb()

app.use("/api/user", UserRoutes);
app.use("/api/therapies", therepyRoutes);
app.use("/api/practitioners", PracticionerRoutes);
app.use("/api/patients", patientroutes);
app.use("/api/appointments", appointmentroutes);
app.use("/api/records", recordRoutes);
app.get("/", (req, res) => {
    res.send("Hello World");
});

export default app;