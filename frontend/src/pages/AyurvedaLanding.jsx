// src/pages/AyurvedaLanding.jsx — Premium Responsive Redesign
import React, { useEffect, useState, memo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, CalendarCheck2, ArrowRight, Star,
  Menu, X, Sparkles, UserCheck, ArrowUpRight,
  Stethoscope, Activity, ScrollText, ShieldCheck, HeartPulse,
  Clock, MapPin, Phone, Mail, Instagram, Linkedin, Twitter,
  CheckCircle2, Zap, Brain, Users
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ── Animated Background ───────────────────────────────────────
const AnimatedBg = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="orb-a absolute -top-40 right-0 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full bg-emerald-200/25 blur-3xl" />
    <div className="orb-b absolute -bottom-60 -left-40 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full bg-amber-200/20 blur-3xl" />
    <div className="orb-c absolute top-1/3 right-1/4 w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full bg-teal-100/20 blur-3xl" />
  </div>
);

// ── Feature Card ──────────────────────────────────────────────
const FeatureCard = memo(({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.35, delay, ease: "easeOut" }}
    className={`gpu bg-white/70 backdrop-blur-[10px] border border-white/80 rounded-2xl card-hover ${className}`}
  >
    {children}
  </motion.div>
));

// ── Practitioner Card ─────────────────────────────────────────
const PractitionerCard = memo(({ practitioner }) => {
  const name        = practitioner.user?.name || "Dr. Ayurveda";
  const specialties = practitioner.specialty || ["General Care"];
  const experience  = practitioner.experience || "5";
  const availability = practitioner.availability || [];

  return (
    <FeatureCard className="flex flex-col overflow-hidden group">
      <div className="p-5 sm:p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-100 to-stone-100 border-2 border-emerald-100 flex items-center justify-center text-emerald-800 shadow-inner">
            <Stethoscope size={22} />
          </div>
          <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200">
            <ShieldCheck size={10} /> Verified
          </div>
        </div>
        <h3 className="text-lg sm:text-xl font-bold serif text-stone-900 mb-2">{name}</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {specialties.slice(0, 2).map((s, i) => (
            <span key={i} className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">{s}</span>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-stone-600 font-medium">
          <span className="flex items-center gap-1"><Clock size={12} className="text-amber-600" /> {experience} Yrs</span>
          <span className="flex items-center gap-1"><UserCheck size={12} className="text-amber-600" /> 98%</span>
        </div>
      </div>
      <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
          <span className={`w-2 h-2 rounded-full ${availability.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
          {availability.length > 0 ? "Available" : "Fully Booked"}
        </div>
        <button className="w-8 h-8 bg-stone-900 group-hover:bg-emerald-700 text-white rounded-full flex items-center justify-center transition-colors shadow-md" aria-label="Book">
          <ArrowRight size={14} />
        </button>
      </div>
    </FeatureCard>
  );
});

// ── Section Title ─────────────────────────────────────────────
const SectionTitle = memo(({ title, sub, center = true }) => (
  <div className={`mb-10 sm:mb-14 ${center ? "text-center" : "text-left"}`}>
    <motion.div
      initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4 ${center ? "mx-auto" : ""}`}
    >
      <Sparkles size={10} fill="currentColor" /> {sub}
    </motion.div>
    <motion.h2
      initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.08 }}
      className="text-3xl sm:text-4xl md:text-5xl font-bold serif text-emerald-950 tracking-tight"
    >
      {title}
    </motion.h2>
    {center && <div className="h-1.5 w-16 sm:w-20 bg-gradient-to-r from-emerald-600 to-amber-500 mt-4 sm:mt-5 rounded-full mx-auto" />}
  </div>
));

// ── Stat Badge ────────────────────────────────────────────────
const StatPill = ({ val, label }) => (
  <div className="text-center">
    <div className="text-xl sm:text-2xl font-bold serif text-stone-900">{val}</div>
    <div className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wide">{label}</div>
  </div>
);

// ── Main Landing ──────────────────────────────────────────────
const AyurvedaLanding = () => {
  const [user,          setUser]          = useState(null);
  const [isScrolled,    setIsScrolled]    = useState(false);
  const [mobileMenu,    setMobileMenu]    = useState(false);
  const [practitioners, setPractitioners] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user"))); } catch {}
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await Promise.race([
          axios.get(`${API_BASE_URL}/practitioners`),
          new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 6000)),
        ]);
        setPractitioners(res.data || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const dashRoute = () => {
    if (user?.role === "practitioner" || user?.role === "doctor") return "/doctor-dashboard";
    if (user?._id || user?.id) return "/dashboard";
    return "/login";
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Doctors", href: "#practitioners" },
    { label: "Therapies", href: "/therapies" },
    { label: "AI", href: "/ai-consultant" },
  ];

  return (
    <div className="relative min-h-screen bg-[#F5F5F4] text-stone-900 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
      `}</style>
      <AnimatedBg />

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 pt-3 sm:pt-4" role="banner">
        <div className={`max-w-6xl mx-auto rounded-xl sm:rounded-2xl transition-all duration-300 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between
          ${isScrolled ? "bg-white/90 backdrop-blur-md shadow-lg border border-white/60" : "bg-white/50 backdrop-blur-sm border border-white/30"}`}>

          <Link to="/" className="flex items-center gap-2 gpu" aria-label="AyurSutra Home">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-900 flex items-center justify-center text-white shadow-md shrink-0">
              <Leaf size={15} fill="currentColor" />
            </div>
            <span className="text-base sm:text-lg font-bold serif text-stone-900">
              Ayur<span className="text-emerald-700">Sutra</span>
            </span>
          </Link>

          <nav className="hidden md:flex gap-1 bg-stone-100/60 rounded-xl p-1 border border-white/40" role="navigation">
            {navLinks.map(({ label, href }) => (
              <a key={label} href={href}
                className="px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-bold text-stone-600 hover:bg-white hover:text-emerald-800 hover:shadow-sm transition-all duration-200">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to={dashRoute()}
              className="hidden sm:flex items-center gap-1.5 px-4 lg:px-5 py-2 sm:py-2.5 bg-stone-900 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-800 transition-colors shadow-md gpu">
              {user ? "Dashboard" : "Get Started"} <ArrowRight size={14} />
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"
              className="md:hidden p-2 rounded-xl bg-white/80 text-stone-800 shadow-sm border border-white/60">
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-3 top-20 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-100 p-4 md:hidden"
          >
            <nav className="space-y-1">
              {navLinks.map(({ label, href }) => (
                <a key={label} href={href} onClick={() => setMobileMenu(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-sm">
                  {label} <ArrowRight size={14} className="text-stone-300" />
                </a>
              ))}
            </nav>
            <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
              <Link to="/login" onClick={() => setMobileMenu(false)}
                className="flex-1 text-center py-3 border border-stone-200 rounded-xl font-bold text-stone-700 text-sm hover:bg-stone-50 transition-colors">
                Sign In
              </Link>
              <Link to={dashRoute()} onClick={() => setMobileMenu(false)}
                className="flex-1 text-center py-3 bg-emerald-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors">
                {user ? "Dashboard" : "Get Started"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section id="home" className="relative z-10 pt-28 sm:pt-36 pb-16 sm:pb-24 lg:pt-44 lg:pb-36" aria-label="Hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 mb-5 sm:mb-7 shadow-sm">
              <HeartPulse size={13} className="text-emerald-600" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Trusted by 500+ Vaidyas</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold serif text-stone-900 leading-[1.1] mb-4 sm:mb-6">
              The OS for<br />
              <span className="text-gradient">Ayurveda Clinics.</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-lg leading-relaxed font-medium mb-7 sm:mb-10">
              Simplify Panchakarma scheduling, Nadi Pariksha analysis, and patient records with our secure, AI-powered platform.
            </p>

            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
              <Link to="/login"
                className="gpu px-6 sm:px-8 py-3.5 sm:py-4 bg-stone-900 text-white rounded-full font-bold text-base sm:text-lg shadow-xl hover:bg-emerald-800 hover:scale-105 transition-all flex items-center justify-center gap-2">
                Get Started <ArrowUpRight size={18} />
              </Link>
              <Link to="/therapies"
                className="gpu px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-stone-200 text-stone-900 rounded-full font-bold text-base sm:text-lg hover:border-emerald-600 hover:text-emerald-800 transition-all flex items-center justify-center gap-2 shadow-sm">
                <Leaf size={16} fill="currentColor" className="text-emerald-700" /> View Therapies
              </Link>
            </div>

            <div className="mt-8 sm:mt-10 flex items-center gap-6 sm:gap-8 pt-6 sm:pt-8 border-t border-stone-200/60">
              <StatPill val="10k+" label="Patients" />
              <div className="w-px h-8 bg-stone-200" />
              <StatPill val="500+" label="Vaidyas" />
              <div className="w-px h-8 bg-stone-200" />
              <StatPill val="4.9★" label="Rating" />
            </div>
          </motion.div>

          {/* Hero right — floating cards */}
          <div className="relative hidden lg:block h-80">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
              className="gpu absolute right-0 top-4 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white w-72"
              style={{ rotate: "3deg" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><CalendarCheck2 size={18} /></div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Upcoming Session</h4>
                  <p className="text-xs text-stone-500">Today, 4:00 PM</p>
                </div>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-stone-700">Abhyanga Therapy</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold">Confirmed</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
              className="gpu absolute left-0 bottom-4 bg-emerald-900 text-white p-5 rounded-2xl shadow-xl w-52">
              <Star size={20} className="text-amber-400 mb-2" fill="currentColor" />
              <p className="text-2xl font-bold serif">4.9/5</p>
              <p className="text-emerald-300 text-xs font-medium mt-1">Average practitioner rating</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 0.4 }}
              className="gpu absolute right-10 bottom-12 bg-white border border-stone-100 p-3 rounded-xl shadow-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Brain size={16} className="text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-800">AI Diagnosis</p>
                <p className="text-[10px] text-stone-400">Dosha analysis ready</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="relative z-10 py-6 sm:py-8 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 sm:mb-6">Trusted by leading Ayurvedic institutions</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 md:gap-12">
            {["AIIA Delhi", "Kerala Ayurveda", "Patanjali", "Kottakkal", "Dhathri"].map(name => (
              <div key={name} className="text-sm font-bold text-stone-400 hover:text-emerald-700 transition-colors">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 py-16 sm:py-24" aria-label="Features">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionTitle title="Everything You Need" sub="For Modern Clinics" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Big scheduling card */}
            <FeatureCard className="sm:col-span-2 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center bg-stone-50 border border-stone-200" delay={0}>
              <div className="flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-900 text-white flex items-center justify-center mb-4 sm:mb-5 shadow-lg">
                  <CalendarCheck2 size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold serif text-stone-900 mb-2 sm:mb-3">Smart Scheduling Engine</h3>
                <p className="text-stone-600 leading-relaxed font-medium text-sm sm:text-base">
                  Auto-handles room allocation, therapist shifts, and rest periods. No more double bookings or missed slots.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {["Real-time slot availability", "Conflict detection", "Auto-notifications"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 font-medium">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full sm:w-40 bg-white rounded-xl shadow border border-stone-200 p-3 sm:p-4 space-y-2 shrink-0">
                {[{ dot: "bg-emerald-500", active: true }, { dot: "bg-amber-400", active: false }, { dot: "bg-stone-300", active: false }].map((s, i) => (
                  <div key={i} className={`flex items-center p-2 rounded-lg border ${s.active ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"}`}>
                    <div className={`w-2 h-2 rounded-full mr-3 ${s.dot}`} />
                    <div className="space-y-1"><div className="h-2 w-14 bg-gray-200 rounded" /><div className="h-1.5 w-8 bg-gray-100 rounded" /></div>
                  </div>
                ))}
              </div>
            </FeatureCard>

            {/* AI card */}
            <FeatureCard className="p-6 sm:p-8 bg-emerald-900 text-white border-emerald-800" delay={0.05}>
              <Activity className="text-amber-400 mb-4 sm:mb-5" size={28} />
              <h3 className="text-xl sm:text-2xl font-bold serif text-white mb-2">Prakriti AI</h3>
              <p className="text-emerald-200 text-xs sm:text-sm leading-relaxed mb-5 sm:mb-6">Advanced Dosha analysis based on Nadi Pariksha inputs and lifestyle data.</p>
              <div className="flex items-end gap-2 h-12 sm:h-16 mt-auto">
                {[40, 80, 60].map((h, i) => (
                  <div key={i} className={`flex-1 rounded-t-lg ${["bg-blue-400/80", "bg-red-400/80", "bg-yellow-400/80"][i]}`} style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="flex gap-3 mt-3 text-[10px] font-bold">
                {["Vata", "Pitta", "Kapha"].map((d, i) => (
                  <span key={d} className={`${["text-blue-300", "text-red-300", "text-yellow-300"][i]}`}>{d}</span>
                ))}
              </div>
            </FeatureCard>

            {/* Small feature cards */}
            {[
              { icon: ScrollText, title: "Digital Granth", desc: "Instant access to classical Ayurvedic texts and formulations.", color: "text-emerald-700", bg: "bg-white border-stone-200", iconBg: "bg-emerald-50" },
              { icon: ShieldCheck, title: "HIPAA Compliant", desc: "Patient data encrypted and secure. Full audit trails.", color: "text-blue-700", bg: "bg-blue-50 border-blue-100", iconBg: "bg-blue-100" },
              { icon: Leaf, title: "Herb Inventory", desc: "Track oils, herbs and medicines with real-time low-stock alerts.", color: "text-amber-700", bg: "bg-amber-50 border-amber-100", iconBg: "bg-amber-100" },
            ].map(({ icon: Icon, title, desc, color, bg, iconBg }, i) => (
              <FeatureCard key={title} className={`p-5 sm:p-8 ${bg} border`} delay={i * 0.04}>
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3 sm:mb-4`}>
                  <Icon className={color} size={20} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold serif text-stone-900 mb-1 sm:mb-2">{title}</h3>
                <p className="text-stone-500 text-xs sm:text-sm font-medium leading-relaxed">{desc}</p>
              </FeatureCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 py-16 sm:py-24 bg-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <SectionTitle title="Simple to Get Started" sub="How It Works" />
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "01", icon: Users, title: "Create Account", desc: "Sign up as a patient or register your clinic as a Vaidya." },
              { step: "02", icon: CalendarCheck2, title: "Book a Session", desc: "Browse therapies, check real-time slots, and book instantly." },
              { step: "03", icon: Zap, title: "Start Healing", desc: "Get AI-powered insights, session tracking, and follow-up care." },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div key={step}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative inline-flex mb-5 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Icon size={26} className="text-amber-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold">{step}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold serif mb-2">{title}</h3>
                <p className="text-emerald-300 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10 sm:mt-14">
            <Link to="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-emerald-900 rounded-full font-bold text-sm sm:text-base hover:bg-amber-100 transition-colors shadow-xl gpu">
              Start for Free <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Practitioners ── */}
      <section id="practitioners" className="relative z-10 py-16 sm:py-24 bg-[#F5F5F4]" aria-label="Practitioners">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionTitle title="Expert Vaidyas" sub="Meet the Team" />
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-52 sm:h-64 skeleton rounded-2xl" />)}
            </div>
          ) : practitioners.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {practitioners.map((p, i) => <PractitionerCard key={p._id || i} practitioner={p} />)}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20 text-stone-500">
              <UserCheck size={40} className="mx-auto mb-4 opacity-40" />
              <p className="font-medium text-sm">No practitioners listed yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl -ml-16 -mb-16" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 rounded-full text-amber-300 text-xs font-bold mb-5">
              <Sparkles size={11} /> Start Free Today
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold serif mb-3 sm:mb-4">Ready to Transform Your Clinic?</h2>
            <p className="text-emerald-200 text-sm sm:text-base max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed">
              Join hundreds of Ayurvedic practitioners who have digitized their clinics with AyurSutra.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-emerald-900 rounded-full font-bold text-sm sm:text-base hover:bg-amber-100 transition-colors shadow-xl gpu">
                Create Free Account
              </Link>
              <Link to="/therapies"
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/30 text-white rounded-full font-bold text-sm sm:text-base hover:bg-white/10 transition-colors">
                Browse Therapies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 bg-stone-900 text-stone-400 pt-12 sm:pt-16 pb-6 sm:pb-8" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 border-b border-stone-800 pb-10 sm:pb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-400">
                <Leaf size={14} fill="currentColor" />
              </div>
              <span className="text-base font-bold serif text-stone-100">AyurSutra</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">Digitizing the ancient science of life. Designed for Vaidyas.</p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-emerald-800 hover:text-white transition-all" aria-label="Social">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: "Platform", items: ["Clinic Management", "Patient Records", "Telemedicine", "Pharmacy"] },
            { title: "Support",  items: ["Help Center", "API Docs", "System Status", "Contact Us"] },
          ].map(({ title, items }) => (
            <div key={title}>
              <h4 className="font-bold text-stone-100 mb-4 text-xs uppercase tracking-widest">{title}</h4>
              <ul className="space-y-2.5 text-sm">
                {items.map(item => <li key={item}><a href="#" className="hover:text-emerald-500 transition-colors text-sm">{item}</a></li>)}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-bold text-stone-100 mb-4 text-xs uppercase tracking-widest">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm"><MapPin size={13} className="text-emerald-600 shrink-0" /> New Delhi, India</li>
              <li className="flex items-center gap-2 text-sm"><Phone size={13} className="text-emerald-600 shrink-0" /> +91 98765 43210</li>
              <li className="flex items-center gap-2 text-sm"><Mail size={13} className="text-emerald-600 shrink-0" /> hello@ayursutra.com</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <p>© {new Date().getFullYear()} AyurSutra Technologies Pvt Ltd.</p>
          <div className="flex gap-4 sm:gap-5">
            <a href="#" className="hover:text-stone-200 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-200 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AyurvedaLanding;