import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar, Clock, IndianRupee, Leaf, AlertCircle,
  CheckCircle2, Loader2, User, ArrowLeft, Sparkles, FileText,
  ChevronLeft, ChevronRight, RefreshCw
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ─── Global Styles ────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    :root {
      --color-bg: #F5F5F4;
      --color-text-main: #1C1917;
      --color-primary: #064E3B;
      --color-accent: #D97706;
    }
    body { font-family: 'Manrope', sans-serif; background-color: var(--color-bg); color: var(--color-text-main); }
    .serif { font-family: 'Playfair Display', serif; }
    @keyframes pulse-soft { 0%,100%{opacity:1} 50%{opacity:.6} }
    .pulse-soft { animation: pulse-soft 1.8s ease-in-out infinite; }
  `}</style>
);

const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, type: "spring", stiffness: 60 }}
    className={`bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.05)] rounded-2xl ${className}`}
  >
    {children}
  </motion.div>
);

// ─── Calendar Strip (14-day) ──────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CalendarStrip = ({ days, selectedDay, onSelect, loadingSlots }) => {
  const [page, setPage] = useState(0);
  const perPage = 7;
  const totalPages = Math.ceil(days.length / perPage);
  const visible = days.slice(page * perPage, (page + 1) * perPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800 serif text-lg">Select a Date</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-500 hover:text-emerald-700 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-500 hover:text-emerald-700 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {visible.map((d, i) => {
          const isSelected = selectedDay === d.iso;
          const hasSlots   = d.hasSlots;
          const isLoading  = loadingSlots && isSelected;
          return (
            <motion.button
              key={d.iso}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => hasSlots && onSelect(d.iso)}
              disabled={!hasSlots}
              className={`flex flex-col items-center justify-center rounded-xl py-3 transition-all border text-center
                ${isSelected
                  ? "bg-emerald-900 text-white border-emerald-900 shadow-lg shadow-emerald-900/20"
                  : hasSlots
                    ? "bg-white/80 border-stone-200 text-stone-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
                    : "bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed"
                }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? "text-emerald-200" : "text-stone-400"}`}>
                {DAY_NAMES[new Date(d.iso).getDay()]}
              </span>
              <span className="text-lg font-bold serif leading-tight">{new Date(d.iso).getDate()}</span>
              <span className={`text-[9px] font-medium ${isSelected ? "text-emerald-300" : "text-stone-400"}`}>
                {MONTH_NAMES[new Date(d.iso).getMonth()]}
              </span>
              {hasSlots && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1" />
              )}
              {isLoading && <Loader2 size={12} className="animate-spin mt-1" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Time Slot Grid ───────────────────────────────────────────
const TimeSlotGrid = ({ slots, selectedSlot, onSelect }) => {
  if (slots.length === 0) {
    return (
      <div className="py-12 text-center">
        <Clock className="mx-auto text-stone-300 mb-3" size={40} />
        <p className="text-stone-500 font-medium">No available slots on this day</p>
        <p className="text-stone-400 text-sm mt-1">Try selecting another date</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-bold text-stone-800 serif text-lg mb-4">Select a Time Slot</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <AnimatePresence>
          {slots.map((slot, i) => {
            const isSelected = selectedSlot?.start === slot.start;
            const startTime = new Date(slot.start).toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", hour12: true
            });
            const endTime = new Date(slot.end).toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", hour12: true
            });
            return (
              <motion.button
                key={slot.start}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onSelect(slot)}
                className={`flex flex-col items-center py-3 px-2 rounded-xl border text-center transition-all
                  ${isSelected
                    ? "bg-emerald-900 text-white border-emerald-900 shadow-lg shadow-emerald-900/20"
                    : "bg-white/80 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 text-stone-700"
                  }`}
              >
                <Clock size={14} className={isSelected ? "text-emerald-300" : "text-amber-500"} />
                <span className="font-bold text-sm mt-1">{startTime}</span>
                <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? "text-emerald-300" : "text-stone-400"}`}>
                  → {endTime}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Step Indicator ───────────────────────────────────────────
const StepBadge = ({ step, current, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
      ${current === step
        ? "bg-emerald-900 text-white border-emerald-900"
        : current > step
          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
          : "bg-stone-100 text-stone-400 border-stone-200"
      }`}>
      {current > step ? <CheckCircle2 size={14} /> : step}
    </div>
    <span className={`text-xs font-bold ${current >= step ? "text-stone-700" : "text-stone-400"}`}>{label}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────
const BookAppointment = () => {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const [searchParams] = useSearchParams();
  const rescheduleId   = searchParams.get("reschedule"); // old appointment id

  const getUserData = () => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  };
  const userData  = getUserData();
  const patientId = userData?.id || userData?._id || null;

  // ── State ──────────────────────────────────────────────────
  const [therapy,        setTherapy]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [status,         setStatus]         = useState({ type: "", text: "" });
  const [notes,          setNotes]          = useState("");

  // Slot-picker state
  const [allSlots,       setAllSlots]       = useState([]);   // all slots for 14-day window
  const [dayMap,         setDayMap]         = useState({});   // iso-date -> slot[]
  const [days,           setDays]           = useState([]);   // [{iso, hasSlots}]
  const [selectedDay,    setSelectedDay]    = useState(null);
  const [selectedSlot,   setSelectedSlot]  = useState(null);
  const [loadingSlots,   setLoadingSlots]  = useState(false);
  const [slotsError,     setSlotsError]    = useState(null);

  const step = !selectedDay ? 1 : !selectedSlot ? 2 : 3;

  // ── Fetch therapy ─────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await axios.get(`${API}/therapies/${id}`);
        setTherapy(res.data);
      } catch {
        setStatus({ type: "error", text: "Failed to load therapy details." });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Fetch slots once therapy is loaded ────────────────────
  const fetchSlots = useCallback(async (practitionerId, therapyId) => {
    try {
      setLoadingSlots(true);
      setSlotsError(null);
      const res = await axios.post(`${API}/appointments/slots`, {
        practitionerId,
        therapyId,
      });
      const fetched = Array.isArray(res.data) ? res.data : [];
      setAllSlots(fetched);

      // Build day map  { "2025-08-15": [slot, ...], ... }
      const map = {};
      fetched.forEach(s => {
        const d = s.start.slice(0, 10);
        if (!map[d]) map[d] = [];
        map[d].push(s);
      });
      setDayMap(map);

      // Build 14-day list
      const today = new Date();
      const list = [];
      for (let i = 0; i < 14; i++) {
        const dt  = new Date(today);
        dt.setDate(today.getDate() + i);
        const iso = dt.toISOString().slice(0, 10);
        list.push({ iso, hasSlots: !!map[iso] });
      }
      setDays(list);

      // Auto-select first day with slots
      const firstDay = list.find(d => d.hasSlots);
      if (firstDay) setSelectedDay(firstDay.iso);
    } catch (err) {
      setSlotsError("Could not load available slots. The practitioner may not have availability configured.");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!therapy) return;
    // Find practitioner doc ID
    const pracDocId = therapy.practitioner?._id || therapy.practitioner;
    if (!pracDocId) {
      setSlotsError("No practitioner linked to this therapy.");
      return;
    }
    // We need the Practitioner document ID (not user ID).
    // therapy.practitioner is already the practitioner user — fetch practitioner doc
    fetchPractitionerDocAndSlots(pracDocId, therapy._id);
  }, [therapy]);

  const fetchPractitionerDocAndSlots = async (practitionerUserId, therapyId) => {
    try {
      setLoadingSlots(true);
      // Get all practitioners and find doc matching this user
      const { data } = await axios.get(`${API}/practitioners`);
      const doc = data.find(p => String(p.user?._id || p.user) === String(practitionerUserId));
      if (!doc) {
        setSlotsError("Practitioner profile not found. They may not have availability set up yet.");
        setLoadingSlots(false);
        return;
      }
      await fetchSlots(doc._id, therapyId);
    } catch {
      setSlotsError("Could not load practitioner information.");
      setLoadingSlots(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setStatus({ type: "", text: "" });

    try {
      if (rescheduleId) {
        // Reschedule mode
        await axios.patch(`${API}/appointments/${rescheduleId}/reschedule`, {
          patientId: patientId,
          start:     selectedSlot.start,
        });
        setStatus({ type: "success", text: "Appointment rescheduled! Redirecting…" });
      } else {
        // New booking
        await axios.post(`${API}/appointments`, {
          patientId: patientId,
          therapyId: therapy._id,
          start:     selectedSlot.start,
          notes:     notes.trim(),
        });
        setStatus({ type: "success", text: "Appointment confirmed! Redirecting…" });
      }
      setTimeout(() => navigate("/appointments"), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to book appointment";
      setStatus({ type: "error", text: msg });
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F4]">
      <GlobalStyles />
      <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
      <p className="text-stone-500 font-medium">Retrieving therapy details…</p>
    </div>
  );

  if (!userData) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F4]">
      <GlobalStyles />
      <GlassCard className="p-10 max-w-md text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <User size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 serif mb-3">Login Required</h2>
        <p className="text-stone-600 mb-8">You need to be signed in to book a healing session.</p>
        <button onClick={() => navigate("/login")}
          className="w-full bg-gray-900 text-white py-3 rounded-full font-bold hover:bg-emerald-800 transition-all">
          Go to Login
        </button>
      </GlassCard>
    </div>
  );

  const slotsForDay = selectedDay ? (dayMap[selectedDay] || []) : [];

  return (
    <div className="min-h-screen bg-[#F5F5F4] overflow-hidden relative selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />

      {/* Background blobs */}
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
      <div className="fixed -bottom-40 -left-20 w-[400px] h-[400px] bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors mb-5 text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={16} /> {rescheduleId ? "Cancel Reschedule" : "Cancel & Return"}
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-white shadow-lg">
              <Leaf size={18} fill="currentColor" />
            </div>
            <span className="font-bold serif text-lg text-stone-900">AyurSutra</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-950 serif">
            {rescheduleId ? "Reschedule Session" : "Book Appointment"}
          </h1>
          {rescheduleId && (
            <p className="text-amber-700 font-medium mt-2 flex items-center gap-2">
              <RefreshCw size={14} /> Selecting a new slot will cancel your current appointment
            </p>
          )}
        </motion.div>

        {/* Step Indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-4 mb-8">
          <StepBadge step={1} current={step} label="Choose Date" />
          <div className={`flex-1 h-px ${step > 1 ? "bg-emerald-300" : "bg-stone-200"} transition-colors max-w-12`} />
          <StepBadge step={2} current={step} label="Choose Time" />
          <div className={`flex-1 h-px ${step > 2 ? "bg-emerald-300" : "bg-stone-200"} transition-colors max-w-12`} />
          <StepBadge step={3} current={step} label="Confirm" />
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">

          {/* Left: Therapy Summary */}
          <GlassCard className="md:col-span-2 h-fit overflow-hidden border-emerald-100/50" delay={0.1}>
            <div className="bg-emerald-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700 rounded-full mix-blend-overlay blur-2xl -mr-10 -mt-10" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-700/50 text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-4">
                  <Sparkles size={12} /> Holistic Healing
                </div>
                <h2 className="text-2xl font-bold serif mb-1">{therapy?.name}</h2>
                <p className="text-emerald-200/80 text-sm font-medium">
                  Dr. {therapy?.practitioner?.user?.name || therapy?.practitioner?.name || "Ayurveda Specialist"}
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-stone-100">
                <span className="text-stone-500 font-medium flex items-center gap-2 text-sm"><Clock size={15}/> Duration</span>
                <span className="font-bold text-stone-800">{therapy?.duration} Mins</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-stone-100">
                <span className="text-stone-500 font-medium flex items-center gap-2 text-sm"><IndianRupee size={15}/> Fee</span>
                <span className="font-bold text-stone-800 text-xl">₹{therapy?.price}</span>
              </div>
              {therapy?.description && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-800 leading-relaxed italic">
                    "{therapy.description}"
                  </p>
                </div>
              )}

              {/* Selected Slot Summary */}
              {selectedSlot && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Selected Slot</p>
                  <p className="font-bold text-emerald-900 text-sm">
                    {new Date(selectedSlot.start).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                  </p>
                  <p className="text-emerald-700 font-medium text-sm">
                    {new Date(selectedSlot.start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    {" → "}
                    {new Date(selectedSlot.end).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </p>
                </motion.div>
              )}
            </div>
          </GlassCard>

          {/* Right: Booking UI */}
          <div className="md:col-span-3 space-y-5">

            {/* Status Alert */}
            <AnimatePresence>
              {status.text && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-xl flex items-center gap-3 border ${
                    status.type === "error"
                      ? "bg-red-50 text-red-700 border-red-100"
                      : "bg-emerald-50 text-emerald-800 border-emerald-100"
                  }`}
                >
                  {status.type === "error" ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
                  <p className="font-medium text-sm">{status.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Slots Loading */}
            {loadingSlots && (
              <GlassCard className="p-8 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="animate-spin text-emerald-700" size={24} />
                </div>
                <p className="font-bold text-stone-700 serif">Finding available slots…</p>
                <p className="text-stone-400 text-sm mt-1">Checking practitioner schedule</p>
              </GlassCard>
            )}

            {/* Slots Error */}
            {slotsError && !loadingSlots && (
              <GlassCard className="p-8 text-center border-amber-100">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-amber-600" size={24} />
                </div>
                <p className="font-bold text-stone-700 serif mb-2">No Slots Available</p>
                <p className="text-stone-500 text-sm leading-relaxed">{slotsError}</p>
                <p className="text-stone-400 text-xs mt-3">Please ask the practitioner to set up their availability from the Doctor Dashboard.</p>
              </GlassCard>
            )}

            {/* Calendar + Slots */}
            {!loadingSlots && !slotsError && days.length > 0 && (
              <>
                {/* Step 1: Calendar */}
                <GlassCard className="p-6" delay={0.15}>
                  <CalendarStrip
                    days={days}
                    selectedDay={selectedDay}
                    onSelect={d => { setSelectedDay(d); setSelectedSlot(null); }}
                    loadingSlots={false}
                  />
                </GlassCard>

                {/* Step 2: Time slots */}
                <AnimatePresence mode="wait">
                  {selectedDay && (
                    <motion.div
                      key={selectedDay}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    >
                      <GlassCard className="p-6">
                        <TimeSlotGrid
                          slots={slotsForDay}
                          selectedSlot={selectedSlot}
                          onSelect={setSelectedSlot}
                        />
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 3: Notes + Confirm */}
                <AnimatePresence>
                  {selectedSlot && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    >
                      <GlassCard className="p-6" delay={0.05}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                          {!rescheduleId && (
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-stone-600 flex items-center gap-2">
                                <FileText size={14} className="text-emerald-600" />
                                Additional Notes (Optional)
                              </label>
                              <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                disabled={submitting}
                                placeholder="Any allergies, specific pain points, or preferences…"
                                className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm resize-none disabled:opacity-60"
                              />
                            </div>
                          )}

                          {/* Confirmation summary */}
                          <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">Booking Summary</p>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-500 font-medium">Therapy</span>
                              <span className="font-bold text-stone-800">{therapy?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-500 font-medium">Date</span>
                              <span className="font-bold text-stone-800">
                                {new Date(selectedSlot.start).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-500 font-medium">Time</span>
                              <span className="font-bold text-stone-800">
                                {new Date(selectedSlot.start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-stone-200 pt-2 mt-2">
                              <span className="text-stone-500 font-medium">Fee</span>
                              <span className="font-bold text-emerald-800 text-base">₹{therapy?.price}</span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-emerald-900 to-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-900/15 hover:shadow-emerald-900/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                          >
                            {submitting ? (
                              <><Loader2 className="animate-spin" size={20} /> {rescheduleId ? "Rescheduling…" : "Confirming…"}</>
                            ) : (
                              <><CheckCircle2 size={20} /> {rescheduleId ? "Confirm Reschedule" : "Confirm Appointment"}</>
                            )}
                          </button>
                          <p className="text-center text-xs text-stone-400">
                            Booking as <span className="text-emerald-700 font-bold">{userData?.name}</span>
                          </p>
                        </form>
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Empty state when all slots fetched but all days grey */}
            {!loadingSlots && !slotsError && days.length > 0 && allSlots.length === 0 && (
              <GlassCard className="p-10 text-center" delay={0.2}>
                <Calendar className="mx-auto text-stone-300 mb-4" size={48} />
                <h3 className="font-bold serif text-stone-600 text-xl mb-2">No Available Slots</h3>
                <p className="text-stone-400 text-sm">
                  This practitioner hasn't configured availability for the next 14 days.<br/>
                  Please check back later or contact them directly.
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;