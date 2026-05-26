import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, FileText, AlertCircle,
  CheckCircle2, Loader2, X, Leaf, ArrowLeft, IndianRupee
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ── Global Styles ──────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    :root { --color-bg: #F5F5F4; --color-primary: #064E3B; }
    body { font-family: 'Manrope', sans-serif; background-color: var(--color-bg); }
    .serif { font-family: 'Playfair Display', serif; }
  `}</style>
);

// ── Status badge config ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200'  },
  confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  completed: { bg: 'bg-stone-100',   text: 'text-stone-600',   border: 'border-stone-200'  },
  cancelled: { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200'    },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {status}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filter, setFilter]             = useState('all');
  const [cancelling, setCancelling]     = useState(null); // id being cancelled
  const [toast, setToast]               = useState(null); // { type, text }

  const navigate   = useNavigate();
  const userData   = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const patientId  = userData?.id || userData?._id;

  useEffect(() => { fetchAppointments(); }, [patientId, filter]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAppointments = async () => {
    if (!patientId) {
      setError('Please log in to view your appointments.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filter !== 'all') params.status = filter;

      const response = await axios.get(`${API_BASE_URL}/appointments/me/${patientId}`, {
        params,
        timeout: 15000,
      });

      setAppointments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else {
        setError('Network error. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed: correct URL + method + body
  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      setCancelling(appointmentId);
      await axios.post(
        `${API_BASE_URL}/appointments/${appointmentId}/cancel`,
        { userId: patientId, role: userData?.role || 'patient' }
      );
      showToast('success', 'Appointment cancelled successfully.');
      fetchAppointments();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to cancel appointment.');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const getDuration = (start, end) =>
    Math.round((new Date(end) - new Date(start)) / 60000) + ' min';

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F4] gap-4">
      <GlobalStyles />
      <Loader2 className="animate-spin text-emerald-700" size={40} />
      <p className="text-stone-500 font-medium">Loading your appointments…</p>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F4]">
      <GlobalStyles />
      <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md w-full text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={40} />
        <p className="text-red-700 font-medium mb-6">{error}</p>
        <button onClick={fetchAppointments}
          className="px-6 py-3 bg-emerald-900 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all">
          Try Again
        </button>
      </div>
    </div>
  );

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F4] selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />

      {/* Background blobs */}
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl font-medium text-sm border
              ${toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors mb-4 text-sm font-bold uppercase tracking-wider">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-white shadow-lg">
              <Leaf size={20} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold serif text-emerald-900">AyurSutra</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 serif">My Appointments</h1>
          <p className="text-stone-500 mt-2 font-medium">Track and manage your healing sessions.</p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all border
                ${filter === s
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-md'
                  : 'bg-white/70 text-stone-600 border-stone-200 hover:bg-white hover:border-stone-300'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button onClick={fetchAppointments}
            className="ml-auto px-5 py-2 rounded-full text-sm font-bold bg-white/70 text-stone-600 border border-stone-200 hover:bg-white transition-all flex items-center gap-2">
            <Loader2 size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </motion.div>

        {/* Empty State */}
        {appointments.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl shadow p-16 text-center">
            <Calendar className="mx-auto mb-4 text-stone-300" size={56} />
            <h3 className="text-2xl font-bold text-stone-700 serif mb-2">No Appointments Found</h3>
            <p className="text-stone-400 mb-8">No sessions match the current filter.</p>
            <button onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-emerald-900 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-lg">
              Browse Therapies
            </button>
          </motion.div>
        )}

        {/* Appointment Cards */}
        <div className="space-y-5">
          {appointments.map((appt, index) => (
            <motion.div
              key={appt._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_24px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-100 transition-all"
            >
              {/* Card Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-50/80 to-stone-50/60 border-b border-stone-100 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-900 flex flex-col items-center justify-center text-white shadow-md">
                    <span className="text-[10px] font-bold uppercase">
                      {new Date(appt.start).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold serif leading-none">
                      {new Date(appt.start).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-stone-900 serif">{formatDate(appt.start)}</p>
                    <div className="flex items-center gap-3 text-sm text-stone-500 font-medium mt-0.5">
                      <span className="flex items-center gap-1"><Clock size={13} className="text-amber-600" /> {formatTime(appt.start)} – {formatTime(appt.end)}</span>
                      <span className="text-stone-300">•</span>
                      <span>{getDuration(appt.start, appt.end)}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={appt.status} />
              </div>

              {/* Card Body */}
              <div className="px-6 py-5 grid md:grid-cols-2 gap-6">
                {/* Doctor */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-0.5">Practitioner</p>
                    <p className="font-bold text-stone-900">
                      Dr. {appt.practitioner?.user?.name || 'Ayurveda Specialist'}
                    </p>
                    {appt.practitioner?.specialty?.length > 0 && (
                      <p className="text-xs text-stone-500 mt-0.5">{appt.practitioner.specialty.join(', ')}</p>
                    )}
                  </div>
                </div>

                {/* Therapy */}
                <div className="bg-stone-50/80 rounded-xl p-4 border border-stone-100">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Therapy</p>
                  <p className="font-bold text-stone-900 mb-1">{appt.therapy?.name || 'Not specified'}</p>
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    {appt.therapy?.duration && (
                      <span className="flex items-center gap-1"><Clock size={11} /> {appt.therapy.duration} min</span>
                    )}
                    {appt.therapy?.price && (
                      <span className="flex items-center gap-1"><IndianRupee size={11} /> ₹{appt.therapy.price}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {appt.notes && (
                <div className="px-6 pb-4 flex items-start gap-3">
                  <FileText size={16} className="text-stone-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-stone-600 font-medium">{appt.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 py-4 bg-stone-50/50 border-t border-stone-100 flex flex-wrap gap-3">
                {(appt.status === 'pending' || appt.status === 'confirmed') && (
                  <button
                    onClick={() => handleCancel(appt._id)}
                    disabled={cancelling === appt._id}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-bold flex items-center gap-2 disabled:opacity-60 shadow-sm"
                  >
                    {cancelling === appt._id
                      ? <><Loader2 size={14} className="animate-spin" /> Cancelling…</>
                      : <><X size={14} /> Cancel</>}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/book/${appt.therapy?._id}`)}
                  className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 transition-all text-sm font-bold shadow-sm"
                >
                  Book Again
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PatientAppointments;
