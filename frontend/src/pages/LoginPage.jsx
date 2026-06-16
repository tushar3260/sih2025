import React, { useState } from 'react';
import { 
  Eye, EyeOff, Leaf, Mail, Lock, ArrowRight,
  Shield, Loader2, CheckCircle2, Sparkles, HeartPulse
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, Link } from "react-router-dom";
import { useUser } from "../context/userContext";

const AnimBg = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute -top-40 -right-40 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full bg-emerald-200/20 blur-3xl" style={{ animation: 'drift 20s ease-in-out infinite' }} />
    <div className="absolute -bottom-40 -left-40 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-amber-100/15 blur-3xl" style={{ animation: 'drift 26s ease-in-out infinite reverse' }} />
    <style>{`@keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-30px)}}`}</style>
  </div>
);

const InputField = ({ icon: Icon, label, id, rightEl, ...props }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-700 transition-colors" size={17} />}
      <input
        id={id} {...props}
        className={`w-full bg-white/60 border border-stone-200 rounded-xl py-3.5 ${Icon ? 'pl-11' : 'pl-4'} ${rightEl ? 'pr-12' : 'pr-4'} text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600 focus:bg-white transition-all shadow-sm text-sm`}
      />
      {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
    </div>
  </div>
);

const LoginPage = () => {
  const { user, setUser } = useUser();
  const [formData,      setFormData]      = useState({ email: '', password: '' });
  const [showPassword,  setShowPassword]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [message,       setMessage]       = useState({ type: '', text: '' });
  const [rememberMe,    setRememberMe]    = useState(false);

  if (user) {
    return <Navigate to={user.role === "practitioner" ? "/doctor-dashboard" : "/dashboard"} replace />;
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) return setMessage({ type: 'error', text: 'Email is required' });
    if (!formData.password.trim()) return setMessage({ type: 'error', text: 'Password is required' });

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/login`, formData);
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Invalid credentials.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F5F4] flex flex-col items-center justify-center relative overflow-hidden p-4 selection:bg-emerald-200 selection:text-emerald-900">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap'); body{font-family:'Manrope',sans-serif;} .serif{font-family:'Playfair Display',serif;}`}</style>
      <AnimBg />

      {/* Back to home link */}
      <div className="relative z-10 w-full max-w-5xl mb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors text-sm font-bold">
          <Leaf size={14} className="text-emerald-700" /> AyurSutra
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-8 lg:gap-12 items-center">

        {/* Left: Brand (desktop only) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="hidden md:flex flex-col justify-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-widest w-fit">
            <HeartPulse size={12} className="text-emerald-600" /> Wellness Platform
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-stone-900 serif leading-tight">
            Continue your path to{" "}
            <span className="text-emerald-800 italic">balance.</span>
          </h1>
          <p className="text-stone-600 text-base lg:text-lg max-w-sm font-medium leading-relaxed">
            Sign in to access your personalized wellness dashboard, track your progress, and consult with experts.
          </p>

          {/* Feature pills */}
          <div className="space-y-2.5 pt-2">
            {[
              { icon: Shield, text: "HIPAA-compliant & fully encrypted" },
              { icon: Sparkles, text: "AI-powered Ayurvedic insights" },
              { icon: CheckCircle2, text: "10,000+ patients trust AyurSutra" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-stone-600 font-medium">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-emerald-700" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl w-full"
        >
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-6 md:hidden justify-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-white">
              <Leaf size={15} fill="currentColor" />
            </div>
            <span className="text-lg font-bold serif text-emerald-900">AyurSutra</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 serif">Welcome back</h2>
            <p className="text-stone-500 text-sm mt-1 font-medium">Sign in to your account to continue</p>
          </div>

          {/* Alert */}
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className={`mb-5 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5
                  ${message.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}
              >
                {message.type === 'error' ? <Shield size={16} className="shrink-0"/> : <CheckCircle2 size={16} className="shrink-0"/>}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <InputField
              id="email" icon={Mail} label="Email Address"
              type="email" name="email" placeholder="you@example.com"
              value={formData.email} onChange={handleInputChange} required
            />
            <InputField
              id="password" icon={Lock} label="Password"
              type={showPassword ? "text" : "password"} name="password"
              placeholder="••••••••" value={formData.password} onChange={handleInputChange} required
              rightEl={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-stone-400 hover:text-stone-700 transition-colors p-1" aria-label="Toggle password">
                  {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-stone-600 hover:text-stone-800 transition-colors select-none">
                <input
                  type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-xs font-medium">Remember me</span>
              </label>
              <button type="button" className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-emerald-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 text-sm sm:text-base">
              {isLoading ? <><Loader2 className="animate-spin" size={18}/> Signing in…</> : <>Sign In <ArrowRight size={17}/></>}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 sm:my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">New to AyurSutra?</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <Link to="/register"
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-stone-200 rounded-xl font-bold text-stone-700 text-sm hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all">
            Create Free Account <ArrowRight size={15} />
          </Link>

          <p className="text-center text-xs text-stone-400 mt-4 sm:mt-5">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-stone-700">Terms</a> and{" "}
            <a href="#" className="underline hover:text-stone-700">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;