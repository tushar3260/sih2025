import app from "./app.js";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { setIo } from "./services/socketService.js";

dotenv.config();

const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ayursutra-alpha.vercel.app"
];

if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(",").map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods:     ["GET", "POST"],
    credentials: true,
  },
});

setIo(io);

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // Any user (patient or doctor) joins their personal room for targeted notifications
  socket.on("joinRoom", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined room user-${userId}`);
  });

  // Doctor also joins a named doctor room (legacy compatibility)
  socket.on("joinAsDoctor", (doctorId) => {
    socket.join(`doctor-${doctorId}`);
    console.log(`👨‍⚕️ Doctor ${doctorId} joined room doctor-${doctorId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
