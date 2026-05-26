import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, User, Stethoscope, Clock, Globe, IndianRupee,
  Plus, Trash2, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, ArrowLeft, Sparkles, Award, Calendar
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ── Styles ────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    :root { --color-bg:#F5F5F4; --color-primary:#064E3B; }
    body { font-family:'Manrope',sans-serif; background:var(--color-bg); color:#1C1917; }
    .serif { font-family:'Playfair Display',serif; }
    .glass { background:rgba(255,255,255,0.72); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.85); }
    @keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-20px)}}
  `}</style>
);

const GlassInput = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-emerald-600" />}{label}
    </label>}
    <input
      {...props}
      className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
    />
  </div>
);

const SPECIALTIES = [
  "Panchakarma", "Ayurvedic Medicine", "Herbal Therapy",
  "Yoga & Meditation", "Naturopathy", "Diet & Nutrition",
  "Marma Therapy", "Shirodhara", "Abhyanga"
];

const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Marathi", "Bengali", "Gujarati", "Kannada"];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Main Component ────────────────────────────────────────────
const PractitionerForm = () => {
  const navigate = useNavigate();

  const getUser = () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } };
  const currentUser = getUser();

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    specialty:       [],
    bio:             "",
    experience:      "",
    consultationFee: "",
    languages:       ["Hindi", "English"],
    qualifications:  [{ degree: "", institution: "", year: "" }],
    availability:    [{ weekday: 1, slots: [{ start: "09:00", end: "17:00" }] }],
  });

  const steps = [
    { title: "Profile",        icon: User        },
    { title: "Qualifications", icon: Award       },
    { title: "Availability",   icon: Calendar    },
    { title: "Review",         icon: CheckCircle2 },
  ];

  // ── Handlers ─────────────────────────────────────────────
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const toggleSpecialty = s =>
    set("specialty", form.specialty.includes(s) ? form.specialty.filter(x => x !== s) : [...form.specialty, s]);

  const toggleLanguage = l =>
    set("languages", form.languages.includes(l) ? form.languages.filter(x => x !== l) : [...form.languages, l]);

  const updateQual = (i, key, val) => {
    const q = [...form.qualifications];
    q[i] = { ...q[i], [key]: val };
    set("qualifications", q);
  };

  const addQual    = () => set("qualifications", [...form.qualifications, { degree: "", institution: "", year: "" }]);
  const removeQual = i  => set("qualifications", form.qualifications.filter((_, idx) => idx !== i));

  const toggleWeekday = day => {
    const exists = form.availability.find(a => a.weekday === day);
    if (exists) {
      set("availability", form.availability.filter(a => a.weekday !== day));
    } else {
      set("availability", [...form.availability, { weekday: day, slots: [{ start: "09:00", end: "17:00" }] }]);
    }
  };

  const updateSlot = (dayIdx, slotIdx, key, val) => {
    const av = [...form.availability];
    av[dayIdx] = { ...av[dayIdx] };
    av[dayIdx].slots = [...av[dayIdx].slots];
    av[dayIdx].slots[slotIdx] = { ...av[dayIdx].slots[slotIdx], [key]: val };
    set("availability", av);
  };

  const handleSubmit = async () => {
    if (!currentUser) return setStatus({ type: "error", text: "Please login first." });
    setLoading(true);
    setStatus({ type: "", text: "" });
    try {
      const payload = {
        user:            currentUser.id || currentUser._id,
        specialty:       form.specialty,
        bio:             form.bio,
        experience:      parseInt(form.experience) || 0,
        consultationFee: parseFloat(form.consultationFee) || 0,
        languages:       form.languages,
        qualifications:  form.qualifications.filter(q => q.degree),
        availability:    form.availability,
      };
      await axios.post(`${API}/practitioners`, payload);
      setStatus({ type: "success", text: "Profile created! Redirecting to dashboard..." });
      setTimeout(() => navigate("/doctor-dashboard"), 1800);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Something went wrong.";
      setStatus({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.specialty.length > 0 && form.bio.trim().length > 20;
    if (step === 1) return form.qualifications[0]?.degree?.trim().length > 0;
    return true;
  };

  // ── Step Renderers ────────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Specializations</h3>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map(s => (
            <button key={s} type="button" onClick={() => toggleSpecialty(s)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                form.specialty.includes(s)
                  ? "bg-emerald-900 text-white border-emerald-900 shadow-md"
                  : "bg-white/60 text-stone-600 border-stone-200 hover:border-emerald-300"
              }`}>
              {s}
            </button>
          ))}
        </div>
        {form.specialty.length === 0 && <p className="text-xs text-amber-600 mt-2 font-medium">Select at least one specialization</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <GlassInput label="Years of Experience" icon={Clock} type="number" min="0" max="60"
          value={form.experience} onChange={e => set("experience", e.target.value)} placeholder="e.g. 5" />
        <GlassInput label="Consultation Fee (₹)" icon={IndianRupee} type="number" min="0"
          value={form.consultationFee} onChange={e => set("consultationFee", e.target.value)} placeholder="e.g. 800" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Professional Bio</label>
        <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={4}
          placeholder="Describe your practice, philosophy, and approach to healing..."
          className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm resize-none"
        />
        <p className="text-xs text-stone-400 text-right">{form.bio.length} / 500 chars (min 20)</p>
      </div>

      <div>
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Languages Spoken</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button key={l} type="button" onClick={() => toggleLanguage(l)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                form.languages.includes(l)
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white/60 text-stone-600 border-stone-200 hover:border-amber-300"
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Education & Qualifications</h3>
        <button type="button" onClick={addQual}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors">
          <Plus size={13} /> Add More
        </button>
      </div>
      {form.qualifications.map((q, i) => (
        <div key={i} className="bg-stone-50/80 rounded-xl p-5 border border-stone-100 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500">Qualification {i + 1}</span>
            {i > 0 && (
              <button type="button" onClick={() => removeQual(i)}
                className="p-1 text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <GlassInput label="Degree" icon={Award}
              value={q.degree} onChange={e => updateQual(i, "degree", e.target.value)}
              placeholder="e.g. BAMS, MD" />
            <GlassInput label="Institution"
              value={q.institution} onChange={e => updateQual(i, "institution", e.target.value)}
              placeholder="e.g. BHU, AIIA" />
            <GlassInput label="Year" type="number" min="1950" max={new Date().getFullYear()}
              value={q.year} onChange={e => updateQual(i, "year", e.target.value)}
              placeholder="e.g. 2015" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Working Days & Hours</h3>
      <div className="grid grid-cols-7 gap-2 mb-6">
        {WEEKDAYS.map((day, idx) => {
          const active = form.availability.some(a => a.weekday === idx);
          return (
            <button key={day} type="button" onClick={() => toggleWeekday(idx)}
              className={`py-3 rounded-xl text-xs font-bold text-center transition-all border ${
                active ? "bg-emerald-900 text-white border-emerald-900 shadow-md" : "bg-white/60 text-stone-500 border-stone-200 hover:border-emerald-300"
              }`}>
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>
      <div className="space-y-4">
        {form.availability.sort((a, b) => a.weekday - b.weekday).map((av, dayIdx) => (
          <div key={av.weekday} className="bg-stone-50/80 rounded-xl p-5 border border-stone-100">
            <p className="text-sm font-bold text-stone-700 mb-3">{WEEKDAYS[av.weekday]}</p>
            {av.slots.map((slot, slotIdx) => (
              <div key={slotIdx} className="flex items-center gap-3">
                <input type="time" value={slot.start}
                  onChange={e => updateSlot(dayIdx, slotIdx, "start", e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <span className="text-stone-400 text-sm font-bold">to</span>
                <input type="time" value={slot.end}
                  onChange={e => updateSlot(dayIdx, slotIdx, "end", e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            ))}
          </div>
        ))}
        {form.availability.length === 0 && (
          <p className="text-center text-stone-400 py-8 font-medium">Select your working days above</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold serif text-emerald-900 mb-6">Review Your Profile</h3>

      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-900 flex items-center justify-center text-white text-2xl font-bold serif">
            {(currentUser?.name || "D")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-stone-900 text-lg">Dr. {currentUser?.name || "—"}</p>
            <p className="text-emerald-700 text-sm font-medium">{form.specialty.join(", ") || "—"}</p>
          </div>
        </div>
        <p className="text-stone-600 text-sm leading-relaxed">{form.bio || "No bio added."}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-center">
        {[
          { label: "Experience", val: `${form.experience || 0} yrs` },
          { label: "Fee", val: `₹${form.consultationFee || 0}` },
          { label: "Languages", val: form.languages.length },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white/60 rounded-xl p-4 border border-stone-100">
            <p className="text-2xl font-bold serif text-emerald-900">{val}</p>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-stone-50 rounded-xl p-5 border border-stone-100">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Qualifications</p>
        {form.qualifications.filter(q => q.degree).map((q, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-stone-700 mb-1.5">
            <Award size={14} className="text-emerald-600 shrink-0" />
            <span className="font-bold">{q.degree}</span>
            {q.institution && <span className="text-stone-400">— {q.institution}</span>}
            {q.year && <span className="text-stone-400">({q.year})</span>}
          </div>
        ))}
      </div>

      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Working Days</p>
        <div className="flex flex-wrap gap-2">
          {form.availability.map(av => (
            <span key={av.weekday} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
              {WEEKDAYS[av.weekday]} {av.slots[0]?.start}–{av.slots[0]?.end}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];

  // ── Layout ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F4] relative overflow-hidden">
      <GlobalStyles />
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" style={{ animation: "drift 20s ease-in-out infinite" }} />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-100/20 rounded-full blur-3xl pointer-events-none" style={{ animation: "drift 25s ease-in-out infinite reverse" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-white shadow-lg">
              <Leaf size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold serif text-emerald-900">AyurSutra</span>
          </div>
          <h1 className="text-4xl font-bold serif text-stone-900">Setup Your Practice</h1>
          <p className="text-stone-500 mt-1 font-medium">Complete your practitioner profile to start accepting patients.</p>
        </motion.div>

        {/* Step Progress */}
        <div className="flex items-center mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s.title}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < step ? "bg-emerald-900 border-emerald-900 text-white" :
                  i === step ? "bg-white border-emerald-600 text-emerald-600 shadow-md" :
                  "bg-stone-100 border-stone-200 text-stone-400"
                }`}>
                  {i < step ? <CheckCircle2 size={18} /> : <s.icon size={16} />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${i <= step ? "text-emerald-800" : "text-stone-400"}`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${i < step ? "bg-emerald-600" : "bg-stone-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
          className="glass rounded-3xl p-8 md:p-10 shadow-xl">

          {/* Status message */}
          <AnimatePresence>
            {status.text && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
                  status.type === "error"
                    ? "bg-red-50 text-red-700 border-red-100"
                    : "bg-emerald-50 text-emerald-800 border-emerald-100"
                }`}>
                {status.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                {status.text}
              </motion.div>
            )}
          </AnimatePresence>

          {stepContent[step]?.()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-stone-100">
            <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
              className="flex items-center gap-2 px-5 py-3 text-stone-600 font-bold rounded-xl hover:bg-stone-100 transition-colors">
              <ArrowLeft size={17} /> {step === 0 ? "Cancel" : "Back"}
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className="flex items-center gap-2 px-7 py-3 bg-emerald-900 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-900 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-800 transition-all disabled:opacity-70">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : <><Sparkles size={17} /> Launch Practice</>}
              </button>
            )}
          </div>
        </motion.div>

        <p className="text-center text-stone-400 text-xs mt-6">
          Logged in as <span className="font-bold text-emerald-700">{currentUser?.name || "—"}</span> · {currentUser?.email}
        </p>
      </div>
    </div>
  );
};

export default PractitionerForm;
