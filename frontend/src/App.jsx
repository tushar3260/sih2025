import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loading from "./pages/Loading";
import AyurvedaLanding from "./pages/AyurvedaLanding";
import Login from "./pages/LoginPage";
import PatientDashboard from "./pages/PatientDashboard";
import SignupPage from "./pages/SignupPage";
import AyurvedaDoctorDashboard from "./pages/AyurvedaDoctorDashboard";
import Therapies from "./pages/Therapies";
import BookAppointment from "./pages/BookAppointment";
import { UserProvider } from "./context/userContext";
import CreateTherapyForm from "./pages/CreateTherapyForm";
import PatientAppointments from "./pages/patientappointment";
import AddTherapy from "./pages/AddTherapy";
import PanchakarmaAIsystem from "./pages/PanchkarmaAIsystem";
import PractitionerForm from "./pages/PractitionerForm";
import Record from "./pages/Record";
import ProtectedRoute from "./components/ProtectedRoute";
import HealthInfo from "./pages/HealthInfo";

const App = () => {
  return (
    <UserProvider>
      <Router>
        <Routes>

          {/* ✅ Public Routes */}
          <Route path="/" element={<AyurvedaLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignupPage />} />

          {/* ✅ Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/book/:id"
            element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <PatientAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-therapy"
            element={
              
                <AddTherapy />
             
            }
          />
          <Route path="/therapies" element={<Therapies />} />
          <Route
            path="/record"
            element={
              
                <Record />
              
            }
          />
          <Route path="/practitioner-setup" element={<PractitionerForm />} />
          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute>
                <UserProvider>
                  <AyurvedaDoctorDashboard />
                </UserProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-therapy"
            element={
              
                <CreateTherapyForm />
              
            }
          />

          <Route
            path="/healthinfo"
            element={
              
                <HealthInfo />
              
            }
          />
        

          <Route
            path="/ai-consultant"
            element={
              <ProtectedRoute>
                <PanchakarmaAIsystem />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;
