// src/pages/PatientDashboard.jsx
// ✅ Performance-first rewrite — no Three.js, no CDN textures, optimized animations
import React, { useState, useEffect, useCallback, memo } from "react";
import {
  Calendar, Clock, Leaf, Sparkles, X,
  Menu, LogOut, ChevronRight, User,
  ArrowRight, Star, TrendingUp, Lightbulb, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
// recharts removed — using inline SVG sparkline instead
import HealthInfo from "./HealthInfo";
import { NotificationBell } from "../components/NotificationCenter";
import ReviewModal from "../components/ReviewModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ── 1. Global Styles ──────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    :root { --color-bg:#F5F5F4; --color-primary:#064E3B; }
    body { font-family:'Manrope',sans-serif; background:var(--color-bg); color:#1C1917; }
    .serif { font-family:'Playfair Display',serif; }
    /* GPU-composited layers for smooth transforms */
    .anim-card { will-change:transform; transform:translateZ(0); }
    /* Lighter blur for performance */
    .glass { background:rgba(255,255,255,0.65); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.7); }
    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#d6d3d1;border-radius:10px}
  `}</style>
);

// ── 2. Pure-CSS animated background (replaces Three.js) ──────
// Uses only CSS gradients — zero GPU overhead from WebGL
const AnimatedBg = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <style>{`
      @keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.1)} }
      @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-50px,40px) scale(1.05)} }
      @keyframes drift3 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,20px)} 66%{transform:translate(-20px,-10px)} }
      .orb1 { animation:drift1 18s ease-in-out infinite; }
      .orb2 { animation:drift2 22s ease-in-out infinite; }
      .orb3 { animation:drift3 26s ease-in-out infinite; }
    `}</style>
    <div className="orb1 absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-emerald-200/30 blur-3xl" />
    <div className="orb2 absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-200/20 blur-3xl" />
    <div className="orb3 absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full bg-teal-100/20 blur-3xl" />
  </div>
);

// ── 3. Memoized Card (prevents re-renders) ────────────────────
const Card = memo(({ children, className = "", onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: "easeOut" }}
    onClick={onClick}
    className={`glass rounded-2xl p-6 anim-card ${onClick ? "cursor-pointer hover:shadow-lg hover:border-emerald-200/60 transition-shadow duration-200" : ""} ${className}`}
  >
    {children}
  </motion.div>
));

// Status badge
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending:   "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${map[status] || "bg-stone-100 text-stone-600 border-stone-200"}`}>
      {status || "—"}
    </span>
  );
};

// Pure SVG sparkline — zero dependency, butter smooth
const SparkLine = ({ data = [] }) => {
  const W = 300, H = 80, pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / range) * (H - pad * 2),
  ]);
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#064E3B" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#064E3B" stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sg)" />
      <path d={linePath} fill="none" stroke="#064E3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => i === pts.length - 1 && (
        <circle key={i} cx={x} cy={y} r="4" fill="#064E3B" />
      ))}
    </svg>
  );
};

// ── 4. Main Dashboard ─────────────────────────────────────────
const PatientDashboard = () => {
  const [activeSection,        setActiveSection]        = useState("dashboard");
  const [user,                 setUser]                 = useState(null);
  const [appointments,         setAppointments]         = useState([]);
  const [therapies,            setTherapies]            = useState([]);
  const [patientProfile,       setPatientProfile]       = useState(null);
  const [mobileMenu,           setMobileMenu]           = useState(false);
  const [selectedAppointment,  setSelectedAppointment]  = useState(null);
  const [showModal,            setShowModal]            = useState(false);
  const [reviewAppt,           setReviewAppt]           = useState(null);
  const [loading,              setLoading]              = useState(true);

  const navigate = useNavigate();

  const navItems = [
    { id: "dashboard",    label: "Overview",      icon: Activity },
    { id: "appointments", label: "Schedule",      icon: Calendar },
    { id: "therapies",    label: "Therapies",     icon: Leaf     },
    { id: "ai",           label: "AI Consultant", icon: Sparkles },
    { id: "health",       label: "Health Info",   icon: User     },
  ];

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (u) setUser(u);
    fetchData(u?.id || u?._id);
  }, []);

  const fetchData = useCallback(async (userId) => {
    try {
      setLoading(true);
      const [apptRes, therapyRes, profileRes] = await Promise.all([
        userId ? axios.get(`${API_BASE_URL}/appointments/me/${userId}`) : Promise.resolve({ data: [] }),
        axios.get(`${API_BASE_URL}/therapies`),
        userId ? axios.get(`${API_BASE_URL}/patients/by-user/${userId}`).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);
      setAppointments(
        apptRes.data.map(a => ({
          id:          a._id,
          therapyId:   a.therapy?._id || a.therapy,
          title:       a.therapy?.name || "Therapy Session",
          doctor:      a.practitioner?.user?.name || "Expert Vaidya",
          date:        new Date(a.start).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          time:        new Date(a.start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          status:      a.status,
          description: a.therapy?.description,
          price:       a.therapy?.price,
        }))
      );
      setTherapies(Array.isArray(therapyRes.data) ? therapyRes.data : []);
      if (profileRes.data) setPatientProfile(profileRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // ── Dashboard Tab ────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Sessions",  val: appointments.length,       icon: Calendar, color: "emerald" },
          { label: "Hours",     val: +(appointments.length * 1.5).toFixed(1), icon: Clock, color: "amber" },
          { label: "Therapies", val: therapies.length,          icon: Leaf,     color: "teal"    },
          { label: "Wellness",  val: "Good",                    icon: Activity, color: "blue"    },
        ].map(({ label, val, icon: Icon, color }, i) => (
          <Card key={label} delay={i * 0.05} className={`flex items-center gap-4 hover:border-${color}-300/40 transition-colors`}>
            <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-700 shrink-0`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-bold uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold serif text-stone-900">{val}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming */}
        <div className="lg:col-span-2">
          <Card delay={0.15}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold serif text-stone-900">Upcoming Sessions</h3>
              <button onClick={() => setActiveSection("appointments")}
                className="text-sm font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors">
                View All <ChevronRight size={15} />
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10 text-stone-400">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading…
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No upcoming appointments</p>
                  <button onClick={() => setActiveSection("therapies")}
                    className="mt-4 px-5 py-2 bg-emerald-900 text-white rounded-full text-sm font-bold hover:bg-emerald-800 transition-colors">
                    Book a Session
                  </button>
                </div>
              ) : (
                appointments.slice(0, 3).map((appt, i) => (
                  <div key={appt.id}
                    onClick={() => { setSelectedAppointment(appt); setShowModal(true); }}
                    className="anim-card flex items-center gap-4 p-4 rounded-xl bg-white/50 border border-stone-100 hover:border-emerald-200 hover:bg-white/80 transition-all cursor-pointer group">
                    <div className="w-14 h-14 rounded-xl bg-stone-100 flex flex-col items-center justify-center text-stone-700 shrink-0 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                      <span className="text-[10px] font-bold uppercase">{appt.date.split(" ")[1]}</span>
                      <span className="text-lg font-bold serif">{appt.date.split(" ")[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 serif truncate">{appt.title}</h4>
                      <p className="text-xs text-stone-500 flex gap-3 mt-1 font-medium">
                        <span className="flex items-center gap-1"><Clock size={11} className="text-amber-600" />{appt.time}</span>
                        <span className="flex items-center gap-1"><User size={11} className="text-emerald-600" />{appt.doctor}</span>
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Prakriti / Health Profile Card */}
          <Card delay={0.12} className="!p-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold serif text-stone-800">Health Profile</h4>
              <span className="text-xs text-emerald-700 font-bold cursor-pointer hover:underline"
                onClick={() => setActiveSection('health')}>Edit →</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Prakriti Type</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  patientProfile?.prakriti && patientProfile.prakriti !== 'Unknown'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-stone-100 text-stone-500 border-stone-200'
                }`}>
                  {patientProfile?.prakriti || 'Not assessed'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Blood Group</span>
                <span className="text-xs font-bold text-stone-700">{patientProfile?.bloodGroup || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Allergies</span>
                <span className="text-xs font-bold text-stone-700">
                  {patientProfile?.allergies?.length ? patientProfile.allergies.join(', ') : 'None'}
                </span>
              </div>
              {patientProfile?.medicalHistory?.length > 0 && (
                <div>
                  <span className="text-xs text-stone-500 font-medium block mb-1">Conditions</span>
                  <div className="flex flex-wrap gap-1">
                    {patientProfile.medicalHistory.slice(0, 3).map(h => (
                      <span key={h} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-100 font-medium">{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Promo card */}
          <div className="relative overflow-hidden rounded-2xl bg-emerald-900 text-white p-6 anim-card">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-700/40 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold mb-3">
                <Sparkles size={12} /> Recommended
              </div>
              <h3 className="text-2xl font-bold serif mb-2">Shirodhara</h3>
              <p className="text-emerald-100/80 text-sm mb-5 leading-relaxed">
                Signature oil therapy to relieve stress and restore calm.
              </p>
              <button onClick={() => setActiveSection("therapies")}
                className="w-full py-3 bg-white text-emerald-900 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors">
                Book Now
              </button>
            </div>
          </div>

          {/* Chart */}
          <Card delay={0.2} className="h-48 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Wellness Score</h4>
              <TrendingUp size={15} className="text-emerald-700" />
            </div>
            <SparkLine data={[40,60,55,80,72,68,85]} />
          </Card>
        </div>
      </div>
    </div>
  );

  // ── Therapies Tab ─────────────────────────────────────────
  const renderTherapies = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {therapies.map((t, i) => (
        <Card key={t._id || i} delay={i * 0.04} className="p-0 overflow-hidden flex flex-col group">
          <div className="h-44 bg-gradient-to-tr from-emerald-100 to-stone-100 relative flex items-center justify-center overflow-hidden">
            <Leaf size={72} className="text-emerald-800/30 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-900 border border-white/60">
              {t.duration || 60} min
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-stone-900 serif text-lg group-hover:text-emerald-800 transition-colors">{t.name}</h3>
              <span className="font-bold text-emerald-800 text-sm bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">₹{t.price}</span>
            </div>
            <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-5 flex-1">{t.description || "Holistic Ayurvedic therapy."}</p>
            <button onClick={() => navigate(`/book/${t._id}`)}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-md">
              Book Session <ArrowRight size={16} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );

  // ── Appointments Tab ──────────────────────────────────────
  const renderAppointments = () => (
    <Card>
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-stone-100">
        <h3 className="text-2xl font-bold serif text-stone-900">My Schedule</h3>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
          {appointments.length} total
        </span>
      </div>
      <div className="space-y-3">
        {appointments.map((appt, i) => (
          <motion.div key={appt.id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 bg-white/50 border border-stone-100 rounded-xl hover:border-emerald-200 hover:bg-white/80 transition-all anim-card"
          >
            <div className="w-16 h-16 rounded-xl bg-stone-100 flex flex-col items-center justify-center text-stone-700 shrink-0">
              <span className="text-[10px] font-bold uppercase">{appt.date.split(" ")[1]}</span>
              <span className="text-xl font-bold serif">{appt.date.split(" ")[0]}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-stone-900 serif">{appt.title}</h4>
              <div className="flex flex-wrap gap-3 text-xs text-stone-500 mt-1 font-medium">
                <span className="flex items-center gap-1"><Clock size={11} className="text-amber-600" /> {appt.time}</span>
                <span className="flex items-center gap-1"><User size={11} className="text-emerald-600" /> {appt.doctor}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={appt.status} />
              <button onClick={() => { setSelectedAppointment(appt); setShowModal(true); }}
                className="p-2.5 bg-white border border-stone-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-stone-500 hover:text-emerald-700">
                <ChevronRight size={18} />
              </button>
              {appt.status === "completed" && (
                <button onClick={() => setReviewAppt(appt)}
                  className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors text-amber-700">
                  <Star size={18} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {appointments.length === 0 && !loading && (
          <div className="text-center py-20 text-stone-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No appointments found</p>
          </div>
        )}
      </div>
    </Card>
  );

  // ── Layout ────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-[#F5F5F4] text-stone-900 overflow-x-hidden">
      <GlobalStyles />
      <AnimatedBg />

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-md border border-white/60 rounded-xl sm:rounded-2xl shadow-sm px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-900 flex items-center justify-center text-white shadow-md shrink-0">
              <Leaf size={15} fill="currentColor" />
            </div>
            <span className="font-bold serif text-base sm:text-lg text-stone-900 hidden sm:block">
              Ayur<span className="text-emerald-700">Sutra</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1 bg-stone-100/60 rounded-xl p-1 border border-white/40">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all ${
                  activeSection === item.id
                    ? "bg-emerald-900 text-white shadow-md"
                    : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
                }`}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <NotificationBell className="text-stone-600 hover:bg-stone-100 rounded-xl p-2" />
            <button onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3 lg:px-4 py-2 bg-stone-900 text-white rounded-xl text-xs lg:text-sm font-bold hover:bg-emerald-900 transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu"
              className="md:hidden p-2 rounded-xl bg-stone-100 text-stone-700 border border-stone-200">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-3 top-20 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-100 p-4 md:hidden"
          >
            <div className="space-y-1">
              {navItems.map(item => (
                <button key={item.id}
                  onClick={() => { setActiveSection(item.id); setMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors ${
                    activeSection === item.id ? "bg-emerald-900 text-white" : "text-stone-700 hover:bg-stone-50"
                  }`}>
                  <item.icon size={16} className={activeSection === item.id ? "text-emerald-300" : "text-stone-400"} />
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={handleLogout}
              className="w-full mt-3 px-4 py-3 bg-stone-50 text-stone-700 rounded-xl font-bold text-sm text-left flex items-center gap-3 hover:bg-red-50 hover:text-red-700 transition-colors border border-stone-100">
              <LogOut size={16} className="text-stone-400" /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-md border-t border-stone-200 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveSection(item.id); setMobileMenu(false); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                activeSection === item.id ? "text-emerald-800" : "text-stone-400 hover:text-stone-600"
              }`}>
              <item.icon size={20} />
              <span className={`text-[9px] font-bold ${activeSection === item.id ? "text-emerald-800" : "text-stone-400"}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 pt-24 sm:pt-28 pb-28 md:pb-12 px-3 sm:px-4 max-w-6xl mx-auto">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[10px] sm:text-xs font-bold mb-2 sm:mb-3">
              <Sparkles size={10} fill="currentColor" /> Patient Portal
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold serif text-stone-900">
              Namaste, {user?.name?.split(" ")[0] || "User"} 🙏
            </h1>
            <p className="text-stone-500 font-medium mt-1 text-sm">Manage your healing journey</p>
          </div>
          <div className="glass px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-stone-600">
            {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </motion.div>

        {/* Section content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeSection === "dashboard"    && renderDashboard()}
            {activeSection === "therapies"    && renderTherapies()}
            {activeSection === "appointments" && renderAppointments()}
            {activeSection === "health"       && <HealthInfo />}
            {activeSection === "ai"           && (
              <Card className="flex flex-col items-center text-center py-24">
                <div className="w-20 h-20 bg-emerald-900 rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <Lightbulb size={36} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold serif text-stone-900 mb-3">Vaidya AI Consultant</h2>
                <p className="text-stone-500 max-w-md mb-8 leading-relaxed">
                  Get personalized Ayurvedic insights powered by ancient texts and modern AI.
                </p>
                <button onClick={() => navigate("/ai-consultant")}
                  className="px-8 py-3.5 bg-emerald-900 text-white rounded-full font-bold hover:bg-emerald-800 hover:scale-105 transition-all shadow-lg">
                  Start Analysis
                </button>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Detail modal */}
      <AnimatePresence>
        {showModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-stone-900/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.98, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 40 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-stone-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Drag handle (mobile) */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-stone-300 rounded-full" />
              </div>
              <div className="bg-emerald-900 text-white p-5 sm:p-7 flex justify-between items-start">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold serif">{selectedAppointment.title}</h3>
                  <StatusBadge status={selectedAppointment.status} />
                </div>
                <button onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 sm:p-7 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wide">Practitioner</p>
                    <p className="font-bold text-stone-900 serif text-sm sm:text-base">{selectedAppointment.doctor}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 sm:p-4 bg-stone-50 border border-stone-100 rounded-xl text-center">
                    <Calendar size={18} className="mx-auto mb-1.5 text-amber-600" />
                    <p className="font-bold text-stone-900 text-xs sm:text-sm">{selectedAppointment.date}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-stone-50 border border-stone-100 rounded-xl text-center">
                    <Clock size={18} className="mx-auto mb-1.5 text-emerald-600" />
                    <p className="font-bold text-stone-900 text-xs sm:text-sm">{selectedAppointment.time}</p>
                  </div>
                </div>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
                  {selectedAppointment.description || "Please arrive 15 minutes early. Wear loose, comfortable clothing. Do not eat heavy food 2 hours before."}
                </p>
              </div>
              <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50 flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl text-sm hover:bg-stone-100 transition-colors">
                  Close
                </button>
                {(selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'pending') && (
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigate(`/book/${selectedAppointment.therapyId || selectedAppointment.id}?reschedule=${selectedAppointment.id}`);
                    }}
                    className="flex-1 py-3 bg-emerald-900 text-white font-bold rounded-xl text-sm hover:bg-emerald-800 transition-colors shadow-md flex items-center justify-center gap-2">
                    🔄 Reschedule
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      {reviewAppt && (
        <ReviewModal
          appointment={reviewAppt}
          patientId={user?.id || user?._id}
          onClose={() => setReviewAppt(null)}
          onSuccess={() => setReviewAppt(null)}
        />
      )}
    </div>
  );
};

export default PatientDashboard;