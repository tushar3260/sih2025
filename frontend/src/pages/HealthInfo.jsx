import React, { useState, useEffect, useReducer, useMemo, useCallback, memo } from 'react';
// recharts removed — using pure SVG charts
import { 
  Heart, Activity, Brain, Moon, Thermometer, TrendingUp, Award, 
  AlertTriangle, Settings, Download, Zap, Target, Shield, CheckCircle2, 
  Leaf, Droplets, ArrowRight, LayoutDashboard, PlusCircle,Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. Global Styles & Theme ---
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

    /* Custom Range Slider Styling */
    input[type=range] {
      height: 6px;
      border-radius: 5px;
      background: #e5e7eb;
      outline: none;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #059669;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
  `}</style>
);

// --- 2. Reusable UI Components ---
const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay, ease: "easeOut" }}
    className={`bg-white/65 backdrop-blur-[10px] border border-white/75 shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl ${className}`}
  >
    {children}
  </motion.div>
);

// --- 3. Logic & Reducers (Kept from your original code) ---
const healthReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_HEALTH_ENTRY':
      const newEntry = {
        ...action.payload,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        aiScore: calculateHealthScore(action.payload, state.entries)
      };
      const updatedEntries = [...state.entries, newEntry].slice(-90);
      return {
        ...state,
        entries: updatedEntries,
        currentScore: newEntry.aiScore,
        lastUpdate: new Date().toISOString(),
        streak: calculateStreak(updatedEntries)
      };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications.slice(0, 9)] };
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    default:
      return state;
  }
};

const calculateHealthScore = (data, historicalData = []) => {
  const weights = { physical: 0.25, sleep: 0.20, mental: 0.20, vitals: 0.15, lifestyle: 0.10, trend: 0.10 };
  const physicalScore = Math.max(0, 100 - (data.pain * 8));
  const sleepScore = data.sleepHours >= 7 ? 100 : Math.max(0, data.sleepHours * 14.3);
  const mentalScore = (data.mood * 20);
  const vitalScore = calculateVitalScore(data.vitals);
  const lifestyleScore = calculateLifestyleScore(data.lifestyle);
  const trendScore = calculateTrendAnalysis(historicalData);
  
  const totalScore = 
    physicalScore * weights.physical +
    sleepScore * weights.sleep +
    mentalScore * weights.mental +
    vitalScore * weights.vitals +
    lifestyleScore * weights.lifestyle +
    trendScore * weights.trend;
  
  return Math.round(Math.max(0, Math.min(100, totalScore)));
};

const calculateVitalScore = (vitals) => {
  if (!vitals) return 70;
  let score = 100;
  if (vitals.systolic > 140 || vitals.diastolic > 90) score -= 20;
  else if (vitals.systolic > 130 || vitals.diastolic > 85) score -= 10;
  if (vitals.heartRate < 60 || vitals.heartRate > 100) score -= 15;
  const tempDiff = Math.abs(vitals.temperature - 98.6);
  if (tempDiff > 2) score -= 20;
  else if (tempDiff > 1) score -= 10;
  return Math.max(0, score);
};

const calculateLifestyleScore = (lifestyle) => {
  if (!lifestyle) return 60;
  let score = 0;
  score += lifestyle.hydration >= 8 ? 25 : (lifestyle.hydration * 3);
  score += lifestyle.exercise >= 30 ? 25 : (lifestyle.exercise * 0.8);
  score += lifestyle.screenTime <= 6 ? 25 : Math.max(0, 25 - (lifestyle.screenTime - 6) * 3);
  score += lifestyle.socialInteraction >= 3 ? 25 : (lifestyle.socialInteraction * 8);
  return Math.min(100, score);
};

const calculateTrendAnalysis = (entries) => {
  if (entries.length < 7) return 70;
  const recent = entries.slice(-7);
  const older = entries.slice(-14, -7);
  if (older.length === 0) return 70;
  const recentAvg = recent.reduce((sum, entry) => sum + (entry.aiScore || 70), 0) / recent.length;
  const olderAvg = older.reduce((sum, entry) => sum + (entry.aiScore || 70), 0) / older.length;
  const improvement = recentAvg - olderAvg;
  return Math.max(0, Math.min(100, 70 + improvement * 2));
};

const calculateStreak = (entries) => {
  if (entries.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = entries.length - 1; i >= 0; i--) {
    const entryDate = new Date(entries[i].timestamp);
    const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
    if (daysDiff === streak) streak++; else break;
  }
  return streak;
};

const generateAIInsights = (userData, trends) => {
  const insights = [];
  const score = userData.currentScore || 70;
  
  if (score >= 90) {
    insights.push({ type: 'achievement', title: 'Peak Vitality', message: 'Your Ojas (vitality) levels are exceptional.', confidence: 95, priority: 'high' });
  } else if (score < 60) {
    insights.push({ type: 'alert', title: 'Dosha Imbalance', message: 'Metrics suggest a Vata-Pitta imbalance. Consult a Vaidya.', confidence: 88, priority: 'urgent' });
  }
  
  const avgSleep = trends.reduce((sum, entry) => sum + (entry.sleepHours || 7), 0) / Math.max(trends.length, 1);
  if (avgSleep < 7) {
    insights.push({ type: 'recommendation', title: 'Nidra (Sleep) Deficit', message: `Average sleep is ${avgSleep.toFixed(1)}h. Try Ashwagandha milk before bed.`, confidence: 92, priority: 'medium' });
  }
  
  return insights;
};

// --- 4. Sub-Components (Styled) ---

const NotificationBadge = memo(({ notification, onDismiss }) => {
  const getStyle = () => {
    switch (notification.priority) {
      case 'urgent': return 'bg-red-50 text-red-800 border-red-100';
      case 'high': return 'bg-amber-50 text-amber-800 border-amber-100';
      default: return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className={`p-4 rounded-xl border mb-3 flex justify-between items-start ${getStyle()}`}
    >
      <div className="flex gap-3">
        {notification.priority === 'urgent' ? <AlertTriangle size={18} /> : <Zap size={18} />}
        <div>
          <h4 className="font-bold text-sm serif">{notification.title}</h4>
          <p className="text-xs opacity-90 mt-1">{notification.message}</p>
        </div>
      </div>
      <button onClick={() => onDismiss(notification.id)} className="text-current opacity-50 hover:opacity-100">×</button>
    </motion.div>
  );
});

const HealthAssessmentForm = memo(({ onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    pain: 0, sleepHours: 7, sleepQuality: 3, mood: 3, anxiety: 1,
    vitals: { systolic: 120, diastolic: 80, heartRate: 72, temperature: 98.6 },
    lifestyle: { hydration: 8, exercise: 30, screenTime: 6, socialInteraction: 3 },
    notes: ''
  });
  
  const [activeTab, setActiveTab] = useState('physical');
  const tabs = [
    { id: 'physical', label: 'Body', icon: Heart },
    { id: 'sleep', label: 'Rest', icon: Moon },
    { id: 'mental', label: 'Mind', icon: Brain },
    { id: 'vitals', label: 'Vitals', icon: Activity },
    { id: 'lifestyle', label: 'Habits', icon: Target }
  ];
  
  const StyledSlider = ({ label, value, min, max, step=1, onChange, unit="" }) => (
    <div className="bg-white/50 p-4 rounded-xl border border-stone-100">
      <div className="flex justify-between mb-2">
        <label className="text-sm font-bold text-stone-700">{label}</label>
        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 rounded-md">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-full accent-emerald-600" />
    </div>
  );

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="bg-emerald-900 p-6 text-white">
        <h2 className="text-2xl font-bold serif flex items-center gap-2"><Leaf size={20}/> Daily Check-in</h2>
        <p className="text-emerald-200/80 text-sm">Track your Prakriti and Vikriti balance.</p>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-stone-100 rounded-xl">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="space-y-6 min-h-[300px]">
          {activeTab === 'physical' && (
            <div className="space-y-4">
              <StyledSlider label="Physical Discomfort / Pain" value={formData.pain} min="0" max="10" onChange={(e) => setFormData({...formData, pain: parseInt(e.target.value)})} unit="/ 10" />
            </div>
          )}
          {activeTab === 'sleep' && (
            <div className="space-y-4">
              <StyledSlider label="Hours Slept" value={formData.sleepHours} min="3" max="12" step="0.5" onChange={(e) => setFormData({...formData, sleepHours: parseFloat(e.target.value)})} unit="hrs" />
              <StyledSlider label="Sleep Quality" value={formData.sleepQuality} min="1" max="5" onChange={(e) => setFormData({...formData, sleepQuality: parseInt(e.target.value)})} unit="/ 5" />
            </div>
          )}
          {activeTab === 'mental' && (
            <div className="space-y-4">
              <StyledSlider label="Current Mood" value={formData.mood} min="1" max="5" onChange={(e) => setFormData({...formData, mood: parseInt(e.target.value)})} unit="/ 5" />
              <StyledSlider label="Anxiety / Stress" value={formData.anxiety} min="1" max="5" onChange={(e) => setFormData({...formData, anxiety: parseInt(e.target.value)})} unit="/ 5" />
            </div>
          )}
          {activeTab === 'vitals' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                  { l: "Systolic BP", k: "systolic" }, { l: "Diastolic BP", k: "diastolic" },
                  { l: "Heart Rate", k: "heartRate" }, { l: "Temp (°F)", k: "temperature" }
              ].map((f) => (
                  <div key={f.k} className="bg-white/50 p-3 rounded-xl border border-stone-100">
                    <label className="text-xs font-bold text-stone-500 block mb-1">{f.l}</label>
                    <input type="number" value={formData.vitals[f.k]} 
                      onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, [f.k]: parseFloat(e.target.value)}})}
                      className="w-full bg-transparent font-bold text-stone-800 focus:outline-none border-b border-stone-200 focus:border-emerald-500"
                    />
                  </div>
              ))}
            </div>
          )}
          {activeTab === 'lifestyle' && (
             <div className="space-y-4">
               <StyledSlider label="Hydration (Glasses)" value={formData.lifestyle.hydration} min="0" max="15" onChange={(e) => setFormData({...formData, lifestyle: {...formData.lifestyle, hydration: parseInt(e.target.value)}})} unit="" />
               <StyledSlider label="Yoga / Exercise (Mins)" value={formData.lifestyle.exercise} min="0" max="120" step="10" onChange={(e) => setFormData({...formData, lifestyle: {...formData.lifestyle, exercise: parseInt(e.target.value)}})} unit="min" />
             </div>
          )}
        </div>

        <button onClick={(e) => { e.preventDefault(); onSubmit(formData); }} disabled={isSubmitting}
          className="w-full mt-6 bg-emerald-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all shadow-lg hover:shadow-emerald-900/20 disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="animate-spin"/> : <Zap size={20} />}
          {isSubmitting ? "Analyzing..." : "Analyze Health Data"}
        </button>
      </div>
    </GlassCard>
  );
});

const HealthScoreGauge = memo(({ score, size = 180 }) => {
  const getScoreColor = (s) => s >= 90 ? '#059669' : s >= 70 ? '#D97706' : '#EF4444';
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
       <svg className="transform -rotate-90" width={size} height={size}>
          <circle cx={size/2} cy={size/2} r="45" stroke="#E7E5E4" strokeWidth="8" fill="transparent" />
          <circle cx={size/2} cy={size/2} r="45" stroke={getScoreColor(score)} strokeWidth="8" fill="transparent"
            strokeDasharray={strokeDasharray} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
       </svg>
       <div className="absolute inset-0 flex flex-col items-center justify-center">
         <span className="text-4xl font-bold serif text-stone-800">{score}</span>
         <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Ojas Score</span>
       </div>
    </div>
  );
});

// Pure SVG line chart — zero dependency
const TrendChart = memo(({ data, metric = 'aiScore', title, color = "#059669" }) => {
  const pts = useMemo(() => data.slice(-30).map((e, i) => e[metric] ?? 0), [data, metric]);
  if (pts.length < 2) return (
    <GlassCard className="p-6 flex items-center justify-center h-48">
      <p className="text-stone-400 text-sm font-medium">Not enough data yet</p>
    </GlassCard>
  );
  const W = 400, H = 120, pad = 10;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const coords = pts.map((v, i) => [
    pad + (i / (pts.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / range) * (H - pad * 2),
  ]);
  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length-1][0]},${H} L${coords[0][0]},${H} Z`;
  const gId = `tg-${metric}`;
  return (
    <GlassCard className="p-6">
      <h3 className="font-bold serif text-stone-700 mb-4 text-sm">{title}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => i === coords.length - 1 && (
          <circle key={i} cx={x} cy={y} r="4" fill={color} />
        ))}
      </svg>
    </GlassCard>
  );
});

// --- 5. Main Component ---
const HealthInfo = () => {
  const initialState = { entries: [], currentScore: 0, streak: 0, lastUpdate: null, notifications: [], preferences: { notificationsEnabled: true } };
  const [state, dispatch] = useReducer(healthReducer, initialState);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const aiInsights = useMemo(() => generateAIInsights(state, state.entries), [state.entries, state.currentScore]);
  
  useEffect(() => {
    aiInsights.forEach(insight => {
      if (insight.priority === 'urgent' && !state.notifications.find(n => n.title === insight.title)) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { id: Date.now() + Math.random(), ...insight, timestamp: new Date().toISOString() } });
      }
    });
  }, [aiInsights]);

  const handleHealthSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    dispatch({ type: 'ADD_HEALTH_ENTRY', payload: formData });
    setActiveView('dashboard');
    setIsSubmitting(false);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'assessment', label: 'Check-in', icon: PlusCircle },
    { id: 'insights', label: 'AI Veda', icon: Brain },
    { id: 'trends', label: 'History', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F4] relative selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyles />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-800 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Brain size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold serif text-stone-900">AyurIntelligence</h1>
                <p className="text-stone-500 font-medium">Holistic Health Monitoring</p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              {state.streak > 0 && (
                <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full border border-amber-200 font-bold text-sm">
                  <Award size={16} /> {state.streak} Day Streak
                </div>
              )}
              <button onClick={() => setShowSettings(true)} className="p-3 bg-white rounded-full shadow-sm text-stone-600 hover:text-emerald-800 hover:shadow-md transition-all">
                <Settings size={20} />
              </button>
           </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${
                activeView === item.id 
                ? 'bg-stone-900 text-white shadow-lg' 
                : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        {/* Notifications Area */}
        <AnimatePresence>
          {state.notifications.length > 0 && (
             <div className="mb-8 grid md:grid-cols-2 gap-4">
               {state.notifications.map(n => (
                 <NotificationBadge key={n.id} notification={n} onDismiss={(id) => dispatch({ type: 'DISMISS_NOTIFICATION', payload: id })} />
               ))}
             </div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main>
          {activeView === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Score */}
              <GlassCard className="flex flex-col items-center justify-center p-8 text-center h-fit">
                <h2 className="text-xl font-bold serif text-stone-800 mb-6">Current Ojas Score</h2>
                <HealthScoreGauge score={state.currentScore} />
                <p className="text-sm text-stone-400 mt-4 font-medium">
                   Last Updated: {state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : 'No Data'}
                </p>
                {state.entries.length === 0 && (
                   <button onClick={() => setActiveView('assessment')} className="mt-6 text-sm font-bold text-emerald-700 underline">Start your first check-in</button>
                )}
              </GlassCard>

              {/* Middle/Right: Stats & Insights */}
              <div className="lg:col-span-2 space-y-8">
                 {/* Quick Stats Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { l: "Avg Pain", v: state.entries.length > 0 ? (state.entries.reduce((s, e) => s + e.pain, 0) / state.entries.length).toFixed(1) : '-', i: Heart, c: "text-rose-500" },
                      { l: "Avg Sleep", v: state.entries.length > 0 ? (state.entries.reduce((s, e) => s + e.sleepHours, 0) / state.entries.length).toFixed(1) + 'h' : '-', i: Moon, c: "text-indigo-500" },
                      { l: "Avg Mood", v: state.entries.length > 0 ? (state.entries.reduce((s, e) => s + e.mood, 0) / state.entries.length).toFixed(1) : '-', i: Brain, c: "text-purple-500" },
                      { l: "Entries", v: state.entries.length, i: Activity, c: "text-emerald-500" }
                    ].map((stat, i) => (
                      <GlassCard key={i} className="p-4 flex flex-col items-center justify-center text-center hover:border-emerald-200 transition-colors">
                         <stat.i className={`mb-2 ${stat.c}`} size={24} />
                         <span className="text-2xl font-bold serif text-stone-800">{stat.v}</span>
                         <span className="text-xs font-bold uppercase text-stone-400">{stat.l}</span>
                      </GlassCard>
                    ))}
                 </div>

                 {/* Insights */}
                 {aiInsights.length > 0 && (
                   <GlassCard className="p-6 bg-gradient-to-br from-emerald-50 to-stone-50 border-emerald-100">
                      <h3 className="font-bold serif text-emerald-900 mb-4 flex items-center gap-2"><Sparkles size={18}/> AI Vedic Insights</h3>
                      <div className="grid gap-3">
                        {aiInsights.slice(0, 3).map((insight, i) => (
                          <div key={i} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex gap-3">
                             <Target className="text-emerald-600 mt-1 shrink-0" size={18} />
                             <div>
                               <h4 className="font-bold text-sm text-stone-800">{insight.title}</h4>
                               <p className="text-sm text-stone-600">{insight.message}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                   </GlassCard>
                 )}
              </div>
              
              {/* Bottom: Charts */}
              {state.entries.length > 0 && (
                <div className="lg:col-span-3 grid md:grid-cols-2 gap-8">
                   <TrendChart data={state.entries} metric="pain" title="Pain Levels Trend" color="#EF4444" />
                   <TrendChart data={state.entries} metric="sleepHours" title="Sleep Duration Trend" color="#6366F1" />
                </div>
              )}
            </div>
          )}

          {activeView === 'assessment' && <HealthAssessmentForm onSubmit={handleHealthSubmit} isSubmitting={isSubmitting} />}
          
          {activeView === 'insights' && (
             <div className="max-w-2xl mx-auto space-y-6">
                <GlassCard className="p-8 text-center">
                   <Brain size={48} className="mx-auto text-emerald-200 mb-4" />
                   <h2 className="text-3xl font-bold serif text-emerald-900 mb-2">Vedic Intelligence</h2>
                   <p className="text-stone-500">Deep analysis based on your tracked metrics.</p>
                </GlassCard>
                {aiInsights.map((insight, i) => (
                   <GlassCard key={i} className="p-6 border-l-4 border-l-emerald-600">
                      <h3 className="text-lg font-bold serif mb-2 text-stone-800">{insight.title}</h3>
                      <p className="text-stone-600 leading-relaxed mb-4">{insight.message}</p>
                      <div className="flex gap-2">
                         <span className="text-xs font-bold bg-stone-100 px-2 py-1 rounded text-stone-500">Confidence: {insight.confidence}%</span>
                         <span className="text-xs font-bold bg-emerald-100 px-2 py-1 rounded text-emerald-700 uppercase">{insight.priority} Priority</span>
                      </div>
                   </GlassCard>
                ))}
             </div>
          )}

          {activeView === 'trends' && (
             <div className="space-y-8">
               {state.entries.length > 0 ? (
                 <>
                  <div className="grid md:grid-cols-2 gap-8">
                     <TrendChart data={state.entries} metric="aiScore" title="Overall Wellness Score" />
                     <TrendChart data={state.entries} metric="mood" title="Mood Stability" color="#A855F7" />
                  </div>
                  <div className="col-span-full">
                    <GlassCard className="p-8 text-center">
                      <div className="inline-flex items-center gap-3 bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={20} className="text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-800">Holistic Balance: All metrics tracked above</span>
                      </div>
                    </GlassCard>
                  </div>
                 </>
               ) : (
                 <GlassCard className="p-12 text-center">
                    <TrendingUp size={48} className="mx-auto text-stone-300 mb-4" />
                    <h3 className="text-xl font-bold text-stone-600">No History Yet</h3>
                    <p className="text-stone-400">Complete assessments to see your health journey.</p>
                 </GlassCard>
               )}
             </div>
          )}
        </main>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md p-6">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold serif text-stone-800">Preferences</h3>
                 <button onClick={() => setShowSettings(false)} className="text-stone-400 hover:text-stone-800">×</button>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <span className="font-bold text-stone-700">Export Health Data</span>
                    <button onClick={() => {
                       const dataStr = JSON.stringify(state, null, 2);
                       const link = document.createElement('a');
                       link.href = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                       link.download = `ayursutra-data-${new Date().toISOString()}.json`;
                       link.click();
                    }} className="flex items-center gap-2 text-emerald-700 font-bold text-sm hover:underline">
                      <Download size={16}/> JSON
                    </button>
                  </div>
                  <div className="text-xs text-stone-400 text-center pt-4">
                    AyurSutra Intelligence v2.0
                  </div>
               </div>
            </GlassCard>
          </div>
        )}

      </div>
    </div>
  );
};

export default HealthInfo;