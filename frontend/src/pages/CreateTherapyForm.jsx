import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Leaf, Sparkles, Tag, Clock, 
  DollarSign, FileText, Loader2, CheckCircle2, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// --- 1. Global Styles & Theme ---
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

const StyledInput = ({ label, icon: Icon, type = "text", ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-stone-600 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-emerald-600" />}
      {label} <span className="text-red-400">*</span>
    </label>
    <div className="relative group">
      <input
        type={type}
        className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm group-hover:bg-white disabled:bg-stone-100 disabled:text-stone-500"
        {...props}
      />
    </div>
  </div>
);

// --- 3. Main Component ---
const CreateTherapyForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    duration: "",
    price: "",
    practitionerId: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  // Load User ID on mount (Robust check)
  useEffect(() => {
    try {
      // Check for user object first (standard)
      const user = JSON.parse(localStorage.getItem("user"));
      const storedId = user?.id || user?._id || localStorage.getItem("practitionerId");
      
      if (storedId) {
        setFormData((prev) => ({ ...prev, practitionerId: storedId }));
      } else {
        setStatus({ type: "error", text: "User session not found. Please login." });
      }
    } catch (e) {
      console.error("Error parsing user data", e);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on type
    if (status.type === 'error') setStatus({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    // Validation
    if (!formData.name || !formData.description || !formData.code || !formData.duration || !formData.practitionerId) {
      setStatus({ type: "error", text: "Please fill in all required fields." });
      return;
    }
    if (parseInt(formData.duration) < 1) {
      setStatus({ type: "error", text: "Duration must be at least 1 minute." });
      return;
    }
    if (formData.price && parseFloat(formData.price) < 0) {
      setStatus({ type: "error", text: "Price cannot be negative." });
      return;
    }

    setLoading(true);

    try {
      // Use AXIOS instead of fetch
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/therapies`, {
        name: formData.name,
        description: formData.description,
        code: formData.code,
        duration: parseInt(formData.duration),
        price: formData.price ? parseFloat(formData.price) : 0,
        practitionerId: formData.practitionerId,
      });

      setStatus({ type: "success", text: "Therapy created successfully!" });
      
      // Reset form (except ID)
      setFormData((prev) => ({
        ...prev,
        name: "",
        description: "",
        code: "",
        duration: "",
        price: "",
      }));

      // Optional: Redirect back after 2 seconds
      // setTimeout(() => window.history.back(), 2000);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to create therapy";
      setStatus({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] overflow-hidden relative selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply" 
           style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}>
      </div>
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-3xl -mr-40 -mt-40 mix-blend-multiply pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors mb-4 text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-emerald-950 serif">New Therapy</h1>
              <p className="text-stone-600 mt-2 font-medium">Add a new treatment to your clinic's offerings.</p>
            </div>
            <div className="hidden md:flex w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 items-center justify-center shadow-inner">
               <Leaf size={28} />
            </div>
          </div>
        </motion.div>

        {/* Form Container */}
        <GlassCard className="overflow-hidden">
          
          {/* Status Bar */}
          <AnimatePresence>
            {status.text && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`px-6 py-4 flex items-center gap-3 ${
                  status.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' 
                  : 'bg-red-50 text-red-800 border-b border-red-100'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                <p className="font-medium text-sm">{status.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Top Section */}
            <div className="space-y-6">
              <StyledInput 
                label="Therapy Name" 
                icon={Sparkles} 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Abhyanga Full Body Massage"
                required 
              />
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-600 flex items-center gap-2">
                  <FileText size={14} className="text-emerald-600" /> 
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm resize-none"
                  placeholder="Describe the procedure and benefits..."
                  required
                />
              </div>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
              <StyledInput 
                label="Code" 
                icon={Tag} 
                name="code" 
                value={formData.code} 
                onChange={handleChange} 
                placeholder="AYU-001"
                className="uppercase"
                required 
              />
              <StyledInput 
                label="Duration (min)" 
                icon={Clock} 
                type="number" 
                name="duration" 
                value={formData.duration} 
                onChange={handleChange} 
                placeholder="60"
                min="1"
                required 
              />
              <StyledInput 
                label="Price" 
                icon={DollarSign} 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Hidden / Disabled ID Field (Visual only) */}
            <div className="pt-2">
               <p className="text-xs text-stone-400 font-mono">
                 Linking to Practitioner ID: {formData.practitionerId || "Loading..."}
               </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] ${
                   loading 
                   ? 'bg-stone-400 cursor-not-allowed' 
                   : 'bg-gradient-to-r from-emerald-900 to-emerald-700 hover:shadow-emerald-900/20'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Leaf size={20} />}
                {loading ? "Creating Therapy..." : "Publish Therapy"}
              </button>
            </div>

          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default CreateTherapyForm;