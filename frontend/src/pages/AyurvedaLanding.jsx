// src/pages/AyurvedaLanding.jsx
import React, { useEffect, useState, useRef, Suspense } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Environment, 
  MeshTransmissionMaterial, 
  Sparkles as ThreeSparkles, 
  Float, 
  ContactShadows 
} from "@react-three/drei";
import { 
  motion, 
  useScroll, 
  useSpring, 
  useTransform, 
  useMotionValue, 
  AnimatePresence 
} from "framer-motion";
import {
  Leaf, CalendarCheck2, ChevronRight, ArrowRight, Play, Star,
  Menu, X, Sparkles, UserCheck, ArrowUpRight, Search, Quote,
  Stethoscope, Activity, ScrollText, ShieldCheck, HeartPulse,
  Clock, MapPin, Phone, Mail, Instagram, Linkedin, Twitter
} from "lucide-react";

// ✅ API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- 0. Global Font & Style Injection (Premium Theme) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    
    :root {
      --color-bg: #F5F5F4; /* Warm Stone - Not Bright White */
      --color-text-main: #1C1917; /* Dark Charcoal */
      --color-text-muted: #57534E; /* Visible Gray */
      --color-primary: #064E3B; /* Deep Forest Green */
      --color-accent: #D97706; /* Earthy Gold */
    }

    body { 
      font-family: 'Manrope', sans-serif; 
      background-color: var(--color-bg);
      color: var(--color-text-main);
    }
    
    h1, h2, h3, h4, .serif { font-family: 'Playfair Display', serif; }
    
    /* Scrollbar Styling */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #E7E5E4; }
    ::-webkit-scrollbar-thumb { background: #064E3B; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #042f2e; }

    .glass-card {
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
    }

    .text-shadow-sm { text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
  `}</style>
);

// --- 1. 3D Zen Stones (Darker, Richer Material) ---
const ZenStones = () => {
  const group = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.position.y = Math.sin(t / 2.5) * 0.15; // Slow float
    group.current.rotation.y = t * 0.08; 
  });

  // Darker Jade Material settings for visibility against light bg
  const materialProps = {
    samples: 6,
    thickness: 1.5,
    chromaticAberration: 0.04,
    anisotropy: 0.1,
    distortion: 0.2,
    distortionScale: 0.1,
    temporalDistortion: 0.1,
    iridescence: 1,
    iridescenceIOR: 1.2,
    color: "#047857", // Darker Emerald
    bg: "#e7e5e4",    // Reflects the stone background
  };

  return (
    <group ref={group} position={[3, -0.5, 0]} rotation={[0, -0.5, 0]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Foundation Stone */}
        <mesh position={[0, -1.3, 0]} scale={[1.8, 0.7, 1.8]}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshTransmissionMaterial {...materialProps} color="#064e3b" />
        </mesh>
        
        {/* Core Stone */}
        <mesh position={[0.2, -0.1, 0]} scale={[1.5, 0.6, 1.5]} rotation={[0.1, 0, -0.1]}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshTransmissionMaterial {...materialProps} color="#059669" />
        </mesh>

        {/* Mind Stone (Top) */}
        <mesh position={[-0.1, 0.9, 0]} scale={[0.8, 0.45, 0.8]} rotation={[-0.1, 0, 0.1]}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshTransmissionMaterial {...materialProps} color="#10b981" />
        </mesh>

        <ThreeSparkles count={40} scale={5} size={4} speed={0.4} opacity={0.8} color="#d97706" />
      </Float>
      <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
    </group>
  );
};

const Scene = () => (
  <div className="fixed inset-0 z-0 pointer-events-none h-screen w-full">
    <Canvas camera={{ position: [0, 0, 9], fov: 35 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
      <ambientLight intensity={1.2} /> 
      <spotLight position={[10, 20, 10]} angle={0.2} penumbra={1} intensity={2} color="#fff7ed" />
      <directionalLight position={[-5, 5, 5]} intensity={1} color="#fbbf24" />
      <Suspense fallback={null}>
        <ZenStones />
        <Environment preset="forest" blur={0.6} background={false} />
      </Suspense>
    </Canvas>
  </div>
);

// --- 2. Advanced UI Components ---

// High Contrast Tilt Card
const TiltCard = ({ children, className = "", delay = 0 }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [3, -3]);
  const rotateY = useTransform(x, [-100, 100], [-3, 3]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, type: "spring", stiffness: 50 }}
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={`relative glass-card rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-600/30 transition-all duration-500 ${className}`}
    >
      {children}
    </motion.div>
  );
};

const SectionTitle = ({ title, sub, center = true }) => (
  <div className={`mb-16 ${center ? 'text-center' : 'text-left'}`}>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-widest mb-4 ${center ? 'mx-auto' : ''}`}
    >
      <Sparkles size={12} fill="currentColor" /> {sub}
    </motion.div>
    <motion.h2
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-4xl md:text-5xl font-bold text-emerald-950 tracking-tight serif"
    >
      {title}
    </motion.h2>
    {center && <div className="h-1.5 w-24 bg-gradient-to-r from-emerald-600 to-amber-500 mt-6 rounded-full mx-auto" />}
  </div>
);

// --- 3. Practitioner Card (High Visibility) ---
const RealPractitionerCard = ({ practitioner }) => {
  const name = practitioner.user?.name || "Dr. Ayurveda";
  const specialties = practitioner.specialty || ["General Care"];
  const experience = practitioner.user?.experience || practitioner.experience || "5";
  const availability = practitioner.availability || [];
  
  return (
    <TiltCard className="flex flex-col h-full bg-white border border-stone-200 shadow-md">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-6">
           <div className="w-16 h-16 rounded-full bg-stone-100 border-2 border-emerald-100 flex items-center justify-center text-emerald-800 shadow-inner">
              <Stethoscope size={28} />
           </div>
           {/* Verified Badge */}
           <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-emerald-200">
              <ShieldCheck size={12} /> Verified
           </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 serif group-hover:text-emerald-700 transition-colors">{name}</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
           {specialties.slice(0, 2).map((s, i) => (
              <span key={i} className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-1 rounded-md border border-stone-200">
                {s}
              </span>
           ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-stone-600 font-medium">
           <div className="flex items-center gap-1"><Clock size={14} className="text-amber-600"/> {experience} Yrs Exp</div>
           <div className="flex items-center gap-1"><UserCheck size={14} className="text-amber-600"/> 98% Rating</div>
        </div>
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
         <div className="text-xs font-bold text-emerald-700 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${availability.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            {availability.length > 0 ? "Available Today" : "Fully Booked"}
         </div>
         <button className="bg-gray-900 hover:bg-emerald-700 text-white p-2 rounded-full transition-colors shadow-lg">
            <ArrowRight size={16} />
         </button>
      </div>
    </TiltCard>
  );
};

// --- 4. Main Page Component ---

const AyurvedaLanding = () => {
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [practitioners, setPractitioners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user"))); } catch {}
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fetchPractitioners = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiPromise = axios.get(`${API_BASE_URL}/practitioners/`);
      const response = await Promise.race([apiPromise, new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 8000))]);
      setPractitioners(response.data || []);
    } catch (err) {
      setError("Server unreachable.");
      setPractitioners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPractitioners(); }, []);

  const getDashboardRoute = () => {
    try {
      if (user?.role === 'practitioner' || user?.role === 'doctor') return "/doctor-dashboard";
      if (user?._id) return "/dashboard";
      return "/login";
    } catch { return "/login"; }
  };

  return (
    <div className="relative min-h-screen bg-[#F5F5F4] text-gray-900 overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />
      
      {/* Background Texture (Reduces brightness) */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-multiply" 
           style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}>
      </div>
      
      {/* Top Loading Bar */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-800 via-emerald-500 to-amber-500 origin-left z-[100]" />

      {/* 3D Scene */}
      <Scene />
      
      {/* --- NAVBAR: CAPSULE STYLE (Previous Design Restored) --- */}
      <header className={`fixed top-6 left-0 right-0 z-50 transition-all duration-300 px-4`}>
         <div className={`max-w-5xl mx-auto rounded-full transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-xl border border-white/50 py-3 px-6' : 'bg-transparent py-4 px-0'}`}>
            <div className="flex justify-between items-center">
               
               {/* Logo */}
               <Link to="/" className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-lg border-2 border-white">
                     <Leaf size={18} fill="currentColor" />
                  </div>
                  <span className={`text-xl font-bold tracking-tight serif ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>
                    Ayur<span className="text-emerald-700">Sutra</span>
                  </span>
               </Link>

               {/* Desktop Nav */}
               <nav className="hidden md:flex items-center gap-1 bg-stone-200/50 p-1.5 rounded-full backdrop-blur-md border border-white/50">
                  {["Home", "Features", "Practitioners", "Services"].map(item => (
                     <a key={item} href={`#${item.toLowerCase()}`} className="px-5 py-2 rounded-full text-sm font-bold text-stone-700 hover:bg-white hover:text-emerald-800 hover:shadow-md transition-all">
                        {item}
                     </a>
                  ))}
               </nav>

               {/* Auth Button */}
               <div className="flex items-center gap-3 pr-2">
                  <Link to={getDashboardRoute()} className="hidden md:flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/20">
                     {user ? "Dashboard" : "Login"} <ArrowRight size={16} />
                  </Link>
                  <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-800">
                    <Menu size={20}/>
                  </button>
               </div>
            </div>
         </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenu && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-[#F5F5F4] pt-32 px-6 md:hidden">
              <div className="flex flex-col gap-6 text-center">
                 {["Home", "Features", "Practitioners", "Services"].map(item => (
                    <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="text-2xl font-bold text-stone-800 serif border-b border-stone-200 pb-2">{item}</a>
                 ))}
                 <Link to={getDashboardRoute()} className="mt-8 w-full py-4 bg-emerald-800 text-white rounded-xl font-bold text-lg shadow-xl">
                    {user ? "Go to Dashboard" : "Login / Sign Up"}
                 </Link>
                 <button onClick={() => setMobileMenu(false)} className="absolute top-8 right-8 p-2 bg-stone-200 rounded-full"><X/></button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section id="home" className="relative z-10 pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-visible">
         <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} transition={{duration: 0.8}}>
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 mb-8 shadow-sm">
                  <HeartPulse size={16} className="text-emerald-600"/>
                  <span className="text-xs font-bold uppercase tracking-wider">Trusted by 500+ Vaidyas</span>
               </div>
               
               <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 serif drop-shadow-sm">
                  The OS for <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-emerald-600">Ayurveda Clinics.</span>
               </h1>
               
               <p className="text-xl text-stone-700 max-w-lg leading-relaxed font-medium mb-10">
                  Simplify Panchakarma scheduling, Nadi Pariksha analysis, and inventory management with our secure, AI-powered platform.
               </p>
               
               <div className="flex flex-wrap gap-4">
                  <Link to="/login" className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg shadow-2xl hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-2 ring-4 ring-gray-200">
                     Get Started Free <ArrowUpRight size={20}/>
                  </Link>
                  <Link to="/therapies" className="px-8 py-4 bg-white border-2 border-stone-200 text-gray-900 rounded-full font-bold text-lg hover:border-emerald-600 hover:text-emerald-800 transition-all flex items-center gap-2 shadow-sm">
                     <Play size={18} fill="currentColor"/> Live Demo
                  </Link>
               </div>

               {/* Stats Row */}
               <div className="mt-12 flex items-center gap-8 pt-8 border-t border-stone-300/60">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">10k+</div>
                    <div className="text-xs font-bold text-stone-500 uppercase">Patients</div>
                  </div>
                  <div className="w-px h-10 bg-stone-300"></div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">99.9%</div>
                    <div className="text-xs font-bold text-stone-500 uppercase">Uptime</div>
                  </div>
               </div>
            </motion.div>

            {/* Right Side - Floating Card (Restored Visibility) */}
            <div className="relative hidden lg:block h-[500px]">
               {/* This area is left open for the 3D Background */}
               <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute bottom-20 right-0 z-20"
               >
                  <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white max-w-xs transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                        <CalendarCheck2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Upcoming Session</h4>
                        <p className="text-xs text-stone-500">Today, 4:00 PM</p>
                      </div>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-stone-700">Abhyanga</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">Confirmed</span>
                      </div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-emerald-500"></div>
                      </div>
                    </div>
                  </div>
               </motion.div>
            </div>
         </div>
      </section>

      {/* --- FEATURES (Bento Grid) --- */}
      <section id="features" className="relative z-10 py-28 bg-white border-y border-stone-200 shadow-sm">
         <div className="max-w-7xl mx-auto px-6">
            <SectionTitle title="Everything You Need" sub="For Modern Clinics" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Feature 1: Scheduling */}
               <TiltCard className="md:col-span-2 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 bg-stone-50 border border-stone-200">
                  <div className="flex-1">
                     <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20">
                        <CalendarCheck2 size={24} />
                     </div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-3 serif">Smart Scheduling Engine</h3>
                     <p className="text-stone-600 leading-relaxed font-medium">
                        Our algorithm handles room allocation, therapist shifts, and mandatory rest periods automatically. No more double bookings.
                     </p>
                  </div>
                  {/* Visual Representation */}
                  <div className="w-full md:w-2/5 bg-white rounded-xl shadow-lg border border-stone-200 p-4 space-y-3">
                     {[1,2,3].map(i => (
                       <div key={i} className={`flex items-center p-2 rounded-lg border ${i===1 ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                          <div className={`w-2 h-2 rounded-full mr-3 ${i===1 ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="h-2 w-16 bg-gray-200 rounded mb-1"></div>
                            <div className="h-1.5 w-10 bg-gray-100 rounded"></div>
                          </div>
                       </div>
                     ))}
                  </div>
               </TiltCard>

               {/* Feature 2: Prakriti */}
               <TiltCard className="p-8 bg-emerald-900 text-white border-emerald-800 shadow-2xl">
                   <Activity className="text-amber-400 mb-6" size={32}/>
                   <h3 className="text-2xl font-bold mb-3 serif text-white">Prakriti AI</h3>
                   <p className="text-emerald-100 text-sm leading-relaxed mb-6">
                      Advanced Dosha analysis based on Nadi Pariksha inputs.
                   </p>
                   {/* Bar Chart Visual */}
                   <div className="flex items-end gap-3 h-24 mt-auto">
                      <div className="w-1/3 bg-blue-400/80 rounded-t-md h-[40%]"></div>
                      <div className="w-1/3 bg-red-400/80 rounded-t-md h-[80%]"></div>
                      <div className="w-1/3 bg-yellow-400/80 rounded-t-md h-[60%]"></div>
                   </div>
               </TiltCard>

               {/* Feature 3: Records */}
               <TiltCard className="p-8 bg-white border border-stone-200">
                  <ScrollText className="text-emerald-700 mb-4" size={32}/>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 serif">Digital Granth</h3>
                  <p className="text-stone-600 text-sm font-medium">Instant access to classical texts and yoga formulations.</p>
               </TiltCard>

               {/* Feature 4: Security */}
               <TiltCard className="p-8 bg-white border border-stone-200">
                  <ShieldCheck className="text-emerald-700 mb-4" size={32}/>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 serif">HIPAA Compliant</h3>
                  <p className="text-stone-600 text-sm font-medium">Your patient data is encrypted and secure.</p>
               </TiltCard>

               {/* Feature 5: Inventory */}
               <TiltCard className="p-8 bg-amber-50 border border-amber-100">
                  <Leaf className="text-amber-700 mb-4" size={32}/>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 serif">Inventory</h3>
                  <p className="text-stone-600 text-sm font-medium">Track oils, herbs, and medicines with low-stock alerts.</p>
               </TiltCard>
            </div>
         </div>
      </section>

      {/* --- PRACTITIONERS --- */}
      <section id="practitioners" className="relative z-10 py-28 bg-[#F5F5F4]">
         <div className="max-w-7xl mx-auto px-6">
            <SectionTitle title="Expert Vaidyas" sub="Meet the Team" />
            <div className="min-h-[400px]">
               {loading ? (
                  <div className="grid md:grid-cols-3 gap-8">
                     {[1,2,3].map(i => (
                       <div key={i} className="h-80 bg-stone-200 rounded-2xl animate-pulse"></div>
                     ))}
                  </div>
               ) : error ? (
                 <div className="text-center p-10 bg-red-50 text-red-600 rounded-xl border border-red-200 font-bold">{error}</div>
               ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {practitioners.length > 0 ? practitioners.map((p, i) => (
                        <RealPractitionerCard key={p._id || i} practitioner={p} />
                     )) : (
                       <div className="col-span-full text-center py-20 text-stone-500 font-medium">
                         <UserCheck size={48} className="mx-auto mb-4 opacity-50"/>
                         No practitioners currently listed.
                       </div>
                     )}
                  </div>
               )}
            </div>
         </div>
      </section>

      {/* --- FOOTER (Heavy/Professional) --- */}
      <footer className="relative z-10 bg-[#1C1917] text-stone-400 pt-20 pb-10">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 border-b border-stone-800 pb-16">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-400">
                     <Leaf size={16} fill="currentColor"/>
                  </div>
                  <span className="text-xl font-bold text-stone-100 serif">AyurSutra</span>
               </div>
               <p className="text-sm leading-relaxed mb-6">
                  Digitizing the ancient science of life. Designed for Vaidyas, built for the future.
               </p>
               <div className="flex gap-4">
                  {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                    <a key={i} href="#" className="hover:text-emerald-500 transition-colors"><Icon size={20}/></a>
                  ))}
               </div>
            </div>

            <div>
               <h4 className="font-bold text-stone-100 mb-6 uppercase text-xs tracking-widest">Platform</h4>
               <ul className="space-y-3 text-sm">
                  {["Clinic Management", "Patient Records", "Telemedicine", "Pharmacy"].map(item => (
                    <li key={item}><a href="#" className="hover:text-emerald-500 transition-colors">{item}</a></li>
                  ))}
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-stone-100 mb-6 uppercase text-xs tracking-widest">Support</h4>
               <ul className="space-y-3 text-sm">
                  {["Help Center", "API Documentation", "System Status", "Contact Us"].map(item => (
                    <li key={item}><a href="#" className="hover:text-emerald-500 transition-colors">{item}</a></li>
                  ))}
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-stone-100 mb-6 uppercase text-xs tracking-widest">Contact</h4>
               <ul className="space-y-4 text-sm">
                  <li className="flex items-center gap-3">
                    <MapPin size={16} className="text-emerald-600"/> New Delhi, India
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone size={16} className="text-emerald-600"/> +91 98765 43210
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail size={16} className="text-emerald-600"/> hello@ayursutra.com
                  </li>
               </ul>
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
            <p>&copy; {new Date().getFullYear()} AyurSutra Technologies Pvt Ltd.</p>
            <div className="flex gap-6">
               <a href="#" className="hover:text-stone-200">Privacy Policy</a>
               <a href="#" className="hover:text-stone-200">Terms of Service</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default AyurvedaLanding;