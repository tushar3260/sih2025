import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Stethoscope, Calendar, CheckCircle, AlertTriangle, Clock, 
  Heart, Activity, ArrowRight, Star, Sparkles, Shield, FileText, 
  Eye, Brain, Zap, Leaf, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

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
    
    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 10px; }
  `}</style>
);

// --- 2. Reusable UI Components ---

const GlassCard = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex justify-between items-center mb-12 relative px-4">
    {/* Connecting Line */}
    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-stone-200 -z-10 mx-8" />
    
    {steps.map((step, index) => {
      const isActive = index <= currentStep;
      const isCurrent = index === currentStep;
      
      return (
        <div key={index} className="flex flex-col items-center gap-2">
          <motion.div 
            initial={false}
            animate={{ 
              scale: isCurrent ? 1.2 : 1,
              backgroundColor: isActive ? '#064E3B' : '#E7E5E4',
              borderColor: isActive ? '#064E3B' : '#E7E5E4'
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-[#F5F5F4] z-10 transition-colors duration-300`}
          >
            <step.icon size={16} />
          </motion.div>
          <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-emerald-900' : 'text-stone-400'}`}>
            {step.title}
          </span>
        </div>
      );
    })}
  </div>
);

// --- 3. Neural Network Logic (Moved OUTSIDE component) ---
class SimpleNeuralNetwork {
  constructor() {
    this.weights1 = this.randomMatrix(30, 64);
    this.weights2 = this.randomMatrix(64, 32);
    this.weights3 = this.randomMatrix(32, 7);
    this.bias1 = this.randomArray(64);
    this.bias2 = this.randomArray(32);
    this.bias3 = this.randomArray(7);
    this.trained = false;
  }

  randomMatrix(rows, cols) {
    return Array(rows).fill().map(() => Array(cols).fill().map(() => Math.random() * 2 - 1));
  }

  randomArray(size) {
    return Array(size).fill().map(() => Math.random() * 2 - 1);
  }

  relu(x) { return Math.max(0, x); }
  sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  
  softmax(arr) {
    const max = Math.max(...arr);
    const exp = arr.map(x => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(x => x / sum);
  }

  predict(input) {
    // Layer 1
    let layer1 = new Array(64).fill(0).map((_, i) => {
      let sum = this.bias1[i];
      for (let j = 0; j < 30; j++) sum += input[j] * this.weights1[j][i];
      return this.relu(sum);
    });

    // Layer 2
    let layer2 = new Array(32).fill(0).map((_, i) => {
      let sum = this.bias2[i];
      for (let j = 0; j < 64; j++) sum += layer1[j] * this.weights2[j][i];
      return this.relu(sum);
    });

    // Output
    let output = new Array(7).fill(0).map((_, i) => {
      let sum = this.bias3[i];
      for (let j = 0; j < 32; j++) sum += layer2[j] * this.weights3[j][i];
      return sum;
    });

    return this.softmax(output);
  }

  train(trainingData) {
    const learningRate = 0.01;
    trainingData.forEach(({ input, target }) => {
      const prediction = this.predict(input);
      // Very simple backprop simulation for the demo
      for (let i = 0; i < 7; i++) {
        const error = target[i] - prediction[i];
        this.bias3[i] += learningRate * error;
        for (let j = 0; j < 32; j++) this.weights3[j][i] += learningRate * error * 0.1;
      }
    });
    this.trained = true;
  }
}

// --- 4. Main Component ---

const PanchakarmaAIsystem = () => {
  const [currentView, setCurrentView] = useState('form');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [patientData, setPatientData] = useState({
    name: '', age: '', gender: '', weight: '',
    medicalHistory: [], symptoms: [],
    lifestyle: { dietType: '', sleepQuality: '', activityLevel: '', stressLevel: '' },
    goals: []
  });
  const [recommendations, setRecommendations] = useState(null);

  // Memoize the AI model so it doesn't recreate on render
  const aiModel = useMemo(() => new SimpleNeuralNetwork(), []);

  // Data Constants
  const steps = [
    { title: 'Info', icon: User },
    { title: 'History', icon: Stethoscope },
    { title: 'Symptoms', icon: AlertTriangle },
    { title: 'Lifestyle', icon: Activity },
    { title: 'Goals', icon: Heart }
  ];

  const symptoms = [
    { name: 'Chronic Constipation', icon: '🔄', severity: 'high', code: 0 },
    { name: 'Bloating', icon: '💨', severity: 'medium', code: 1 },
    { name: 'Fatigue', icon: '😴', severity: 'high', code: 2 },
    { name: 'Stress/Anxiety', icon: '😰', severity: 'high', code: 3 },
    { name: 'Insomnia', icon: '🌙', severity: 'high', code: 4 },
    { name: 'Joint Pain', icon: '🦴', severity: 'high', code: 5 },
    { name: 'Skin Problems', icon: '🧴', severity: 'medium', code: 6 },
    { name: 'Respiratory Issues', icon: '🫁', severity: 'high', code: 7 },
    { name: 'Digestive Problems', icon: '🍽️', severity: 'high', code: 8 },
    { name: 'Headaches', icon: '🤕', severity: 'medium', code: 9 },
    { name: 'Weight Gain', icon: '⚖️', severity: 'medium', code: 10 },
    { name: 'Poor Circulation', icon: '💓', severity: 'medium', code: 11 }
  ];

  const medicalConditions = [
    { name: 'Diabetes', icon: '🩸', risk: 'high', code: 0 },
    { name: 'Hypertension', icon: '❤️‍🔥', risk: 'high', code: 1 },
    { name: 'Arthritis', icon: '🦴', risk: 'medium', code: 2 },
    { name: 'Asthma', icon: '🫁', risk: 'medium', code: 3 },
    { name: 'Thyroid Issues', icon: '🦋', risk: 'medium', code: 4 },
    { name: 'Heart Disease', icon: '💔', risk: 'high', code: 5 },
    { name: 'Kidney Problems', icon: '🫘', risk: 'high', code: 6 },
    { name: 'None', icon: '✅', risk: 'none', code: 7 }
  ];

  const therapyGoals = [
    { name: 'Complete Detox', icon: '🌿', description: 'Full body cleansing', code: 0 },
    { name: 'Stress Relief', icon: '🧘‍♀️', description: 'Mental peace & relaxation', code: 1 },
    { name: 'Weight Management', icon: '⚖️', description: 'Healthy weight goals', code: 2 },
    { name: 'Chronic Mgmt', icon: '🏥', description: 'Long-term health support', code: 3 },
    { name: 'Preventive Care', icon: '🛡️', description: 'Maintain wellness', code: 4 },
    { name: 'Energy Boost', icon: '⚡', description: 'Vitality enhancement', code: 5 }
  ];

  const therapies = [
    { name: 'Vamana', type: 'Emetic Therapy', description: 'Therapeutic vomiting to eliminate Kapha toxins from upper body', duration: '3-5 days', effectiveness: 95 },
    { name: 'Virechana', type: 'Purgation Therapy', description: 'Controlled elimination through intestinal cleansing', duration: '3-7 days', effectiveness: 92 },
    { name: 'Basti', type: 'Medicated Enema', description: 'Herbal enemas to balance Vata and cleanse colon', duration: '8-30 days', effectiveness: 90 },
    { name: 'Nasya', type: 'Nasal Therapy', description: 'Medicated oil administration through nasal passages', duration: '7-14 days', effectiveness: 87 },
    { name: 'Raktamokshana', type: 'Blood Purification', description: 'Purification of blood to eliminate deep-seated toxins', duration: '1-3 sessions', effectiveness: 85 },
    { name: 'Shirodhara', type: 'Oil Pouring Therapy', description: 'Continuous oil pouring on forehead for mental tranquility', duration: '7-21 days', effectiveness: 93 },
    { name: 'Abhyanga', type: 'Full Body Oil Massage', description: 'Therapeutic massage with herbal oils for rejuvenation', duration: '7-14 days', effectiveness: 88 }
  ];

  // Logic Functions
  const generateTrainingData = () => {
    const data = [];
    const symptomToTherapy = { 0: [0, 1], 1: [1, 6], 2: [6, 2], 3: [5, 3], 4: [5, 6], 5: [2, 6], 6: [4, 1], 7: [3, 0], 8: [1, 2], 9: [3, 5], 10: [1, 6], 11: [6, 4] };
    for (let i = 0; i < 500; i++) {
      const input = new Array(30).fill(0).map(() => Math.random());
      const primarySymptom = Math.floor(Math.random() * 12);
      input[10 + primarySymptom] = 1;
      const target = new Array(7).fill(0);
      const recs = symptomToTherapy[primarySymptom] || [6];
      recs.forEach(idx => target[idx] = 1 / recs.length);
      data.push({ input, target });
    }
    return data;
  };

  const preprocessPatientData = (data) => {
    const features = new Array(30).fill(0);
    features[0] = data.age ? parseInt(data.age) / 100 : 0.3;
    features[1] = data.gender === 'male' ? 1 : 0;
    features[2] = data.weight ? parseInt(data.weight) / 150 : 0.5;
    medicalConditions.forEach(c => { if(data.medicalHistory.includes(c.name)) features[3 + c.code] = 1; });
    symptoms.forEach(s => { if(data.symptoms.includes(s.name)) features[10 + s.code] = 1; });
    // Simplified lifestyle mapping for brevity
    features[22] = 0.5; 
    therapyGoals.forEach(g => { if(data.goals.includes(g.name)) features[26 + g.code] = 1; });
    return features;
  };

  const generateAIRecommendations = async (data) => {
    if (!aiModel.trained) aiModel.train(generateTrainingData());
    const features = preprocessPatientData(data);
    const predictions = aiModel.predict(features);
    
    const therapyScores = therapies.map((t, i) => ({
      ...t, aiScore: predictions[i] * 100, confidence: Math.min(predictions[i] * 100 + 10, 98)
    })).sort((a, b) => b.aiScore - a.aiScore);

    const precautions = ['Pre-treatment consultation mandatory'];
    if (data.medicalHistory.includes('Heart Disease')) precautions.push('Cardiac monitoring required');
    if (data.medicalHistory.includes('Diabetes')) precautions.push('Blood sugar monitoring essential');

    return {
      primary: therapyScores.slice(0, 2),
      secondary: therapyScores.slice(2, 5),
      precautions,
      confidenceScore: Math.round(therapyScores[0].aiScore + 10),
      analysisDetails: {
        totalSymptoms: data.symptoms.length,
        primaryTherapyScore: Math.round(therapyScores[0].aiScore)
      }
    };
  };

  // Handlers
  const handleInputChange = (f, v) => {
    if (f.includes('.')) {
      const [p, c] = f.split('.');
      setPatientData(prev => ({ ...prev, [p]: { ...prev[p], [c]: v } }));
    } else {
      setPatientData(prev => ({ ...prev, [f]: v }));
    }
  };

  const handleArrayChange = (field, value, checked) => {
    setPatientData(prev => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter(item => item !== value)
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 2000)); // Simulated delay
    const recs = await generateAIRecommendations(patientData);
    setRecommendations(recs);
    setIsLoading(false);
    setCurrentView('recommendations');
  };

  // --- RENDERERS ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex flex-col items-center justify-center relative overflow-hidden">
        <GlobalStyles />
        <div className="absolute inset-0 z-0 opacity-[0.05]" style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}/>
        <GlassCard className="p-12 flex flex-col items-center max-w-md w-full relative z-10 border-emerald-100">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-emerald-100 rounded-full animate-spin border-t-emerald-600"></div>
            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-800 animate-pulse" size={32} />
          </div>
          <h2 className="text-2xl font-bold serif text-emerald-900 mb-2">Analyzing Prakriti...</h2>
          <p className="text-stone-500 text-sm text-center">Our AI is consulting the digital granth to find your optimal path.</p>
        </GlassCard>
      </div>
    );
  }

  // --- FORM STEPS ---
  const renderFormStep = () => {
    const formContent = () => {
      switch(currentStep) {
        case 0: // Basic Info
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold serif text-emerald-900 mb-2">Welcome</h2>
                <p className="text-stone-500">Let's start with the basics to calibrate your profile.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { l: "Full Name", k: "name", t: "text", i: User },
                  { l: "Age", k: "age", t: "number", i: Calendar },
                  { l: "Weight (kg)", k: "weight", t: "number", i: Activity }
                ].map(field => (
                  <div key={field.k} className="space-y-2">
                    <label className="text-sm font-bold text-stone-600 flex items-center gap-2">
                      <field.i size={14} className="text-emerald-600"/> {field.l}
                    </label>
                    <input 
                      type={field.t}
                      value={patientData[field.k]}
                      onChange={(e) => handleInputChange(field.k, e.target.value)}
                      className="w-full bg-white/50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                      placeholder={`Enter your ${field.l.toLowerCase()}`}
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-600">Gender</label>
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map(g => (
                      <button key={g} onClick={() => handleInputChange('gender', g)}
                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                          patientData.gender === g ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        case 1: // History
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold serif text-emerald-900 mb-2">Medical History</h2>
                <p className="text-stone-500">Select any pre-existing conditions.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {medicalConditions.map(c => (
                  <div key={c.name} onClick={() => handleArrayChange('medicalHistory', c.name, !patientData.medicalHistory.includes(c.name))}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center gap-4 transition-all ${
                      patientData.medicalHistory.includes(c.name) ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-stone-200 hover:border-emerald-200'
                    }`}
                  >
                    <span className="text-2xl">{c.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-800">{c.name}</h4>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.risk === 'high' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'}`}>{c.risk} Risk</span>
                    </div>
                    {patientData.medicalHistory.includes(c.name) && <CheckCircle className="text-emerald-600" size={20}/>}
                  </div>
                ))}
              </div>
            </div>
          );
        case 2: // Symptoms
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold serif text-emerald-900 mb-2">Symptoms</h2>
                <p className="text-stone-500">What brings you here today?</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {symptoms.map(s => (
                  <div key={s.name} onClick={() => handleArrayChange('symptoms', s.name, !patientData.symptoms.includes(s.name))}
                    className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center text-center gap-2 transition-all ${
                      patientData.symptoms.includes(s.name) ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500 shadow-md' : 'bg-white border-stone-200 hover:border-amber-200'
                    }`}
                  >
                    <span className="text-3xl">{s.icon}</span>
                    <span className="font-bold text-sm text-stone-800">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        case 3: // Lifestyle
          return (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold serif text-emerald-900 mb-2">Lifestyle</h2>
                <p className="text-stone-500">Help us understand your daily routine.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  { label: "Diet", key: "dietType", opts: ['vegetarian', 'non-vegetarian', 'vegan'] },
                  { label: "Sleep", key: "sleepQuality", opts: ['excellent', 'good', 'fair', 'poor'] },
                  { label: "Activity", key: "activityLevel", opts: ['sedentary', 'moderate', 'high'] },
                  { label: "Stress", key: "stressLevel", opts: ['low', 'moderate', 'high'] }
                ].map(group => (
                  <div key={group.key} className="space-y-3">
                    <h4 className="font-bold text-stone-700 flex items-center gap-2"><Leaf size={14} className="text-emerald-600"/> {group.label}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.opts.map(opt => (
                        <button key={opt} type="button" onClick={() => handleInputChange(`lifestyle.${group.key}`, opt)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                            patientData.lifestyle[group.key] === opt 
                            ? 'bg-emerald-800 text-white border-emerald-800' 
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        case 4: // Goals
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold serif text-emerald-900 mb-2">Goals</h2>
                <p className="text-stone-500">What is your desired outcome?</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {therapyGoals.map(g => (
                  <div key={g.name} onClick={() => handleArrayChange('goals', g.name, !patientData.goals.includes(g.name))}
                    className={`p-6 rounded-xl border cursor-pointer transition-all ${
                      patientData.goals.includes(g.name) ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{g.icon}</span>
                      <div>
                        <h4 className="font-bold text-lg">{g.name}</h4>
                        <p className={`text-xs ${patientData.goals.includes(g.name) ? 'text-emerald-200' : 'text-stone-500'}`}>{g.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        default: return null;
      }
    };

    return (
      <div className="min-h-screen bg-[#F5F5F4] relative selection:bg-emerald-200 selection:text-emerald-900">
        <GlobalStyles />
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}/>
        
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles size={12} /> AI Veda
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-emerald-950 serif">Panchakarma Advisor</h1>
          </div>

          <GlassCard className="p-8 md:p-12">
            <StepIndicator currentStep={currentStep} steps={steps} />
            
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[400px]"
            >
              {formContent()}
            </motion.div>

            <div className="flex justify-between items-center mt-12 pt-8 border-t border-stone-200">
              <button 
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 text-stone-500 font-bold hover:text-emerald-900 disabled:opacity-30 disabled:hover:text-stone-500"
              >
                Back
              </button>
              <button 
                onClick={() => currentStep < steps.length - 1 ? setCurrentStep(prev => prev + 1) : handleSubmit()}
                className="bg-emerald-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-800 hover:shadow-emerald-900/20 transition-all flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? <>Analyze <Zap size={18}/></> : <>Next <ArrowRight size={18}/></>}
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  };

  // --- RECOMMENDATIONS VIEW ---
  if (currentView === 'recommendations') {
    return (
      <div className="min-h-screen bg-[#F5F5F4] relative">
        <GlobalStyles />
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}/>
        
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setCurrentView('form')} className="flex items-center gap-2 text-stone-500 hover:text-emerald-900 font-bold text-sm uppercase tracking-wider">
              <ArrowRight className="rotate-180" size={16}/> Back to Form
            </button>
            <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-100 px-4 py-2 rounded-full text-xs uppercase">
              <Brain size={14}/> AI Confidence: {recommendations?.confidenceScore}%
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Sidebar Profile */}
            <GlassCard className="p-6 h-fit md:col-span-1">
              <div className="text-center border-b border-stone-100 pb-6 mb-6">
                <div className="w-20 h-20 bg-stone-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">👤</div>
                <h2 className="text-xl font-bold serif text-emerald-900">{patientData.name || "Patient"}</h2>
                <p className="text-stone-500 text-sm">{patientData.age} Yrs • {patientData.gender}</p>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-stone-400 uppercase block mb-1">Identified Symptoms</span>
                  <div className="flex flex-wrap gap-1">
                    {patientData.symptoms.map(s => (
                      <span key={s} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-400 uppercase block mb-1">Goals</span>
                  <div className="flex flex-wrap gap-1">
                    {patientData.goals.map(g => (
                      <span key={g} className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-100">{g}</span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              
              {/* Primary Recs */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold serif text-emerald-900 flex items-center gap-2">
                  <Sparkles className="text-amber-500" /> Recommended Therapies
                </h3>
                {recommendations?.primary.map((rec, i) => (
                  <GlassCard key={i} className="p-0 overflow-hidden border-l-8 border-l-emerald-600">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-xl font-bold text-stone-800">{rec.name}</h4>
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">{rec.type}</span>
                        </div>
                        <div className="text-center bg-emerald-50 px-3 py-1 rounded-lg">
                          <span className="block text-xl font-bold text-emerald-800">{Math.round(rec.aiScore)}%</span>
                          <span className="text-[10px] text-emerald-600 uppercase font-bold">Match</span>
                        </div>
                      </div>
                      <p className="text-stone-600 mb-4 text-sm leading-relaxed">{rec.description}</p>
                      <div className="flex gap-4 text-xs font-bold text-stone-500 border-t border-stone-100 pt-4">
                        <span className="flex items-center gap-1"><Clock size={14}/> {rec.duration}</span>
                        <span className="flex items-center gap-1"><Star size={14} className="text-amber-500"/> {rec.effectiveness}% Effective</span>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {/* Precautions */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2"><Shield size={18}/> Safety Protocols</h3>
                <ul className="space-y-2">
                  {recommendations?.precautions.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0"/> {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <div className="flex gap-4">
                <button className="flex-1 bg-stone-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-900 transition-all">
                  Book Consultation
                </button>
                <button className="flex-1 bg-white text-stone-900 border border-stone-200 py-4 rounded-xl font-bold shadow-sm hover:bg-stone-50 transition-all">
                  Save Report
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (Form View)
  return renderFormStep();
};

export default PanchakarmaAIsystem;