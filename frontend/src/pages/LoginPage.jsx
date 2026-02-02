import React, { useState, useRef, Suspense } from 'react';
import { 
  Eye, EyeOff, Leaf, Mail, Lock, ArrowRight, User, 
  Shield, Loader2, CheckCircle2, ArrowLeft 
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/userContext"; 
import * as THREE from "three";

// --- 1. Global Styles & Theme (Shared) ---
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

// --- 2. 3D Background (Prana Flow) ---
const OrganicFluid = () => {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.2;
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(t) * 0.3;
      meshRef.current.rotation.y = Math.cos(t * 0.8) * 0.3;
      meshRef.current.position.y = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} position={[2, 0, -2]}>
      <mesh ref={meshRef} scale={[3.5, 3.5, 3.5]}>
        <icosahedronGeometry args={[1, 6]} /> 
        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={2}
          chromaticAberration={0.03}
          anisotropy={0.1}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.1}
          iridescence={0.3}
          color={new THREE.Color("#065f46")}
          bg={new THREE.Color("#F5F5F4")}
          transmission={0.9}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
};

const Scene = () => (
  <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
      <ambientLight intensity={0.8} color="#e7e5e4" />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} color="#fff" />
      <Suspense fallback={null}>
        <OrganicFluid />
        <Environment preset="city" blur={0.8} /> 
      </Suspense>
    </Canvas>
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

const LoginPage = () => {
  const { user, setUser } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to={user.role === "practitioner" ? "/doctor-dashboard" : "/dashboard"} replace />;
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    if (!formData.email.trim()) return setMessage({ type: 'error', text: 'Email is required' });
    if (!formData.password.trim()) return setMessage({ type: 'error', text: 'Password is required' });
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/login`, formData);

      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token);
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Invalid credentials.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Something went wrong.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email) return setMessage({ type: 'error', text: 'Enter email first.' });
    setMessage({ type: 'success', text: 'Reset link sent!' });
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F5F4] flex items-center justify-center relative overflow-hidden selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />
      <Scene />
      
      <div className="relative z-10 w-full max-w-5xl px-6 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Brand/Context (Desktop Only) */}
        <div className="hidden md:block space-y-6">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-widest shadow-sm">
              <Leaf size={12} /> Welcome Back
           </div>
           <h1 className="text-6xl font-bold text-stone-900 serif leading-tight">
              Continue your path to <span className="text-emerald-800 italic">balance.</span>
           </h1>
           <p className="text-stone-600 text-lg max-w-md font-medium leading-relaxed">
              Sign in to access your personalized wellness dashboard, track your progress, and consult with experts.
           </p>
           
           <div className="flex items-center gap-4 text-sm font-bold text-stone-500 pt-8">
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#F5F5F4] bg-stone-200 flex items-center justify-center text-xs">User</div>
                 ))}
              </div>
              <p>Trusted by 10,000+ users.</p>
           </div>
        </div>

        {/* Right: Login Card */}
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
             <h2 className="text-2xl font-bold text-stone-900">Sign In</h2>
             <p className="text-stone-500 text-sm mt-1">Welcome back to your dashboard</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Email</label>
                  <GlassInput icon={Mail} type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />
               </div>
               
               <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                     <GlassInput icon={Lock} type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                     </button>
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-between text-sm">
               <label className="flex items-center gap-2 cursor-pointer text-stone-600 hover:text-stone-800 transition-colors">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"/>
                  Remember me
               </label>
               <button type="button" onClick={handleForgotPassword} className="font-bold text-emerald-700 hover:underline">Forgot Password?</button>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-emerald-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
               {isLoading ? <Loader2 className="animate-spin" size={20}/> : <>Sign In <ArrowRight size={18}/></>}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-stone-200/60">
             <p className="text-sm text-stone-500 font-medium">
                Don't have an account? <a href="/register" className="text-emerald-800 font-bold hover:underline">Create Account</a>
             </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;