import React, { useState } from 'react';
import { 
  Plus, Leaf, Clock, DollarSign, FileText, 
  Sparkles, Loader2, ArrowLeft, Tag, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';

// --- 1. Global Styles (Matches Theme) ---
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

// --- 2. Reusable Components ---
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

const InputField = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-stone-600 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-emerald-600" />}
      {label}
    </label>
    <div className="relative group">
      <input
        className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm group-hover:bg-white"
        {...props}
      />
    </div>
  </div>
);

// --- 3. Main Component ---
const AddTherapy = () => {
  const [therapy, setTherapy] = useState({
    name: '',
    description: '',
    code: '',
    duration: '',
    price: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  // Get Practitioner ID safely
  const getPractitionerId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.id || null;
    } catch {
      return null;
    }
  };
  const pracId = getPractitionerId();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTherapy(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pracId) {
        setStatus({ type: 'error', text: 'Practitioner ID not found. Please login again.' });
        return;
    }

    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
      const payload = {
        name: therapy.name,
        description: therapy.description,
        code: therapy.code,
        duration: parseInt(therapy.duration),
        price: parseFloat(therapy.price),
        practitionerId: pracId
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/therapies`, payload);

      setStatus({ type: 'success', text: 'Therapy added successfully to the catalog.' });
      
      // Clear form
      setTherapy({ name: '', description: '', code: '', duration: '', price: '' });
      
      // Go back after delay
      setTimeout(() => window.history.back(), 2000);

    } catch (error) {
      console.error('Error adding therapy:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to add therapy.';
      setStatus({ type: 'error', text: errMsg });
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
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-3xl -ml-40 -mb-40 mix-blend-multiply pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <button 
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors mb-4 text-sm font-bold uppercase tracking-wider"
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-emerald-950 serif">Create Therapy</h1>
            <p className="text-stone-600 mt-2 font-medium">Define a new treatment for your patients.</p>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-600 items-center justify-center text-white shadow-xl shadow-emerald-900/20">
            <Leaf size={32} />
          </div>
        </motion.div>

        {/* Form Card */}
        <GlassCard className="overflow-hidden">
            {/* Status Messages */}
            <AnimatePresence>
                {status.text && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`px-8 py-4 flex items-center gap-3 ${
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

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                
                {/* Section 1: Core Details */}
                <div className="space-y-6">
                    <InputField 
                        label="Therapy Name" 
                        icon={Sparkles}
                        name="name"
                        value={therapy.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Shirodhara Stress Relief"
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-stone-600 flex items-center gap-2">
                            <FileText size={14} className="text-emerald-600" /> Description
                        </label>
                        <textarea
                            name="description"
                            value={therapy.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm resize-none"
                            placeholder="Describe the procedure, benefits, and recommended conditions..."
                            required
                        />
                    </div>
                </div>

                {/* Section 2: Logistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
                    <InputField 
                        label="Service Code" 
                        icon={Tag}
                        name="code"
                        value={therapy.code}
                        onChange={handleInputChange}
                        placeholder="e.g. AYU-001"
                        required
                    />
                     <InputField 
                        label="Duration (min)" 
                        icon={Clock}
                        type="number"
                        name="duration"
                        value={therapy.duration}
                        onChange={handleInputChange}
                        placeholder="60"
                        required
                    />
                     <InputField 
                        label="Price (₹)" 
                        icon={DollarSign}
                        type="number"
                        name="price"
                        value={therapy.price}
                        onChange={handleInputChange}
                        placeholder="2500"
                        required
                    />
                </div>

                {/* Submit Action */}
                <div className="pt-6 flex items-center justify-end gap-4">
                    <button 
                        type="button" 
                        onClick={() => window.history.back()}
                        className="px-6 py-3 rounded-full text-stone-500 font-bold hover:bg-stone-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-8 py-3 rounded-full font-bold text-white shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 ${
                            loading 
                            ? 'bg-stone-400 cursor-not-allowed' 
                            : 'bg-emerald-900 hover:bg-emerald-800 hover:shadow-emerald-900/20'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        {loading ? 'Creating...' : 'Create Therapy'}
                    </button>
                </div>

            </form>
        </GlassCard>

        {/* Footer Note */}
        <p className="text-center text-stone-400 text-xs mt-8">
            This therapy will be visible to patients immediately upon creation. <br/>
            Practitioner ID: <span className="font-mono">{pracId || "Not Authenticated"}</span>
        </p>

      </div>
    </div>
  );
};

export default AddTherapy;