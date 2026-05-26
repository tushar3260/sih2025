import React, { useState } from 'react';
import {
  Plus, Leaf, Clock, IndianRupee, FileText,
  Sparkles, Loader2, ArrowLeft, Tag, CheckCircle2,
  AlertCircle, X, Grid, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    :root { --color-bg: #F5F5F4; }
    body { font-family: 'Manrope', sans-serif; background: var(--color-bg); color: #1C1917; }
    .serif { font-family: 'Playfair Display', serif; }
  `}</style>
);

const CATEGORIES = [
  { id: "Panchakarma", emoji: "🌿", desc: "Detox & Cleansing" },
  { id: "Massage",     emoji: "💆", desc: "Body Therapies" },
  { id: "Shirodhara",  emoji: "🫧", desc: "Head Treatments" },
  { id: "Yoga",        emoji: "🧘", desc: "Mind & Body" },
  { id: "Herbal",      emoji: "🌱", desc: "Herbal Medicine" },
  { id: "Diet",        emoji: "🥗", desc: "Nutrition Plans" },
  { id: "Other",       emoji: "✨", desc: "Specialized" },
];

const InputField = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-emerald-600" />} {label}
    </label>
    <input
      className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
      {...props}
    />
  </div>
);

const TagInput = ({ label, values, onChange, placeholder }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !values.includes(val)) onChange([...values, val]);
    setInput('');
  };

  const remove = v => onChange(values.filter(x => x !== v));

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm" />
        <button type="button" onClick={add}
          className="px-4 py-3 bg-emerald-900 text-white rounded-xl font-bold hover:bg-emerald-800 transition-colors">
          <Plus size={18} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map(v => (
            <span key={v} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              {v}
              <button type="button" onClick={() => remove(v)} className="text-emerald-500 hover:text-emerald-800 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const AddTherapy = () => {
  const navigate = useNavigate();

  const getPractitionerId = () => {
    try { const u = JSON.parse(localStorage.getItem("user")); return u?.id || u?._id || null; }
    catch { return null; }
  };
  const pracId = getPractitionerId();

  const [therapy, setTherapy] = useState({
    name: '', description: '', code: '', duration: '', price: '',
    category: '', benefits: [], contraindications: []
  });
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState({ type: '', text: '' });

  const handleChange = e => {
    const { name, value } = e.target;
    setTherapy(p => ({ ...p, [name]: value }));
    setStatus({ type: '', text: '' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!pracId) return setStatus({ type: 'error', text: 'Practitioner ID not found. Please login again.' });
    if (!therapy.category) return setStatus({ type: 'error', text: 'Please select a category.' });

    setLoading(true);
    setStatus({ type: '', text: '' });
    try {
      await axios.post(`${API}/therapies`, {
        name:             therapy.name,
        description:      therapy.description,
        code:             therapy.code,
        duration:         parseInt(therapy.duration),
        price:            parseFloat(therapy.price),
        category:         therapy.category,
        benefits:         therapy.benefits,
        contraindications:therapy.contraindications,
        practitionerId:   pracId,
      });
      setStatus({ type: 'success', text: '✅ Therapy added successfully!' });
      setTimeout(() => navigate('/doctor-dashboard'), 1800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add therapy.';
      setStatus({ type: 'error', text: msg });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] overflow-hidden relative">
      <GlobalStyles />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors mb-4 text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold serif text-emerald-950">Add Therapy</h1>
              <p className="text-stone-500 mt-1">Create a new treatment for your patients.</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-xl">
              <Heart size={28} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/65 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl overflow-hidden">

          {/* Status */}
          <AnimatePresence>
            {status.text && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className={`px-8 py-4 flex items-center gap-3 font-medium text-sm border-b ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {status.text}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">

            {/* Category */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                <Grid size={12} className="text-emerald-600" /> Category
              </label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setTherapy(p => ({ ...p, category: cat.id }))}
                    className={`p-3 rounded-xl text-center transition-all border ${
                      therapy.category === cat.id
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-md'
                        : 'bg-white/60 text-stone-600 border-stone-200 hover:border-emerald-300'
                    }`}>
                    <div className="text-xl mb-1">{cat.emoji}</div>
                    <div className="text-[10px] font-bold leading-tight">{cat.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Details */}
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <InputField label="Therapy Name" icon={Sparkles} name="name" value={therapy.name}
                  onChange={handleChange} placeholder="e.g. Shirodhara Stress Relief" required />
                <InputField label="Service Code" icon={Tag} name="code" value={therapy.code}
                  onChange={handleChange} placeholder="e.g. AYU-001" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} className="text-emerald-600" /> Description
                </label>
                <textarea name="description" value={therapy.description} onChange={handleChange} rows={3}
                  className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm resize-none"
                  placeholder="Describe the procedure, benefits, and what patients can expect..." required />
              </div>
            </div>

            {/* Logistics */}
            <div className="grid grid-cols-2 gap-5 pt-4 border-t border-stone-100">
              <InputField label="Duration (min)" icon={Clock} type="number" name="duration" value={therapy.duration}
                onChange={handleChange} placeholder="60" required />
              <InputField label="Price (₹)" icon={IndianRupee} type="number" name="price" value={therapy.price}
                onChange={handleChange} placeholder="2500" required />
            </div>

            {/* Benefits & Contraindications */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
              <TagInput label="Benefits (Press Enter to add)" values={therapy.benefits}
                onChange={v => setTherapy(p => ({ ...p, benefits: v }))}
                placeholder="e.g. Stress relief" />
              <TagInput label="Contraindications" values={therapy.contraindications}
                onChange={v => setTherapy(p => ({ ...p, contraindications: v }))}
                placeholder="e.g. Pregnancy" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button type="button" onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl text-stone-500 font-bold hover:bg-stone-100 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className={`px-8 py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all ${
                  loading ? 'bg-stone-400 cursor-not-allowed' : 'bg-emerald-900 hover:bg-emerald-800 hover:scale-[1.02]'
                }`}>
                {loading ? <><Loader2 className="animate-spin" size={18} /> Creating...</> : <><Plus size={18} /> Create Therapy</>}
              </button>
            </div>

            <p className="text-center text-stone-400 text-xs">
              Practitioner ID: <span className="font-mono">{pracId || "Not authenticated"}</span>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddTherapy;