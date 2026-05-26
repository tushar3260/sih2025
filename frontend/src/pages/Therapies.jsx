import React, { useEffect, useState, useMemo } from "react";
import {
  Clock, IndianRupee, Leaf, ArrowRight, Loader2,
  Sparkles, Menu, X, LogOut, LayoutDashboard,
  Search, Star, User, Filter, Tag
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    :root { --color-bg: #F5F5F4; }
    body { font-family: 'Manrope', sans-serif; background-color: var(--color-bg); color: #1C1917; }
    .serif { font-family: 'Playfair Display', serif; }
    @keyframes fa{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-40px)}}
    @keyframes fb{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,30px)}}
    .oa{animation:fa 22s ease-in-out infinite}
    .ob{animation:fb 28s ease-in-out infinite}
  `}</style>
);

const CATEGORIES = ["All", "Panchakarma", "Massage", "Shirodhara", "Yoga", "Herbal", "Diet", "Other"];

const CATEGORY_COLORS = {
  Panchakarma: "bg-emerald-100 text-emerald-800",
  Massage:     "bg-blue-100 text-blue-800",
  Shirodhara:  "bg-purple-100 text-purple-800",
  Yoga:        "bg-amber-100 text-amber-800",
  Herbal:      "bg-green-100 text-green-800",
  Diet:        "bg-orange-100 text-orange-800",
  Other:       "bg-stone-100 text-stone-600",
};

const CATEGORY_EMOJIS = {
  Panchakarma: "🌿", Massage: "💆", Shirodhara: "🫧",
  Yoga: "🧘", Herbal: "🌱", Diet: "🥗", Other: "✨"
};

// ── Therapy Card ──────────────────────────────────────────────
const TherapyCard = ({ therapy, onBook, index }) => {
  const [showDetails, setShowDetails] = useState(false);
  const catClass = CATEGORY_COLORS[therapy.category] || CATEGORY_COLORS.Other;
  const catEmoji = CATEGORY_EMOJIS[therapy.category] || "✨";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/65 backdrop-blur-[10px] border border-white/75 rounded-2xl overflow-hidden flex flex-col group hover:shadow-xl hover:border-emerald-200/50 transition-all duration-300"
    >
      {/* Banner */}
      <div className="h-44 relative overflow-hidden bg-gradient-to-tr from-emerald-50 to-stone-100 flex items-center justify-center">
        <span className="text-7xl opacity-20 group-hover:scale-110 transition-transform duration-500 select-none">{catEmoji}</span>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${catClass}`}>
            {therapy.category || "Other"}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-stone-600 border border-white/60">
          {therapy.code || "—"}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold serif text-stone-900 group-hover:text-emerald-800 transition-colors leading-tight">
            {therapy.name}
          </h3>
          <span className="text-emerald-800 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 shrink-0 ml-2">
            ₹{therapy.price?.toLocaleString()}
          </span>
        </div>

        {/* Doctor */}
        {therapy.practitioner?.name && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-3">
            <User size={11} className="text-emerald-600" />
            Dr. {therapy.practitioner.name}
          </div>
        )}

        <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
          {therapy.description || "A holistic Ayurvedic therapy."}
        </p>

        {/* Benefits preview */}
        {therapy.benefits?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {therapy.benefits.slice(0, 3).map(b => (
              <span key={b} className="text-[10px] px-2 py-1 bg-stone-100 text-stone-600 rounded-full font-medium border border-stone-200">{b}</span>
            ))}
            {therapy.benefits.length > 3 && (
              <span className="text-[10px] px-2 py-1 bg-stone-100 text-stone-400 rounded-full font-medium">+{therapy.benefits.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-auto">
          <span className="flex items-center gap-1 text-xs font-bold text-stone-500">
            <Clock size={13} className="text-amber-600" /> {therapy.duration} min
          </span>
          <button onClick={() => onBook(therapy._id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 hover:scale-105 transition-all shadow-md">
            Book Now <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────
const Therapies = () => {
  const [therapies,   setTherapies]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [activecat,   setActiveCat]   = useState("All");
  const [isScrolled,  setIsScrolled]  = useState(false);
  const [mobileMenu,  setMobileMenu]  = useState(false);
  const [user,        setUser]        = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (u) setUser(u);

    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);

    axios.get(`${API}/therapies`)
      .then(r => setTherapies(r.data))
      .catch(() => setError("Failed to fetch therapies."))
      .finally(() => setLoading(false));

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = useMemo(() => {
    return therapies.filter(t => {
      const matchCat  = activecat === "All" || t.category === activecat;
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [therapies, activecat, search]);

  const getDashboardRoute = () =>
    user?.role === "practitioner" ? "/doctor-dashboard" : "/dashboard";

  return (
    <div className="min-h-screen bg-[#F5F5F4] relative selection:bg-emerald-200 overflow-x-hidden">
      <GlobalStyles />

      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="oa absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="ob absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-amber-100/15 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="fixed top-6 left-0 right-0 z-50 px-4">
        <div className={`max-w-6xl mx-auto rounded-full transition-all duration-300 ${isScrolled ? "bg-white/85 backdrop-blur-xl shadow-md border border-white/40 py-3 px-6" : "bg-white/40 py-4 px-6 backdrop-blur-md border border-white/20"}`}>
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                <Leaf size={17} fill="currentColor" />
              </div>
              <span className="text-lg font-bold serif text-stone-900">Ayur<span className="text-emerald-800">Sutra</span></span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 bg-stone-100/50 p-1.5 rounded-full backdrop-blur-md border border-white/30">
              {["Home", "Features", "Practitioners"].map(item => (
                <Link key={item} to={`/#${item.toLowerCase()}`}
                  className="px-5 py-2 rounded-full text-sm font-bold text-stone-700 hover:bg-white/60 hover:text-emerald-900 transition-all">{item}</Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <Link to={getDashboardRoute()}
                  className="hidden md:flex items-center gap-2 bg-emerald-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-800 transition-all shadow-lg">
                  Dashboard <LayoutDashboard size={15} />
                </Link>
              ) : (
                <Link to="/login"
                  className="hidden md:flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-stone-800 transition-all shadow-lg">
                  Login <ArrowRight size={15} />
                </Link>
              )}
              <button onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-stone-800">
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#F5F5F4] pt-32 px-8 md:hidden">
            <button onClick={() => setMobileMenu(false)} className="absolute top-8 right-8 p-2 bg-stone-200 rounded-full"><X /></button>
            {["Home", "Features", "Practitioners"].map(item => (
              <Link key={item} to={`/#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                className="block text-2xl font-bold text-stone-800 serif border-b border-stone-200 py-4">{item}</Link>
            ))}
            <Link to={user ? getDashboardRoute() : "/login"}
              className="block mt-8 text-center py-4 bg-emerald-900 text-white rounded-xl font-bold text-lg">
              {user ? "Dashboard" : "Login / Sign Up"}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-36 pb-20">

        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-widest mb-4">
            <Leaf size={12} /> Healing Menu
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-bold serif text-stone-900 mb-4">
            Ayurvedic Therapies
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-stone-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Ancient wisdom for modern wellness. Choose from {therapies.length} curated treatments.
          </motion.p>
        </div>

        {/* Search + Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-8 space-y-4">

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search therapies..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all" />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                  activecat === cat
                    ? "bg-emerald-900 text-white border-emerald-900 shadow-md"
                    : "bg-white/70 text-stone-600 border-stone-200 hover:border-emerald-300 hover:bg-white"
                }`}>
                {cat === "All" ? `All (${therapies.length})` : `${CATEGORY_EMOJIS[cat]} ${cat}`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        {!loading && (
          <p className="text-center text-sm text-stone-400 font-medium mb-8">
            {filtered.length === 0 ? "No therapies found" : `Showing ${filtered.length} ${activecat !== "All" ? activecat : ""} therapies`}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-700 mb-4" size={40} />
            <p className="text-stone-500 font-medium">Consulting the archives...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-500 bg-red-50 px-6 py-3 rounded-xl inline-block border border-red-100 font-medium">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/60 backdrop-blur rounded-2xl border border-white/80 shadow">
            <Sparkles size={48} className="mx-auto mb-4 text-stone-300" />
            <h3 className="text-xl font-bold serif text-stone-600 mb-2">No therapies found</h3>
            <p className="text-stone-400 mb-6">Try a different category or search term</p>
            <button onClick={() => { setSearch(""); setActiveCat("All"); }}
              className="px-6 py-3 bg-emerald-900 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all">
              Show All
            </button>
          </motion.div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((therapy, i) => (
              <TherapyCard key={therapy._id} therapy={therapy} index={i}
                onBook={id => navigate(`/book/${id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Therapies;