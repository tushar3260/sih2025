import React, { useState, useEffect } from 'react';
import { 
  Home, Users, Heart, BarChart3, LogOut, 
  Calendar, Clock, Star, Play, CheckCircle, 
  User, Mail, Plus, Activity, Leaf, Search, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import axios from 'axios';

// --- 1. Global Styles & Theme (Matches Landing Page) ---
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
    
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #a8a29e; }
  `}</style>
);

// --- 2. UI Components (Glassmorphism) ---

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

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
    <div>
      <h2 className="text-3xl font-bold text-emerald-950 serif tracking-tight">{title}</h2>
      {subtitle && <p className="text-stone-500 font-medium mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// --- 3. Main Dashboard Component ---

const AyurvedaDoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [therapiesList, setTherapiesList] = useState([]);
  const [loadingTherapies, setLoadingTherapies] = useState(true);
  
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // User Data
  const userData = JSON.parse(localStorage.getItem("user"));
  const practitionerData = JSON.parse(localStorage.getItem("practioner"));
  
  const pracId = userData?.id;
  const practitionerName = userData?.name || "Vaidya";
  const practitionerSpecialty = practitionerData?.specialty?.[0] || "Ayurveda Specialist";

  // Sidebar Items
  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Overview' },
    { id: 'patients', icon: Users, label: 'My Patients' },
    { id: 'therapies', icon: Heart, label: 'Therapies' },
    { id: 'reports', icon: BarChart3, label: 'Analytics' },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("practioner");
    window.location.href = "/";
  };

  // Socket & Initial Data
  useEffect(() => {
    if (pracId) {
      fetchPatients();
      fetchTherapies();
    }
    const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", { transports: ["websocket"] });
    socket.on("connect", () => socket.emit("joinAsDoctor", pracId));
    socket.on("newAppointment", (data) => setNotifications((prev) => [...prev, data.message]));
    return () => socket.disconnect();
  }, [pracId]);

  // Data Fetching
  const fetchPatients = async () => {
    if (!pracId) return;
    try {
      setLoadingPatients(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/appointments/68b27b0f2a074e28c056694b`);
      
      const uniquePatients = [];
      const patientIds = new Set();
      response.data.forEach(appointment => {
        if (appointment && !patientIds.has(appointment._id || appointment.id)) {
          patientIds.add(appointment._id || appointment.id);
          uniquePatients.push({
            id: appointment._id || appointment.id,
            name: appointment.name || 'Guest Patient',
            email: appointment.email || 'No email'
          });
        }
      });
      setPatients(uniquePatients);
    } catch (err) {
      setPatientsError("Unable to fetch records.");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchTherapies = async () => {
    if (!pracId) return;
    try {
      setLoadingTherapies(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/therapies/practitioner/${pracId}`);
      const data = await res.json();
      setTherapiesList(data);
    } catch (err) {
      setTherapiesList([]);
    } finally {
      setLoadingTherapies(false);
    }
  };

  const refreshDashboardData = async () => {
    setLoadingPatients(true);
    setLoadingTherapies(true);
    await Promise.all([fetchPatients(), fetchTherapies()]);
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-emerald-900 text-white p-8 md:p-12 shadow-2xl shadow-emerald-900/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -mr-16 -mt-16 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-2 text-emerald-300 font-bold tracking-widest text-xs uppercase mb-2">
                    <Activity size={14} /> Clinical Overview
                </div>
                <h1 className="text-3xl md:text-5xl font-bold serif mb-2">Namaste, Dr. {practitionerName}</h1>
                <p className="text-emerald-100/80 font-medium max-w-xl">
                    You have <span className="text-white font-bold border-b border-amber-500">3 appointments</span> today. 
                    Your clinic performance is up by 12% this week.
                </p>
            </div>
            <button 
                onClick={refreshDashboardData}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-full flex items-center gap-2 transition-all"
            >
                <Activity size={18} className={loadingPatients ? "animate-spin" : ""} /> Sync Data
            </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard delay={0.1} className="p-6 hover:border-emerald-500/30 transition-colors group">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-stone-100 rounded-xl text-stone-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                    <Users size={24} />
                </div>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">+4 this week</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 serif mb-1">
                {loadingPatients ? "..." : patients.length}
            </h3>
            <p className="text-stone-500 font-medium text-sm">Total Patients</p>
        </GlassCard>

        <GlassCard delay={0.2} className="p-6 hover:border-amber-500/30 transition-colors group">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-stone-100 rounded-xl text-stone-600 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
                    <Heart size={24} />
                </div>
                <span className="text-xs font-bold bg-stone-200 text-stone-600 px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 serif mb-1">
                {loadingTherapies ? "..." : therapiesList.length}
            </h3>
            <p className="text-stone-500 font-medium text-sm">Therapies Listed</p>
        </GlassCard>

        <GlassCard delay={0.3} className="p-6 hover:border-blue-500/30 transition-colors group">
             <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-stone-100 rounded-xl text-stone-600 group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors">
                    <Star size={24} />
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Top Rated</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 serif mb-1">4.9</h3>
            <p className="text-stone-500 font-medium text-sm">Patient Satisfaction</p>
        </GlassCard>
      </div>

      {/* Schedule & Sessions */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <GlassCard delay={0.4} className="lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-stone-100 bg-white/40 flex justify-between items-center">
                <h3 className="text-lg font-bold serif text-stone-800">Today's Schedule</h3>
                <Calendar size={18} className="text-stone-400"/>
            </div>
            <div className="p-6 space-y-4">
                 {[
                    { id: 1, name: 'Tushar Arya', therapy: 'Abhyanga', time: '10:00 AM', status: 'scheduled' },
                    { id: 2, name: 'Singh', therapy: 'Shirodhara', time: '11:30 AM', status: 'active' },
                    { id: 3, name: 'Shiva', therapy: 'Swedana', time: '02:00 PM', status: 'done' },
                 ].map((apt, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 border border-transparent hover:border-stone-200 transition-all group cursor-pointer">
                        <div className={`w-2 h-12 rounded-full ${apt.status === 'active' ? 'bg-amber-500' : apt.status === 'done' ? 'bg-emerald-500' : 'bg-stone-300'}`}></div>
                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold">
                            {apt.name[0]}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">{apt.name}</h4>
                            <p className="text-xs text-stone-500 uppercase tracking-wide">{apt.therapy}</p>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center gap-1 text-sm font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
                                <Clock size={14} className="text-amber-600"/> {apt.time}
                             </div>
                        </div>
                     </div>
                 ))}
            </div>
        </GlassCard>

        {/* Quick Actions / AI Insight */}
        <div className="space-y-6">
            <GlassCard delay={0.5} className="p-6 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-none">
                <div className="flex items-center gap-2 mb-4 text-emerald-300">
                    <Activity size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">AI Insight</span>
                </div>
                <p className="text-lg font-medium serif leading-relaxed mb-4">
                    "Patient retention is highest for Swedana therapy this month."
                </p>
                <button className="text-sm font-bold text-white border-b border-emerald-500 pb-0.5 hover:text-emerald-300 transition-colors">
                    View Analytics &rarr;
                </button>
            </GlassCard>

            <GlassCard delay={0.6} className="p-6">
                <h4 className="font-bold text-stone-800 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 text-stone-600 hover:text-emerald-800 transition-all text-sm font-bold">
                        <div className="p-2 bg-emerald-100 rounded-md text-emerald-700"><Plus size={16}/></div>
                        Add New Patient
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 text-stone-600 hover:text-emerald-800 transition-all text-sm font-bold">
                        <div className="p-2 bg-amber-100 rounded-md text-amber-700"><Calendar size={16}/></div>
                        Block Calendar
                    </button>
                </div>
            </GlassCard>
        </div>
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="max-w-6xl mx-auto">
      <SectionHeader 
        title="My Patients" 
        subtitle="Manage records and treatment history" 
        action={
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-emerald-600 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search patients..." 
                    className="pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64 shadow-sm"
                />
            </div>
        }
      />

      {loadingPatients ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
             <div className="animate-spin mb-4"><Activity /></div>
             <p>Consulting the archives...</p>
        </div>
      ) : patientsError ? (
        <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-100 flex items-center gap-3">
             <Activity /> {patientsError}
        </div>
      ) : patients.length === 0 ? (
        <GlassCard className="py-20 text-center">
            <User className="mx-auto h-16 w-16 text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-700">No Patients Found</h3>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient, index) => (
            <GlassCard key={patient.id} delay={index * 0.05} className="p-6 group hover:border-emerald-500/50 transition-all cursor-pointer">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-100 to-stone-100 flex items-center justify-center text-emerald-800 font-bold text-lg shadow-inner">
                  {patient.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{patient.name}</h3>
                  <p className="text-xs text-stone-500 font-medium">{patient.id.slice(-6)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 p-3 rounded-lg">
                <Mail size={14} className="text-amber-600" />
                <span className="truncate">{patient.email}</span>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg">
                    <ArrowRight size={14} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );

  const renderTherapies = () => (
    <div className="max-w-6xl mx-auto">
       <SectionHeader 
        title="Therapy Menu" 
        subtitle="Manage treatments and pricing" 
        action={
            <button 
                onClick={() => window.location.href = "/Add-therapy"}
                className="bg-emerald-900 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-emerald-800 transition-all hover:scale-105"
            >
                <Plus size={18} /> Add New Therapy
            </button>
        }
      />

      {loadingTherapies ? (
         <div className="text-center py-20 text-stone-400">Loading therapies...</div>
      ) : !therapiesList || therapiesList.length === 0 ? (
        <GlassCard className="py-20 text-center">
            <Heart className="mx-auto h-16 w-16 text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-700">No Therapies Listed</h3>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {therapiesList.map((therapy, i) => (
            <GlassCard key={therapy._id} delay={i * 0.05} className="flex flex-col h-full hover:shadow-xl hover:border-amber-500/30 transition-all">
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-emerald-200">
                            {therapy.code || "AYUR"}
                        </span>
                        <span className="font-serif font-bold text-xl text-stone-800">${therapy.price}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 serif mb-2">{therapy.name}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed mb-4 line-clamp-3">{therapy.description}</p>
                </div>
                <div className="p-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between text-sm font-medium text-stone-600">
                    <div className="flex items-center gap-1"><Clock size={14} className="text-amber-600"/> {therapy.duration} mins</div>
                    <div className="flex items-center gap-1"><Users size={14}/> {therapy.patients || 0} active</div>
                </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );

  // --- MAIN LAYOUT ---
  return (
    <div className="relative min-h-screen bg-[#F5F5F4] text-gray-900 selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
      <GlobalStyles />
      
      {/* Background Texture (Subtle) */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply" 
           style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}>
      </div>

      <div className="flex h-screen relative z-10">
        
        {/* --- SIDEBAR (Floating Glass) --- */}
        <aside className="w-20 lg:w-72 hidden md:flex flex-col py-8 px-4 lg:px-6 h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12 pl-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-900 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
                    <Leaf size={20} fill="currentColor" />
                </div>
                <span className="text-2xl font-bold tracking-tight serif hidden lg:block text-stone-900">
                    Ayur<span className="text-emerald-700">Sutra</span>
                </span>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 space-y-2">
                {sidebarItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                            activeTab === item.id 
                            ? 'bg-white shadow-md text-emerald-900' 
                            : 'text-stone-500 hover:bg-white/50 hover:text-stone-800'
                        }`}
                    >
                        {activeTab === item.id && (
                            <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-l-xl" />
                        )}
                        <item.icon size={22} className={activeTab === item.id ? "text-emerald-600" : "group-hover:scale-110 transition-transform"} />
                        <span className="font-bold text-sm hidden lg:block">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Profile / Logout */}
            <div className="mt-auto pt-6 border-t border-stone-200/60">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:text-red-600 transition-colors">
                    <LogOut size={20} />
                    <span className="font-bold text-sm hidden lg:block">Sign Out</span>
                </button>
            </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
            {/* Top Bar (Mobile Toggle + Breadcrumbs) */}
            <div className="sticky top-0 z-20 bg-[#F5F5F4]/80 backdrop-blur-md px-8 py-6 flex justify-between items-center md:hidden">
                <div className="flex items-center gap-2">
                    <Leaf className="text-emerald-800"/>
                    <span className="font-bold serif text-lg">AyurSutra</span>
                </div>
                {/* Mobile Menu Toggle would go here */}
            </div>

            <div className="p-6 lg:p-10 pb-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'patients' ? renderPatients() :
                         activeTab === 'therapies' ? renderTherapies() :
                         activeTab === 'reports' ? (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-stone-400">
                                <BarChart3 size={48} className="mb-4 opacity-50"/>
                                <h3 className="text-xl serif font-bold text-stone-600">Analytics Module</h3>
                                <p>Coming in the next update.</p>
                            </div>
                         ) : renderDashboard()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>

      </div>
    </div>
  );
};

export default AyurvedaDoctorDashboard;