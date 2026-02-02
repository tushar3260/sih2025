// src/pages/PatientDashboard.jsx
import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  Calendar, Clock, Activity, Leaf, Sparkles, X, 
  Menu, LogOut, Search, ChevronRight, User, 
  ArrowRight, ShieldCheck, TrendingUp, Lightbulb
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import HealthInfo from "./HealthInfo";

// ✅ API Config
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- 0. Shared Style Injection (Matches Landing Page) ---
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
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
    }
  `}</style>
);

// --- 1. 3D Background (Fluid Emerald Element) ---
const FluidGlass = () => {
  const mesh = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = t * 0.1;
    mesh.current.rotation.y = t * 0.15;
    mesh.current.position.y = Math.sin(t / 2) * 0.1;
  });

  return (
    <group position={[3, 0, -3]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={mesh} scale={1.8}>
          <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          <MeshTransmissionMaterial
            backside
            samples={6}
            thickness={2}
            chromaticAberration={0.04}
            anisotropy={0.1}
            distortion={0.4}
            distortionScale={0.5}
            temporalDistortion={0.1}
            iridescence={1}
            color="#047857" // Darker Emerald to match Zen Stones
            bg="#F5F5F4"
          />
        </mesh>
      </Float>
    </group>
  );
};

const Scene = () => (
  <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
      <ambientLight intensity={1.2} />
      <spotLight position={[10, 20, 10]} angle={0.2} penumbra={1} intensity={2} color="#fff7ed" />
      <Suspense fallback={null}>
        <FluidGlass />
        <Environment preset="forest" blur={0.6} background={false} />
      </Suspense>
    </Canvas>
  </div>
);

// --- 2. UI Components ---

const GlassPanel = ({ children, className = "", onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={onClick ? { y: -5, transition: { duration: 0.2 } } : {}}
    onClick={onClick}
    className={`glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${className} ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-emerald-600/30' : ''}`}
  >
    {children}
  </motion.div>
);

// --- 3. Main Dashboard ---

const PatientDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [therapies, setTherapies] = useState([]);
  
  // UI State
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (u) setUser(u);
    fetchData(u?.id);

    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fetchData = async (userId) => {
    try {
      const [apptRes, therapyRes] = await Promise.all([
        userId ? axios.get(`${API_BASE_URL}/appointments/me/${userId}`) : { data: [] },
        axios.get(`${API_BASE_URL}/therapies`)
      ]);

      const formatted = apptRes.data.map(appt => ({
        id: appt._id,
        title: appt.therapy?.name || "Therapy",
        doctor: appt.practitioner?.user?.name || "Expert Vaidya",
        date: new Date(appt.start).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        time: new Date(appt.start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: appt.status,
        description: appt.therapy?.description,
        price: appt.therapy?.price
      }));

      setAppointments(formatted);
      setTherapies(therapyRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("practioner");
    window.location.href = "/";
  };

  const navItems = [
    { id: "dashboard", label: "Overview" },
    { id: "appointments", label: "Schedule" },
    { id: "therapies", label: "Therapies" },
    { id: "ai", label: "AI Consultant" },
    { id: "health", label: "Health Info" },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-stone-100 text-stone-600 border-stone-200";
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F5F5F4] text-[#1C1917] overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />
      
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-multiply" 
           style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}>
      </div>

      {/* Top Loading Bar */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-800 via-emerald-500 to-amber-500 origin-left z-[100]" />

      {/* 3D Scene */}
      <Scene />

      {/* --- NAVBAR: CAPSULE STYLE (Matches Landing) --- */}
      <header className={`fixed top-6 left-0 right-0 z-50 transition-all duration-300 px-4`}>
         <div className={`max-w-5xl mx-auto rounded-full transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-xl border border-white/50 py-3 px-6' : 'bg-transparent py-4 px-0'}`}>
            <div className="flex justify-between items-center">
               
               {/* Logo */}
               <Link to="/" className="flex items-center gap-3 pl-2 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-lg border-2 border-white">
                     <Leaf size={18} fill="currentColor" />
                  </div>
                  <span className="text-xl font-bold tracking-tight serif text-gray-900">
                     Ayur<span className="text-emerald-700">Sutra</span>
                  </span>
               </Link>

               {/* Desktop Nav */}
               <nav className="hidden md:flex items-center gap-1 bg-stone-200/50 p-1.5 rounded-full backdrop-blur-md border border-white/50">
                  {navItems.map(item => (
                     <button 
                        key={item.id} 
                        onClick={() => setActiveSection(item.id)}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                           activeSection === item.id 
                           ? "bg-white text-emerald-800 shadow-md" 
                           : "text-stone-700 hover:bg-white/50 hover:text-emerald-800"
                        }`}
                     >
                        {item.label}
                     </button>
                  ))}
               </nav>

               {/* Auth/Menu */}
               <div className="flex items-center gap-3 pr-2">
                  <button onClick={handleLogout} className="hidden md:flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/20">
                     Sign Out <LogOut size={16} />
                  </button>
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
                 {navItems.map(item => (
                    <button key={item.id} onClick={() => {setActiveSection(item.id); setMobileMenu(false)}} className="text-2xl font-bold text-stone-800 serif border-b border-stone-200 pb-2">
                       {item.label}
                    </button>
                 ))}
                 <button onClick={handleLogout} className="mt-8 w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-xl">
                    Sign Out
                 </button>
                 <button onClick={() => setMobileMenu(false)} className="absolute top-8 right-8 p-2 bg-stone-200 rounded-full"><X/></button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 pt-40 pb-12 px-6 max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
           <div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-widest mb-4">
                 <Sparkles size={12} fill="currentColor"/> Patient Portal
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-emerald-950 tracking-tight serif mb-2">
                 Namaste, {user?.name?.split(' ')[0] || "User"} 🙏
              </h1>
              <p className="text-stone-600 font-medium text-lg">Manage your healing journey with precision.</p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="hidden md:flex relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                 <input type="text" placeholder="Search records..." className="bg-white/60 border border-stone-200 rounded-full py-3 pl-10 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:bg-white w-64 shadow-sm transition-all" />
              </div>
              <div className="glass-card px-5 py-3 rounded-full text-sm font-bold text-stone-600">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
           </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            
            {/* --- DASHBOARD OVERVIEW --- */}
            {activeSection === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: "Sessions", val: appointments.length, icon: Calendar, color: "emerald" },
                    { label: "Hours", val: appointments.length * 1.5, icon: Clock, color: "amber" },
                    { label: "Dosha", val: "Vata-Pitta", icon: Activity, color: "blue" },
                    { label: "Therapies", val: therapies.length, icon: Leaf, color: "teal" }
                  ].map((stat, i) => (
                    <GlassPanel key={i} className="flex items-center gap-5 group hover:border-emerald-600/30">
                      <div className={`w-14 h-14 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-700 border border-${stat.color}-100 shadow-inner`}>
                        <stat.icon size={26} />
                      </div>
                      <div>
                        <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-gray-900 serif">{stat.val}</h3>
                      </div>
                    </GlassPanel>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Appointments List */}
                  <div className="lg:col-span-2 space-y-6">
                    <GlassPanel className="min-h-[400px]">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 serif">Upcoming Sessions</h3>
                        <button onClick={() => setActiveSection('appointments')} className="text-sm font-bold text-emerald-800 hover:text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                          View All <ChevronRight size={16}/>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {appointments.length > 0 ? appointments.slice(0, 3).map(appt => (
                          <div key={appt.id} className="group flex flex-col sm:flex-row items-start sm:items-center p-5 rounded-2xl bg-white/40 border border-stone-100 hover:bg-white hover:shadow-lg hover:border-emerald-100 transition-all cursor-pointer" onClick={() => { setSelectedAppointment(appt); setShowModal(true); }}>
                            <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-700 flex flex-col items-center justify-center border border-stone-200 mr-5 mb-4 sm:mb-0 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                              <span className="text-xs font-bold uppercase">{appt.date.split(' ')[1]}</span>
                              <span className="text-xl font-bold serif">{appt.date.split(' ')[0]}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-900 serif group-hover:text-emerald-800 transition-colors">{appt.title}</h4>
                              <p className="text-stone-500 text-sm flex items-center gap-3 mt-1 font-medium">
                                <span className="flex items-center gap-1"><Clock size={14} className="text-amber-600"/> {appt.time}</span>
                                <span className="flex items-center gap-1"><User size={14} className="text-emerald-600"/> {appt.doctor}</span>
                              </p>
                            </div>
                            <span className={`mt-3 sm:mt-0 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(appt.status)}`}>
                              {appt.status}
                            </span>
                          </div>
                        )) : (
                          <div className="text-center py-16 text-stone-400">
                             <Calendar size={48} className="mx-auto mb-4 opacity-20"/>
                             <p>No upcoming appointments</p>
                          </div>
                        )}
                      </div>
                    </GlassPanel>
                  </div>

                  {/* Right Column Widgets */}
                  <div className="space-y-6">
                    {/* Featured Card */}
                    <GlassPanel className="bg-emerald-900 text-white !border-emerald-800">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                      <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-emerald-100 text-xs font-bold mb-6 border border-white/20">
                          <Sparkles size={12}/> Recommended
                        </div>
                        <h3 className="text-3xl font-bold mb-3 serif text-white">Shirodhara</h3>
                        <p className="text-emerald-100/80 text-sm mb-8 leading-relaxed font-medium">
                          Relieve mental stress and anxiety with our signature oil pouring therapy.
                        </p>
                        <button onClick={() => setActiveSection('therapies')} className="w-full py-4 bg-white text-emerald-900 rounded-xl font-bold hover:bg-amber-50 transition-colors shadow-lg">
                          Book Now
                        </button>
                      </div>
                    </GlassPanel>

                    {/* Chart Preview */}
                    <GlassPanel className="h-[240px] flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Wellness Score</h4>
                           <TrendingUp size={16} className="text-emerald-600"/>
                        </div>
                        <div className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={[{n:'1',v:40},{n:'2',v:60},{n:'3',v:55},{n:'4',v:80},{n:'5',v:70}]}>
                                <defs>
                                   <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                             </AreaChart>
                          </ResponsiveContainer>
                        </div>
                    </GlassPanel>
                  </div>
                </div>
              </div>
            )}

            {/* --- THERAPIES --- */}
            {activeSection === 'therapies' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {therapies.map((therapy, i) => (
                  <GlassPanel key={i} className="p-0 flex flex-col group h-full hover:shadow-2xl hover:border-emerald-600/30 transition-all duration-500">
                    <div className="h-56 bg-stone-200 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-amber-50 group-hover:scale-110 transition-transform duration-700"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <Leaf size={80} className="text-emerald-900"/>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold shadow-sm text-emerald-900">
                        {therapy.duration || 60} Min
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900 serif">{therapy.name}</h3>
                        <p className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md">₹{therapy.price}</p>
                      </div>
                      <p className="text-stone-600 text-sm mb-8 line-clamp-3 leading-relaxed font-medium">
                        {therapy.description || "A holistic treatment designed to restore balance to your body and mind."}
                      </p>
                      <button onClick={() => navigate(`/book/${therapy._id}`)} className="mt-auto w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg">
                        Book Session <ArrowRight size={18}/>
                      </button>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}

            {/* --- APPOINTMENTS LIST VIEW --- */}
            {activeSection === 'appointments' && (
              <GlassPanel className="min-h-[600px]">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-stone-200">
                  <h3 className="text-3xl font-bold text-gray-900 serif">My Appointments</h3>
                  <div className="flex gap-2">
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-bold">Upcoming</span>
                    <span className="px-4 py-2 bg-white border border-stone-200 text-stone-500 rounded-lg text-sm font-bold cursor-pointer hover:bg-stone-50 transition-colors">History</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {appointments.map(appt => (
                    <div key={appt.id} className="flex flex-col md:flex-row items-center p-6 bg-white/50 border border-stone-200 rounded-2xl shadow-sm hover:shadow-xl transition-all gap-6 group">
                      <div className="flex flex-col items-center justify-center w-20 h-20 bg-stone-100 rounded-2xl border border-stone-200 text-stone-600 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                        <span className="text-xs font-bold uppercase">{appt.date.split(' ')[1]}</span>
                        <span className="text-2xl font-bold serif">{appt.date.split(' ')[0]}</span>
                      </div>
                      
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="text-xl font-bold text-gray-900 mb-2 serif">{appt.title}</h4>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-stone-500 font-medium">
                          <span className="flex items-center gap-1"><Clock size={16} className="text-amber-600"/> {appt.time}</span>
                          <span className="flex items-center gap-1"><User size={16} className="text-emerald-600"/> {appt.doctor}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${getStatusColor(appt.status)}`}>
                          {appt.status.toUpperCase()}
                        </span>
                        <button onClick={() => { setSelectedAppointment(appt); setShowModal(true); }} className="p-3 bg-white border border-stone-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-stone-600 shadow-sm">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && <div className="text-center py-20 text-stone-400 font-medium">No appointments found.</div>}
                </div>
              </GlassPanel>
            )}

            {/* --- OTHER SECTIONS --- */}
            {activeSection === 'health' && <HealthInfo />}
            
            {activeSection === 'ai' && (
              <GlassPanel className="flex flex-col items-center justify-center text-center py-24">
                <div className="w-24 h-24 bg-gradient-to-tr from-emerald-800 to-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-900/20">
                  <Lightbulb size={40} className="text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4 serif">Vaidya AI Consultant</h2>
                <p className="text-stone-600 max-w-lg mb-10 text-lg leading-relaxed">
                  Get personalized health insights based on your Prakriti and current lifestyle. Our AI analyzes ancient texts to give you modern advice.
                </p>
                <button onClick={() => navigate("/ai-consultant")} className="px-10 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-emerald-700 hover:scale-105 transition-all shadow-xl">
                  Start Analysis
                </button>
              </GlassPanel>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- DETAILS MODAL --- */}
      <AnimatePresence>
        {showModal && selectedAppointment && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/50"
            >
              <div className="bg-emerald-900 p-8 text-white flex justify-between items-start relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-2 serif">{selectedAppointment.title}</h3>
                  <div className="flex gap-2">
                     <span className="px-2 py-1 bg-emerald-800 rounded text-xs font-bold tracking-wide uppercase border border-emerald-700">{selectedAppointment.status}</span>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors relative z-10">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-5 p-5 bg-stone-50 rounded-2xl border border-stone-100">
                   <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-emerald-800 shadow-sm font-bold border border-stone-200">
                      <User size={24}/>
                   </div>
                   <div>
                      <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Practitioner</p>
                      <p className="font-bold text-gray-900 text-xl serif">{selectedAppointment.doctor}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 bg-white border border-stone-200 rounded-2xl text-center">
                      <Calendar size={24} className="mx-auto mb-3 text-amber-600"/>
                      <p className="font-bold text-gray-900">{selectedAppointment.date}</p>
                   </div>
                   <div className="p-5 bg-white border border-stone-200 rounded-2xl text-center">
                      <Clock size={24} className="mx-auto mb-3 text-emerald-600"/>
                      <p className="font-bold text-gray-900">{selectedAppointment.time}</p>
                   </div>
                </div>

                <div>
                   <p className="text-xs text-stone-400 font-bold uppercase mb-3 tracking-wider">Instructions</p>
                   <p className="text-stone-600 text-sm leading-relaxed font-medium">
                      {selectedAppointment.description || "Please arrive 15 minutes early. Wear loose, comfortable clothing for the therapy. Do not consume heavy food 2 hours prior to the session."}
                   </p>
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50 flex gap-4">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white border border-stone-300 text-stone-700 font-bold rounded-xl hover:bg-stone-100 transition-colors shadow-sm">Close</button>
                 <button className="flex-1 py-3 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md">Reschedule</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PatientDashboard;