import React, { useEffect, useState, useRef, Suspense } from "react";
import { 
  Clock, IndianRupee, Leaf, Calendar, ArrowRight, Loader2, 
  Sparkles, Menu, X, LogOut, LayoutDashboard 
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// --- 1. Global Styles ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    
    :root {
      --color-bg: #F5F5F4;
      --color-text-main: #1C1917;
      --color-primary: #064E3B;
    }

    body { font-family: 'Manrope', sans-serif; background-color: var(--color-bg); color: var(--color-text-main); }
    .serif { font-family: 'Playfair Display', serif; }
    
    .glass-card {
      background: rgba(255, 255, 255, 0.60); 
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    }
  `}</style>
);

// --- 2. 3D Background (Simplified Prana Flow) ---
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
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} position={[0, 0, -5]}>
      <mesh ref={meshRef} scale={[3, 3, 3]}>
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
  <div className="fixed inset-0 z-0 w-full h-full pointer-events-none opacity-40">
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
const GlassCard = ({ children, className = "", onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={onClick ? { y: -5 } : {}}
    onClick={onClick}
    className={`glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${className} ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-emerald-800/20' : ''}`}
  >
    {children}
  </motion.div>
);

const Therapies = () => {
  const [therapies, setTherapies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Navbar State
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  // Fetch Data & Auth Status
  useEffect(() => {
    // 1. Check Auth
    const u = JSON.parse(localStorage.getItem("user"));
    if (u) setUser(u);

    // 2. Scroll Listener
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);

    // 3. Fetch Data
    const fetchTherapies = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/therapies`);
        setTherapies(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch therapies.");
      } finally {
        setLoading(false);
      }
    };

    fetchTherapies();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("practioner");
    window.location.href = "/";
  };

  const getDashboardRoute = () => {
    if (user?.role === 'practitioner' || user?.role === 'doctor') return "/doctor-dashboard";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] relative selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      <GlobalStyles />
      <Scene />
      
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-multiply" 
           style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}>
      </div>

      {/* --- NAVBAR --- */}
      <header className={`fixed top-6 left-0 right-0 z-50 transition-all duration-300 px-4`}>
         <div className={`max-w-5xl mx-auto rounded-full transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-md border border-white/40 py-3 px-6' : 'bg-white/40 py-4 px-6 backdrop-blur-md border border-white/20'}`}>
            <div className="flex justify-between items-center">
               
               {/* Logo */}
               <Link to="/" className="flex items-center gap-3 pl-2 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-lg border-2 border-emerald-50">
                     <Leaf size={18} fill="currentColor" />
                  </div>
                  <span className="text-xl font-bold tracking-tight serif text-gray-900">
                     Ayur<span className="text-emerald-800">Sutra</span>
                  </span>
               </Link>

               {/* Desktop Nav */}
               <nav className="hidden md:flex items-center gap-1 bg-stone-100/50 p-1.5 rounded-full backdrop-blur-md border border-white/30 shadow-sm">
                  {["Home", "Features", "Practitioners"].map(item => (
                     <Link 
                        key={item} 
                        to={`/#${item.toLowerCase()}`}
                        className="px-5 py-2 rounded-full text-sm font-bold text-stone-700 hover:bg-white/60 hover:text-emerald-900 transition-all"
                     >
                        {item}
                     </Link>
                  ))}
               </nav>

               {/* Auth/Menu */}
               <div className="flex items-center gap-3 pr-2">
                  {user ? (
                    <Link to={getDashboardRoute()} className="hidden md:flex items-center gap-2 bg-emerald-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-800 transition-all shadow-lg hover:shadow-emerald-900/20">
                       Dashboard <LayoutDashboard size={16} />
                    </Link>
                  ) : (
                    <Link to="/login" className="hidden md:flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-stone-800 transition-all shadow-lg">
                       Login <ArrowRight size={16} />
                    </Link>
                  )}
                  
                  <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-gray-800 border border-white/50">
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
                 {["Home", "Features", "Practitioners"].map(item => (
                    <Link key={item} to={`/#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="text-2xl font-bold text-stone-800 serif border-b border-stone-200 pb-2">
                       {item}
                    </Link>
                 ))}
                 {user ? (
                    <Link to={getDashboardRoute()} className="mt-8 w-full py-4 bg-emerald-900 text-white rounded-xl font-bold text-lg shadow-xl">
                       Go to Dashboard
                    </Link>
                 ) : (
                    <Link to="/login" className="mt-8 w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-lg shadow-xl">
                       Login / Sign Up
                    </Link>
                 )}
                 <button onClick={() => setMobileMenu(false)} className="absolute top-8 right-8 p-2 bg-stone-200 rounded-full"><X/></button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-6 py-20 lg:py-32 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-16 mt-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm"
          >
            <Leaf size={12} /> Healing Menu
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight serif mb-4">
            Ayurvedic Therapies
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Ancient wisdom curated for modern wellness. Explore our Panchakarma treatments designed to detoxify, rejuvenate, and restore balance.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-emerald-700 mb-4" size={40} />
            <p className="text-stone-500 font-serif">Consulting the archives...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 bg-red-50 px-6 py-3 rounded-xl inline-block border border-red-100 font-medium">{error}</p>
          </div>
        )}

        {/* Content Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {therapies.map((therapy, i) => (
              <GlassCard 
                key={therapy._id} 
                onClick={() => navigate(`/book/${therapy._id}`)}
                className="flex flex-col h-full group"
              >
                {/* Image Placeholder / Banner */}
                <div className="h-48 -mx-6 -mt-6 mb-6 bg-stone-200 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-stone-50 group-hover:scale-105 transition-transform duration-700"></div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <Leaf size={64} className="text-emerald-900"/>
                   </div>
                   <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-600 shadow-sm">
                      {therapy.code || "AYUR"}
                   </div>
                </div>

                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-2xl font-bold text-gray-900 serif group-hover:text-emerald-800 transition-colors">
                    {therapy.name}
                  </h2>
                </div>

                <p className="text-stone-600 text-sm mb-6 flex-grow leading-relaxed line-clamp-3">
                  {therapy.description || "A holistic treatment designed to restore balance to your body and mind."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-stone-200/50 mt-auto">
                  <div className="flex items-center gap-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1"><Clock size={14} className="text-amber-600"/> {therapy.duration} Min</span>
                    <span className="flex items-center gap-1"><IndianRupee size={14} className="text-emerald-700"/> {therapy.price}</span>
                  </div>
                  
                  <button className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-emerald-900 group-hover:text-white transition-all shadow-sm">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Therapies;