import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Home, Users, Heart, LogOut,
  Calendar, Clock, Star, User, Mail,
  Plus, Activity, Leaf, Search,
  CheckCircle2, XCircle, RefreshCw,
  Award, Zap, Trash2, Pencil, Settings, Save,
  ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import { useUser } from '../context/userContext';
import { useNotifications } from '../context/notificationContext';
import { NotificationBell } from '../components/NotificationCenter';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ── Styles ────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    :root { --color-bg:#F5F5F4; --color-primary:#064E3B; }
    body { font-family:'Manrope',sans-serif; background:var(--color-bg); }
    .serif { font-family:'Playfair Display',serif; }
    .anim-card { will-change:transform; transform:translateZ(0); }
    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#d6d3d1;border-radius:10px}
  `}</style>
);

const GlassCard = memo(({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay, ease: "easeOut" }}
    className={`anim-card bg-white/65 backdrop-blur-[10px] border border-white/75 shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl ${className}`}
  >
    {children}
  </motion.div>
));

// ── Status badge ──────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    confirmed:  "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending:    "bg-amber-100 text-amber-800 border-amber-200",
    completed:  "bg-blue-100 text-blue-800 border-blue-200",
    cancelled:  "bg-red-100 text-red-700 border-red-200",
  }[status] || "bg-stone-100 text-stone-600 border-stone-200";
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${cfg}`}>
      {status}
    </span>
  );
};

// ── Main Dashboard ────────────────────────────────────────────
const AyurvedaDoctorDashboard = () => {
  const { user: contextUser, logout } = useUser();
  const navigate = useNavigate();

  const userData = contextUser || (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const pracUserId       = userData?.id || userData?._id;
  const practitionerName = userData?.name || "Vaidya";

  const [activeTab,       setActiveTab]       = useState('dashboard');
  const [therapiesList,   setTherapiesList]   = useState([]);
  const [patients,        setPatients]        = useState([]);
  const [appointments,    setAppointments]    = useState([]);
  const [reviews,         setReviews]         = useState([]);
  const [avgRating,       setAvgRating]       = useState(null);
  const [stats,           setStats]           = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [loading,         setLoading]         = useState({ therapies: true, patients: true, appointments: true });
  const [searchQuery,     setSearchQuery]     = useState('');
  const [statusUpdating,  setStatusUpdating]  = useState(null);
  const [practitionerDoc, setPractitionerDoc] = useState(null);

  // Availability state
  const [availability, setAvailability] = useState([
    { weekday: 0, slots: [], enabled: false }, // Sun
    { weekday: 1, slots: [], enabled: false }, // Mon
    { weekday: 2, slots: [], enabled: false }, // Tue
    { weekday: 3, slots: [], enabled: false }, // Wed
    { weekday: 4, slots: [], enabled: false }, // Thu
    { weekday: 5, slots: [], enabled: false }, // Fri
    { weekday: 6, slots: [], enabled: false }, // Sat
  ]);
  const [breaks,           setBreaks]           = useState([]);
  const [availSaving,      setAvailSaving]      = useState(false);
  const [availSaveMsg,     setAvailSaveMsg]     = useState(null);

  const sidebarItems = [
    { id: 'dashboard',    icon: Home,     label: 'Overview'      },
    { id: 'appointments', icon: Calendar, label: 'Schedule'      },
    { id: 'patients',     icon: Users,    label: 'Patients'      },
    { id: 'therapies',    icon: Heart,    label: 'Therapies'     },
    { id: 'reviews',      icon: Star,     label: 'Reviews'       },
    { id: 'availability', icon: Settings, label: 'Availability'  },
  ];

  useEffect(() => { if (pracUserId) initData(); }, [pracUserId]);

  const initData = async () => {
    await fetchPractitionerDoc();
    await Promise.all([fetchTherapies(), fetchStats()]);
  };

  const fetchPractitionerDoc = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/practitioners`);
      const myDoc = data.find(p => String(p.user?._id || p.user) === String(pracUserId));
      if (myDoc) {
        setPractitionerDoc(myDoc);
        // Populate availability state from DB
        if (myDoc.availability?.length > 0) {
          setAvailability(prev => prev.map(day => {
            const dbDay = myDoc.availability.find(d => d.weekday === day.weekday);
            return dbDay ? { ...day, slots: dbDay.slots || [], enabled: (dbDay.slots || []).length > 0 } : day;
          }));
        }
        if (myDoc.breaks?.length > 0) {
          setBreaks(myDoc.breaks.map(b => ({
            ...b,
            date: b.date ? new Date(b.date).toISOString().slice(0, 10) : '',
          })));
        }
        await Promise.all([fetchPatients(myDoc._id), fetchAppointments(myDoc._id), fetchReviews(myDoc._id)]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchPatients = async (pracDocId) => {
    try {
      setLoading(p => ({ ...p, patients: true }));
      const { data } = await axios.get(`${API_BASE_URL}/appointments/${pracDocId}`);
      setPatients(Array.isArray(data) ? data : []);
    } catch { setPatients([]); }
    finally { setLoading(p => ({ ...p, patients: false })); }
  };

  const fetchAppointments = async (pracDocId) => {
    try {
      setLoading(p => ({ ...p, appointments: true }));
      const { data } = await axios.get(`${API_BASE_URL}/appointments/doctor/${pracDocId}`);
      setAppointments(Array.isArray(data) ? data : []);
    } catch { setAppointments([]); }
    finally { setLoading(p => ({ ...p, appointments: false })); }
  };

  const fetchTherapies = async () => {
    try {
      setLoading(p => ({ ...p, therapies: true }));
      const { data } = await axios.get(`${API_BASE_URL}/therapies/practitioner/${pracUserId}`);
      setTherapiesList(Array.isArray(data) ? data : []);
    } catch { setTherapiesList([]); }
    finally { setLoading(p => ({ ...p, therapies: false })); }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/appointments/stats/${pracUserId}`, {
        params: { role: 'practitioner' }
      });
      setStats(data);
    } catch {}
  };

  const fetchReviews = async (pracDocId) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/reviews/${pracDocId}`);
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating);
    } catch {}
  };

  // ── Availability helpers ──────────────────────────────────
  const toggleDay = (weekday) => {
    setAvailability(prev => prev.map(d =>
      d.weekday === weekday
        ? { ...d, enabled: !d.enabled, slots: !d.enabled && d.slots.length === 0 ? [{ start: '09:00', end: '17:00' }] : d.slots }
        : d
    ));
  };

  const updateSlot = (weekday, idx, field, value) => {
    setAvailability(prev => prev.map(d =>
      d.weekday === weekday
        ? { ...d, slots: d.slots.map((s, i) => i === idx ? { ...s, [field]: value } : s) }
        : d
    ));
  };

  const addSlot = (weekday) => {
    setAvailability(prev => prev.map(d =>
      d.weekday === weekday ? { ...d, slots: [...d.slots, { start: '09:00', end: '17:00' }] } : d
    ));
  };

  const removeSlot = (weekday, idx) => {
    setAvailability(prev => prev.map(d =>
      d.weekday === weekday ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d
    ));
  };

  const addBreak = () => {
    setBreaks(prev => [...prev, { date: '', start: '12:00', end: '13:00', reason: '' }]);
  };

  const updateBreak = (idx, field, value) => {
    setBreaks(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  };

  const removeBreak = (idx) => {
    setBreaks(prev => prev.filter((_, i) => i !== idx));
  };

  const saveAvailability = async () => {
    if (!practitionerDoc) return;
    try {
      setAvailSaving(true);
      setAvailSaveMsg(null);
      const payload = {
        availability: availability
          .filter(d => d.enabled)
          .map(d => ({ weekday: d.weekday, slots: d.slots })),
        breaks: breaks.filter(b => b.date).map(b => ({
          date:   new Date(b.date).toISOString(),
          start:  b.start,
          end:    b.end,
          reason: b.reason,
        })),
      };
      await axios.patch(`${API_BASE_URL}/practitioners/${practitionerDoc._id}`, payload);
      setAvailSaveMsg({ type: 'success', text: 'Availability saved successfully! Patients can now book slots.' });
      setTimeout(() => setAvailSaveMsg(null), 4000);
    } catch (err) {
      setAvailSaveMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save availability.' });
    } finally {
      setAvailSaving(false);
    }
  };


  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setStatusUpdating(appointmentId);
      await axios.patch(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
        status: newStatus,
        doctorUserId: pracUserId,
      });
      if (practitionerDoc) await fetchAppointments(practitionerDoc._id);
      await fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const refreshAll = () => initData();

  const handleLogout = () => { logout(); navigate('/'); };

  const handleDeleteTherapy = async (therapyId, therapyName) => {
    if (!window.confirm(`Remove "${therapyName}" from your therapy menu?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/therapies/${therapyId}`);
      setTherapiesList(p => p.filter(t => t._id !== therapyId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete therapy.');
    }
  };


  // ── Dashboard Overview ────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white p-8 md:p-12 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3">
              <Zap size={13} fill="currentColor" /> Clinical Overview
            </div>
            <h1 className="text-4xl md:text-5xl font-bold serif mb-3">Namaste, Dr. {practitionerName} 🙏</h1>
            <p className="text-emerald-100/80 font-medium text-lg">
              <span className="text-white font-bold">{stats.upcoming}</span> upcoming ·{" "}
              <span className="text-white font-bold">{stats.completed}</span> completed ·{" "}
              <span className="text-white font-bold">{therapiesList.length}</span> therapies
            </p>
          </div>
          <button onClick={refreshAll}
            className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-5 py-3 rounded-full flex items-center gap-2 transition-all hover:scale-105">
            <RefreshCw size={16} className={Object.values(loading).some(Boolean) ? "animate-spin" : ""} />
            Sync Data
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Patients", val: patients.length,    icon: Users,      color: "emerald" },
          { label: "Upcoming",       val: stats.upcoming,     icon: Calendar,   color: "blue"    },
          { label: "Completed",      val: stats.completed,    icon: CheckCircle2,color: "purple" },
          { label: "Avg Rating",     val: avgRating ? `${avgRating}★` : "—", icon: Star, color: "amber" },
        ].map(({ label, val, icon: Icon, color }, i) => (
          <GlassCard key={label} delay={i * 0.05} className={`p-5 hover:border-${color}-400/30 transition-all group`}>
            <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-700 mb-4 group-hover:scale-110 transition-transform`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold serif text-stone-900">{val ?? "…"}</p>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-1">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <GlassCard delay={0.2} className="p-6">
        <h3 className="font-bold serif text-stone-800 text-lg mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/add-therapy')}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-all shadow-md hover:scale-105">
            <Plus size={16} /> Add Therapy
          </button>
          <button onClick={() => setActiveTab('appointments')}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-stone-200 text-stone-700 rounded-xl font-bold text-sm hover:bg-stone-50 transition-all shadow-sm">
            <Calendar size={16} /> View Schedule
          </button>
          <button onClick={() => setActiveTab('reviews')}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-amber-200 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-50 transition-all shadow-sm">
            <Star size={16} /> My Reviews
          </button>
        </div>
      </GlassCard>
    </div>
  );

  // ── Appointments / Schedule ───────────────────────────────
  const renderAppointments = () => (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold serif text-emerald-950">Schedule</h2>
          <p className="text-stone-500 mt-1">Manage and update appointment statuses</p>
        </div>
        <button onClick={refreshAll} className="p-2 rounded-xl bg-white border border-stone-200 text-stone-500 hover:text-emerald-700 transition-all shadow-sm">
          <RefreshCw size={18} className={loading.appointments ? "animate-spin" : ""} />
        </button>
      </div>

      {appointments.length === 0 ? (
        <GlassCard className="py-20 text-center">
          <Calendar className="mx-auto h-16 w-16 text-stone-300 mb-4" />
          <h3 className="text-xl serif font-bold text-stone-600">No Appointments Yet</h3>
          <p className="text-stone-400 mt-2">Patients will appear here once they book your therapies.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt, i) => (
            <motion.div
              key={appt._id || i}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-center gap-4 p-5">
                {/* Date Block */}
                <div className="w-14 h-14 rounded-2xl bg-emerald-900 flex flex-col items-center justify-center text-white shrink-0">
                  <span className="text-[10px] font-bold uppercase">
                    {new Date(appt.start || Date.now()).toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                  <span className="text-xl font-bold serif">
                    {new Date(appt.start || Date.now()).getDate()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-stone-900 serif">{appt.therapy?.name || appt.name || 'Session'}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {appt.patient?.name || appt.name || 'Patient'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {new Date(appt.start || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <StatusBadge status={appt.status || 'pending'} />

                {/* Action Buttons */}
                {(appt.status === 'pending' || appt.status === 'confirmed') && (
                  <div className="flex gap-2 shrink-0">
                    {appt.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(appt._id, 'confirmed')}
                        disabled={statusUpdating === appt._id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-200 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} /> Confirm
                      </button>
                    )}
                    {appt.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(appt._id, 'completed')}
                        disabled={statusUpdating === appt._id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg hover:bg-blue-200 transition-all disabled:opacity-50"
                      >
                        <Award size={14} /> Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusUpdate(appt._id, 'cancelled')}
                      disabled={statusUpdating === appt._id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Patients ──────────────────────────────────────────────
  const renderPatients = () => {
    const filtered = patients.filter(p =>
      !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold serif text-emerald-950">My Patients</h2>
            <p className="text-stone-500 mt-1">{patients.length} patients on record</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patients…"
              className="pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-56 shadow-sm"
            />
          </div>
        </div>

        {loading.patients ? (
          <div className="flex items-center justify-center py-20 text-stone-400">
            <Activity className="animate-spin mr-3" /> Loading patients…
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="py-20 text-center">
            <User className="mx-auto h-16 w-16 text-stone-300 mb-4" />
            <h3 className="text-xl serif font-bold text-stone-600">{searchQuery ? 'No results' : 'No Patients Yet'}</h3>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((patient, i) => (
              <GlassCard key={patient._id || patient.id} delay={i * 0.04}
                className="p-6 hover:border-emerald-400/30 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-200 to-stone-100 flex items-center justify-center text-emerald-800 font-bold text-lg">
                    {(patient.name || 'P')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                      {patient.name || 'Unknown'}
                    </h3>
                    <p className="text-xs text-stone-400 font-mono">{String(patient._id || '').slice(-6)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 px-3 py-2.5 rounded-xl">
                  <Mail size={13} className="text-amber-600 shrink-0" />
                  <span className="truncate text-xs font-medium">{patient.email || 'No email'}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Therapies ─────────────────────────────────────────────
  const renderTherapies = () => (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold serif text-emerald-950">Therapy Menu</h2>
          <p className="text-stone-500 mt-1">{therapiesList.length} treatments · Click Edit to modify, Delete to remove</p>
        </div>
        <button onClick={() => navigate('/add-therapy')}
          className="bg-emerald-900 text-white px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-emerald-800 hover:scale-105 transition-all">
          <Plus size={16} /> Add Therapy
        </button>
      </div>

      {loading.therapies ? (
        <div className="text-center py-20 text-stone-400">Loading therapies…</div>
      ) : therapiesList.length === 0 ? (
        <GlassCard className="py-20 text-center">
          <Heart className="mx-auto h-16 w-16 text-stone-300 mb-4" />
          <h3 className="text-xl serif font-bold text-stone-600">No Therapies Yet</h3>
          <p className="text-stone-400 mt-2 mb-8">Add your first therapy to start accepting bookings.</p>
          <button onClick={() => navigate('/add-therapy')}
            className="px-8 py-3 bg-emerald-900 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-lg">
            <Plus size={16} className="inline mr-2" />Add Therapy
          </button>
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {therapiesList.map((therapy, i) => (
            <GlassCard key={therapy._id} delay={i * 0.04}
              className="flex flex-col hover:shadow-lg hover:border-amber-400/30 transition-all">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-emerald-200">
                      {therapy.code || "AYUR"}
                    </span>
                    {therapy.category && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-amber-200">
                        {therapy.category}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-lg text-emerald-800 serif">₹{therapy.price?.toLocaleString()}</span>
                </div>
                <h3 className="text-lg font-bold text-stone-900 serif mb-2">{therapy.name}</h3>
                <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed mb-3">{therapy.description}</p>
                {therapy.benefits?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {therapy.benefits.slice(0, 2).map(b => (
                      <span key={b} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full border border-stone-200">{b}</span>
                    ))}
                    {therapy.benefits.length > 2 && (
                      <span className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-400 rounded-full">+{therapy.benefits.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="p-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-medium text-stone-500">
                  <Clock size={13} className="text-amber-600" /> {therapy.duration} min
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/add-therapy?edit=${therapy._id}`)}
                    className="p-2 rounded-lg bg-white border border-stone-200 text-stone-500 hover:text-emerald-700 hover:border-emerald-200 transition-all">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteTherapy(therapy._id, therapy.name)}
                    className="p-2 rounded-lg bg-white border border-stone-200 text-stone-500 hover:text-red-600 hover:border-red-200 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );


  // ── Reviews ───────────────────────────────────────────────
  const renderReviews = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold serif text-emerald-950">Patient Reviews</h2>
        <p className="text-stone-500 mt-1">
          {reviews.length} reviews · {avgRating ? `${avgRating} ★ average` : 'No rating yet'}
        </p>
      </div>

      {/* Rating Summary */}
      {avgRating && (
        <GlassCard delay={0} className="p-6 mb-6 flex items-center gap-8">
          <div className="text-center">
            <p className="text-6xl font-bold serif text-emerald-900">{avgRating}</p>
            <div className="flex gap-1 justify-center my-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16}
                  fill={s <= Math.round(avgRating) ? "#f59e0b" : "none"}
                  stroke={s <= Math.round(avgRating) ? "#f59e0b" : "#d6d3d1"}
                />
              ))}
            </div>
            <p className="text-xs text-stone-500 font-medium">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {[5,4,3,2,1].map(star => {
              const count  = reviews.filter(r => r.rating === star).length;
              const pct    = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="text-stone-500 w-3 font-bold">{star}</span>
                  <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                  <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 }}
                      className="h-full bg-amber-400 rounded-full" />
                  </div>
                  <span className="text-stone-400 w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {reviews.length === 0 ? (
        <GlassCard className="py-20 text-center">
          <Star className="mx-auto h-16 w-16 text-stone-300 mb-4" />
          <h3 className="text-xl serif font-bold text-stone-600">No Reviews Yet</h3>
          <p className="text-stone-400 mt-2">Reviews will appear here after patients complete their sessions.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <GlassCard key={review._id} delay={i * 0.04} className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                    {(review.patient?.name || 'P')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">{review.patient?.name || 'Anonymous'}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12}
                          fill={s <= review.rating ? "#f59e0b" : "none"}
                          stroke={s <= review.rating ? "#f59e0b" : "#d6d3d1"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-stone-400 font-medium">
                  {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {review.comment && (
                <p className="text-sm text-stone-600 leading-relaxed pl-13 ml-[52px]">"{review.comment}"</p>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );

  // ── Availability Manager ──────────────────────────────────
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const renderAvailability = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold serif text-emerald-950">Availability</h2>
          <p className="text-stone-500 mt-1">Set your weekly schedule and breaks so patients can book real slots</p>
        </div>
        <button
          onClick={saveAvailability}
          disabled={availSaving || !practitionerDoc}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-all shadow-lg disabled:opacity-50"
        >
          {availSaving ? <><Activity size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Schedule</>}
        </button>
      </div>

      {!practitionerDoc && (
        <GlassCard className="p-8 text-center border-amber-200">
          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40} />
          <p className="font-bold text-stone-700 serif text-lg mb-2">Practitioner Profile Not Found</p>
          <p className="text-stone-500 text-sm">Your practitioner profile hasn't been created yet. Please complete your profile setup first.</p>
        </GlassCard>
      )}

      {/* Save message */}
      <AnimatePresence>
        {availSaveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 border font-medium text-sm
              ${availSaveMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-100'}`}
          >
            {availSaveMsg.type === 'success' ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}
            {availSaveMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {practitionerDoc && (
        <>
          {/* Weekly Schedule */}
          <GlassCard className="p-6 mb-6">
            <h3 className="font-bold serif text-stone-800 text-lg mb-6">Weekly Schedule</h3>
            <div className="space-y-4">
              {availability.map((day) => (
                <div key={day.weekday}
                  className={`rounded-xl border transition-all overflow-hidden
                    ${day.enabled ? 'border-emerald-200 bg-emerald-50/40' : 'border-stone-200 bg-stone-50/60'}`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleDay(day.weekday)}
                        className={`w-10 h-6 rounded-full transition-all relative flex items-center
                          ${day.enabled ? 'bg-emerald-600' : 'bg-stone-300'}`}
                      >
                        <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-all
                          ${day.enabled ? 'left-5' : 'left-1'}`} />
                      </button>
                      <span className={`font-bold text-sm ${day.enabled ? 'text-emerald-900' : 'text-stone-400'}`}>
                        {DAY_NAMES[day.weekday]}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                        ${day.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                        {day.enabled ? `${day.slots.length} slot${day.slots.length !== 1 ? 's' : ''}` : 'Off'}
                      </span>
                    </div>
                    {day.enabled && (
                      <button
                        onClick={() => addSlot(day.weekday)}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        <Plus size={14}/> Add Slot
                      </button>
                    )}
                  </div>

                  {/* Slots */}
                  {day.enabled && day.slots.length > 0 && (
                    <div className="px-5 pb-4 space-y-2 border-t border-emerald-100/60">
                      {day.slots.map((slot, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex items-center gap-3 pt-3">
                          <Clock size={14} className="text-emerald-600 shrink-0" />
                          <input
                            type="time" value={slot.start}
                            onChange={e => updateSlot(day.weekday, idx, 'start', e.target.value)}
                            className="text-sm font-bold text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          />
                          <span className="text-stone-400 text-sm font-medium">to</span>
                          <input
                            type="time" value={slot.end}
                            onChange={e => updateSlot(day.weekday, idx, 'end', e.target.value)}
                            className="text-sm font-bold text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          />
                          <button onClick={() => removeSlot(day.weekday, idx)}
                            className="ml-auto p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <XCircle size={16}/>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Breaks */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold serif text-stone-800 text-lg">Breaks & Blocked Times</h3>
                <p className="text-stone-400 text-sm mt-0.5">Add specific dates when you're unavailable</p>
              </div>
              <button onClick={addBreak}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-900 transition-all">
                <Plus size={14}/> Add Break
              </button>
            </div>

            {breaks.length === 0 ? (
              <div className="text-center py-10 text-stone-400">
                <Clock className="mx-auto mb-3 opacity-30" size={40}/>
                <p className="text-sm font-medium">No breaks added. You're available on all enabled days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {breaks.map((b, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex flex-wrap items-center gap-3 p-4 bg-white/60 border border-stone-200 rounded-xl">
                    <input
                      type="date" value={b.date}
                      onChange={e => updateBreak(idx, 'date', e.target.value)}
                      className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                    />
                    <input
                      type="time" value={b.start}
                      onChange={e => updateBreak(idx, 'start', e.target.value)}
                      className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                    />
                    <span className="text-stone-400 text-sm">to</span>
                    <input
                      type="time" value={b.end}
                      onChange={e => updateBreak(idx, 'end', e.target.value)}
                      className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                    />
                    <input
                      type="text" value={b.reason} placeholder="Reason (optional)"
                      onChange={e => updateBreak(idx, 'reason', e.target.value)}
                      className="flex-1 min-w-[120px] text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                    />
                    <button onClick={() => removeBreak(idx)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={16}/>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );

  // ── Layout ────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-[#F5F5F4] text-stone-900 overflow-hidden">
      <GlobalStyles />

      <div className="flex h-screen relative z-10">

        {/* Sidebar — Desktop only */}
        <aside className="w-16 md:w-20 lg:w-72 hidden sm:flex flex-col py-6 lg:py-8 px-3 lg:px-6 h-full border-r border-stone-100/60 bg-white/30 backdrop-blur-md shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 lg:mb-10 pl-1 lg:pl-2">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-tr from-emerald-900 to-emerald-700 flex items-center justify-center text-white shadow-lg shrink-0">
              <Leaf size={18} fill="currentColor" />
            </div>
            <span className="text-xl lg:text-2xl font-bold serif hidden lg:block text-stone-900">
              Ayur<span className="text-emerald-700">Sutra</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 lg:py-3.5 rounded-xl transition-all group relative overflow-hidden
                  ${activeTab === item.id
                    ? 'bg-white shadow-md text-emerald-900 font-bold'
                    : 'text-stone-500 hover:bg-white/60 hover:text-stone-800'}`}>
                {activeTab === item.id && (
                  <motion.div layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-l-xl" />
                )}
                <item.icon size={19} className={activeTab === item.id ? "text-emerald-600" : "group-hover:scale-110 transition-transform"} />
                <span className="text-sm hidden lg:block">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Profile + Logout */}
          <div className="mt-auto pt-4 border-t border-stone-200/60 space-y-2">
            <div className="hidden lg:flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm shrink-0">
                {(practitionerName)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-stone-800 truncate">Dr. {practitionerName}</p>
                <p className="text-xs text-stone-400 truncate">{userData?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-3 text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl">
              <LogOut size={18} />
              <span className="text-sm font-bold hidden lg:block">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 h-full overflow-y-auto">
          {/* Top Bar */}
          <div className="sticky top-0 z-20 bg-[#F5F5F4]/90 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-b border-stone-100/60">
            <div className="flex items-center gap-3">
              <div className="flex sm:hidden items-center gap-2">
                <Leaf className="text-emerald-800" size={18} />
                <span className="font-bold serif text-base">AyurSutra</span>
              </div>
              <h2 className="hidden sm:block font-bold text-stone-700 capitalize text-sm tracking-wide">
                {sidebarItems.find(i => i.id === activeTab)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell className="text-stone-700 bg-white/60 border border-stone-200 shadow-sm" />
              <button onClick={handleLogout}
                className="sm:hidden p-2 rounded-full text-stone-500 hover:text-red-600 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-10 pb-28 sm:pb-24">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === 'appointments' ? renderAppointments() :
                 activeTab === 'patients'     ? renderPatients()     :
                 activeTab === 'therapies'    ? renderTherapies()    :
                 activeTab === 'reviews'      ? renderReviews()      :
                 activeTab === 'availability' ? renderAvailability() :
                 renderDashboard()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav (replaces sidebar on small screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/90 backdrop-blur-md border-t border-stone-200 safe-bottom">
        <div className="flex items-center justify-around px-1 py-2">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all flex-1
                ${activeTab === item.id ? "text-emerald-800" : "text-stone-400 hover:text-stone-600"}`}>
              <item.icon size={18} />
              <span className={`text-[8px] font-bold truncate max-w-[40px] ${activeTab === item.id ? "text-emerald-800" : "text-stone-400"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AyurvedaDoctorDashboard;