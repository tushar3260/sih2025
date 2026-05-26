import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider }          from "./context/userContext";
import { NotificationProvider }  from "./context/notificationContext";
import { NotificationPanel }     from "./components/NotificationCenter";
import ProtectedRoute            from "./components/ProtectedRoute";

// ── Lazy load ALL pages — they only download when the user navigates to them
const AyurvedaLanding        = lazy(() => import("./pages/AyurvedaLanding"));
const Login                  = lazy(() => import("./pages/LoginPage"));
const SignupPage              = lazy(() => import("./pages/SignupPage"));
const PatientDashboard       = lazy(() => import("./pages/PatientDashboard"));
const AyurvedaDoctorDashboard = lazy(() => import("./pages/AyurvedaDoctorDashboard"));
const Therapies              = lazy(() => import("./pages/Therapies"));
const BookAppointment        = lazy(() => import("./pages/BookAppointment"));
const CreateTherapyForm      = lazy(() => import("./pages/CreateTherapyForm"));
const PatientAppointments    = lazy(() => import("./pages/patientappointment"));
const AddTherapy             = lazy(() => import("./pages/AddTherapy"));
const PanchakarmaAIsystem    = lazy(() => import("./pages/PanchkarmaAIsystem"));
const PractitionerForm       = lazy(() => import("./pages/PractitionerForm"));
const Record                 = lazy(() => import("./pages/Record"));
const HealthInfo             = lazy(() => import("./pages/HealthInfo"));

// Minimal spinner shown while a lazy chunk loads (usually < 200ms)
const PageLoader = () => (
  <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-3 border-emerald-900 border-t-transparent animate-spin" />
      <span className="text-stone-400 text-sm font-medium">Loading…</span>
    </div>
  </div>
);

const App = () => (
  <UserProvider>
    <NotificationProvider>
      {/* Global notification panel — always mounted, renders on demand */}
      <NotificationPanel />

      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Public ── */}
            <Route path="/"                   element={<AyurvedaLanding />} />
            <Route path="/login"              element={<Login />} />
            <Route path="/register"           element={<SignupPage />} />
            <Route path="/therapies"          element={<Therapies />} />
            <Route path="/healthinfo"         element={<HealthInfo />} />
            <Route path="/practitioner-setup" element={<PractitionerForm />} />

            {/* ── Protected Patient ── */}
            <Route path="/dashboard"
              element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
            <Route path="/book/:id"
              element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
            <Route path="/appointments"
              element={<ProtectedRoute><PatientAppointments /></ProtectedRoute>} />
            <Route path="/ai-consultant"
              element={<ProtectedRoute><PanchakarmaAIsystem /></ProtectedRoute>} />

            {/* ── Protected Doctor ── */}
            <Route path="/doctor-dashboard"
              element={<ProtectedRoute><AyurvedaDoctorDashboard /></ProtectedRoute>} />
            <Route path="/add-therapy"
              element={<ProtectedRoute><AddTherapy /></ProtectedRoute>} />
            <Route path="/create-therapy"
              element={<ProtectedRoute><CreateTherapyForm /></ProtectedRoute>} />
            <Route path="/record"
              element={<ProtectedRoute><Record /></ProtectedRoute>} />

          </Routes>
        </Suspense>
      </Router>
    </NotificationProvider>
  </UserProvider>
);

export default App;
