import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar, Clock, IndianRupee, Leaf, AlertCircle,
  CheckCircle2, Loader2, User, ArrowLeft, Sparkles, FileText
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- 1. Global Styles (Theme) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    
    :root {
      --color-bg: #F5F5F4;
      --color-text-main: #1C1917;
      --color-primary: #064E3B;
      --color-accent: #D97706;
    }

    body { 
      font-family: 'Manrope', sans-serif; 
      background-color: var(--color-bg);
      color: var(--color-text-main);
    }
    
    .serif { font-family: 'Playfair Display', serif; }
    
    /* Custom Date/Time Input Styling */
    input[type="date"], input[type="time"] {
      appearance: none;
      -webkit-appearance: none;
    }
  `}</style>
);

// --- 2. Reusable UI Components ---
const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, type: "spring", stiffness: 50 }}
    className={`bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const StyledInput = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-stone-600 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-emerald-600" />}
      {label}
    </label>
    <div className="relative group">
      <input
        className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm group-hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  </div>
);

// --- 3. Main Component ---
const BookAppointment = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Safe user getter
  const getUserData = () => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const userData = getUserData();
  const patientId = userData?.id || userData?._id || null;

  // Local-time-safe today
  const todayLocal = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }, []);

  const [therapy, setTherapy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({ date: "", time: "", notes: "" });

  // Fetch Therapy
  useEffect(() => {
    const fetchTherapy = async () => {
      if (!id) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/therapies/${id}`);
        setTherapy(res.data);
      } catch (err) {
        setStatus({ type: 'error', text: "Failed to load therapy details." });
      } finally {
        setLoading(false);
      }
    };
    fetchTherapy();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setStatus({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!userData || !patientId) {
      setStatus({ type: 'error', text: "Please log in to book an appointment" });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const startLocal = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      if (startLocal <= now) throw new Error("Please select a future date and time");

      const payload = {
        patientId: userData._id || userData.id,
        therapyId: therapy._id,
        start: startLocal.toISOString(),
        notes: formData.notes.trim(),
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/appointments`, payload);

      setStatus({ type: 'success', text: "Appointment confirmed! Redirecting..." });
      setTimeout(() => navigate("/appointments"), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to book appointment";
      setStatus({ type: 'error', text: msg });
      setSubmitting(false);
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F4]">
        <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
        <p className="text-stone-500 font-serif">Retrieving therapy details...</p>
      </div>
    );
  }

  // --- Login Required State ---
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F4]">
        <GlobalStyles />
        <GlassCard className="p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 serif mb-3">Login Required</h2>
          <p className="text-stone-600 mb-8">You need to be signed in to book a healing session.</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gray-900 text-white py-3 rounded-full font-bold hover:bg-emerald-800 transition-all"
          >
            Go to Login
          </button>
        </GlassCard>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#F5F5F4] overflow-hidden relative selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />
      
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply" 
           style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}>
      </div>
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors mb-4 text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Cancel & Return
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-950 serif">Book Appointment</h1>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          
          {/* Left: Therapy Summary Card */}
          <GlassCard className="md:col-span-2 h-fit overflow-hidden border-emerald-100/50">
            <div className="bg-emerald-900 p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700 rounded-full mix-blend-overlay blur-2xl -mr-10 -mt-10"></div>
               <div className="relative z-10">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-700/50 text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-4">
                    <Sparkles size={12} /> Holistic Healing
                 </div>
                 <h2 className="text-3xl font-bold serif mb-2">{therapy?.name}</h2>
                 <p className="text-emerald-200/80 text-sm font-medium">Dr. {therapy?.practitioner?.user?.name || "Ayurveda Specialist"}</p>
               </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-stone-100">
                 <span className="text-stone-500 font-medium flex items-center gap-2 text-sm"><Clock size={16}/> Duration</span>
                 <span className="font-bold text-stone-800">{therapy?.duration} Mins</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-stone-100">
                 <span className="text-stone-500 font-medium flex items-center gap-2 text-sm"><IndianRupee size={16}/> Consultation Fee</span>
                 <span className="font-bold text-stone-800 text-xl">₹{therapy?.price}</span>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-800 leading-relaxed italic">
                  "{therapy?.description || "A restorative session focusing on balance and wellness."}"
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Right: Booking Form */}
          <div className="md:col-span-3 space-y-6">
             <AnimatePresence>
                {status.text && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-xl flex items-center gap-3 border ${
                      status.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    }`}
                  >
                    {status.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
                    <p className="font-medium text-sm">{status.text}</p>
                  </motion.div>
                )}
             </AnimatePresence>

             <GlassCard className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <StyledInput
                      label="Date"
                      icon={Calendar}
                      type="date"
                      name="date"
                      value={formData.date}
                      min={todayLocal}
                      onChange={handleChange}
                      disabled={submitting}
                      required
                    />
                    <StyledInput
                      label="Time"
                      icon={Clock}
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-600 flex items-center gap-2">
                      <FileText size={14} className="text-emerald-600" /> Additional Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      disabled={submitting}
                      placeholder="Any allergies, specific pain points, or preferences..."
                      className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm resize-none disabled:opacity-60"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting || !formData.date || !formData.time}
                      className="w-full bg-gradient-to-r from-emerald-900 to-emerald-700 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-900/10 hover:shadow-emerald-900/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Confirming Slot...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Confirm Appointment
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-stone-400 mt-4">
                      Booking as <span className="text-emerald-700 font-bold">{userData?.name}</span>
                    </p>
                  </div>
                </form>
             </GlassCard>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;