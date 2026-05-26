import React, { useState } from 'react';
import { 
  Eye, EyeOff, Leaf, Mail, Lock, ArrowRight, User, 
  Phone, Shield, Loader2, CheckCircle2, ArrowLeft 
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
// Three.js removed

// --- 1. Global Styles & Theme ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    
    :root {
      --color-bg: #F5F5F4;
      --color-text-main: #1C1917;
      --color-primary: #064E3B;
    }

    body { font-family: 'Manrope', sans-serif; background-color: var(--color-bg); color: var(--color-text-main); }
    h1, h2, h3, h4, .serif { font-family: 'Playfair Display', serif; }
    
    .glass-card {
      background: rgba(255, 255, 255, 0.75); 
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
    }
  `}</style>
);

// CSS background replaces Three.js
const AnimBg = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full bg-emerald-200/20 blur-3xl" style={{animation:'drift 20s ease-in-out infinite'}} />
    <div className="absolute -bottom-40 -left-32 w-[450px] h-[450px] rounded-full bg-amber-100/15 blur-3xl" style={{animation:'drift 26s ease-in-out infinite reverse'}} />
    <style>{`@keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-30px)}}`}</style>
  </div>
);


// --- 3. UI Components ---
const GlassInput = ({ icon: Icon, ...props }) => (
  <div className="relative group">
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/50 group-focus-within:text-emerald-700 transition-colors" size={18} />}
    <input 
      {...props}
      className={`w-full bg-white/50 border border-stone-200 rounded-xl py-3.5 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-700 focus:bg-white transition-all shadow-sm`}
    />
  </div>
);

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: 'patient', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return setMessage({ type: 'error', text: 'Name is required' });
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return setMessage({ type: 'error', text: 'Valid email is required' });
    if (formData.password.length < 8) return setMessage({ type: 'error', text: 'Password must be 8+ chars' });
    if (formData.password !== formData.confirmPassword) return setMessage({ type: 'error', text: 'Passwords do not match' });
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/register`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Account created! Redirecting...' });
        setTimeout(() => {
          window.location.href = response.data.user.role === "practitioner" ? '/practitioner-setup' : '/dashboard';
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Registration failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Something went wrong.' });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.email.trim()) return setMessage({ type: 'error', text: 'Please fill all fields' });
    }
    if (currentStep < 2) setCurrentStep(prev => prev + 1);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F5F4] flex items-center justify-center relative overflow-hidden selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />
      <AnimBg />
      
      <div className="relative z-10 w-full max-w-5xl px-6 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Brand/Context (Desktop Only) */}
        <div className="hidden md:block space-y-6">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-widest shadow-sm">
              <Leaf size={12} /> Join AyurSutra
           </div>
           <h1 className="text-6xl font-bold text-stone-900 serif leading-tight">
              Begin your journey to <span className="text-emerald-800 italic">holistic wellness.</span>
           </h1>
           <p className="text-stone-600 text-lg max-w-md font-medium leading-relaxed">
              Create an account to access personalized Ayurveda plans, expert practitioners, and AI-driven insights.
           </p>
           
           <div className="flex items-center gap-4 text-sm font-bold text-stone-500 pt-8">
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#F5F5F4] bg-stone-200 flex items-center justify-center text-xs">User</div>
                 ))}
              </div>
              <p>Join 10,000+ others healing naturally.</p>
           </div>
        </div>

        {/* Right: Signup Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }}
          className="glass-card p-8 md:p-10 rounded-3xl"
        >
          <div className="mb-8 text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-white">
                   <Leaf size={16} fill="currentColor" />
                </div>
                <span className="text-xl font-bold serif text-emerald-900">AyurSutra</span>
             </div>
             <h2 className="text-2xl font-bold text-stone-900">Create Account</h2>
             <p className="text-stone-500 text-sm mt-1">Step {currentStep} of 2</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-200 h-1 rounded-full mb-8 overflow-hidden">
             <motion.div 
               initial={{ width: "0%" }} 
               animate={{ width: currentStep === 1 ? "50%" : "100%" }} 
               className="h-full bg-emerald-600 rounded-full"
             />
          </div>

          {/* Error/Success Message */}
          <AnimatePresence>
            {message.text && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className={`mb-6 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}
              >
                 {message.type === 'error' ? <Shield size={16}/> : <CheckCircle2 size={16}/>}
                 {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            
            {currentStep === 1 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Identity</label>
                   <GlassInput icon={User} name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} />
                </div>
                
                <div className="space-y-1">
                   <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Contact</label>
                   <GlassInput icon={Mail} type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} />
                   <GlassInput icon={Phone} type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} className="mt-3" />
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">I am a...</label>
                   <div className="grid grid-cols-2 gap-3">
                      {['patient', 'practitioner'].map(r => (
                         <button 
                           key={r}
                           onClick={() => setFormData({...formData, role: r})}
                           className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                             formData.role === r 
                             ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' 
                             : 'bg-white/50 text-stone-600 border-stone-200 hover:bg-white'
                           }`}
                         >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                         </button>
                      ))}
                   </div>
                </div>

                <button onClick={nextStep} className="w-full bg-emerald-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all shadow-lg mt-4">
                   Continue <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                 <div className="space-y-4">
                    <div className="relative">
                       <GlassInput icon={Lock} type={showPassword ? "text" : "password"} name="password" placeholder="Create Password" value={formData.password} onChange={handleInputChange} />
                       <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                       </button>
                    </div>
                    
                    <div className="relative">
                       <GlassInput icon={Lock} type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} />
                       <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                          {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                       </button>
                    </div>
                 </div>

                 <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs text-stone-600 space-y-2">
                    <p className="font-bold text-emerald-800">Password Strength:</p>
                    <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-emerald-500' : 'bg-stone-300'}`}/> At least 8 characters</div>
                    <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-emerald-500' : 'bg-stone-300'}`}/> Contains a number</div>
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button onClick={() => setCurrentStep(1)} className="px-5 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                       <ArrowLeft size={20} />
                    </button>
                    <button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-emerald-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
                       {isLoading ? <Loader2 className="animate-spin" size={20}/> : "Create Account"}
                    </button>
                 </div>
              </motion.div>
            )}

          </form>

          <div className="mt-8 text-center pt-6 border-t border-stone-200/60">
             <p className="text-sm text-stone-500 font-medium">
                Already have an account? <a href="/login" className="text-emerald-800 font-bold hover:underline">Sign In</a>
             </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;