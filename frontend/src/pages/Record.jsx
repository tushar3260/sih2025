import React, { useState, useEffect, useRef, Suspense } from "react";
import axios from "axios";
import { 
  Plus, Trash2, Edit2, Save, X, Search, 
  User, Mail, Phone, Loader2, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    h1, h2, h3, h4, .serif { font-family: 'Playfair Display', serif; }
    
    .glass-card {
      background: rgba(255, 255, 255, 0.70); 
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
    }
  `}</style>
);

// --- 2. 3D Background (Subtle Flow) ---
const OrganicFluid = () => {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.2;
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(t) * 0.2;
      meshRef.current.rotation.y = Math.cos(t * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} position={[4, -2, -5]}>
      <mesh ref={meshRef} scale={[4, 4, 4]}>
        <icosahedronGeometry args={[1, 4]} /> 
        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={2}
          chromaticAberration={0.03}
          anisotropy={0.1}
          distortion={0.4}
          distortionScale={0.4}
          temporalDistortion={0.1}
          iridescence={0.3}
          color={new THREE.Color("#065f46")}
          bg={new THREE.Color("#F5F5F4")}
          transmission={0.9}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
};

const Scene = () => (
  <div className="fixed inset-0 z-0 w-full h-full pointer-events-none opacity-50">
    <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
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
  <div className="relative group flex-1">
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700/50 group-focus-within:text-emerald-700 transition-colors" size={18} />}
    <input 
      {...props}
      className={`w-full bg-white/60 border border-stone-200 rounded-xl py-3 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-700 focus:bg-white transition-all shadow-sm`}
    />
  </div>
);

const RecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Records
  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/records`);
      setRecords(res.data);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Add Record
  const handleAdd = async () => {
    if (!form.name || !form.email) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/records`, form);
      setForm({ name: "", email: "", phone: "" });
      fetchRecords();
    } catch (error) {
      console.error("Error adding record:", error);
    }
  };

  // Delete Record
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/records/${id}`);
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  // Update Record
  const handleUpdate = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/records/${editingId}`, form);
      setEditingId(null);
      setForm({ name: "", email: "", phone: "" });
      fetchRecords();
    } catch (error) {
      console.error("Error updating record:", error);
    }
  };

  const handleEditClick = (rec) => {
    setForm({ name: rec.name, email: rec.email, phone: rec.phone });
    setEditingId(rec._id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: "", email: "", phone: "" });
  };

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F4] relative selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
      <GlobalStyles />
      <Scene />
      
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-multiply" 
           style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`}}>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-stone-900 serif mb-2">Patient Records</h1>
            <p className="text-stone-500">Manage and update your clinic's database.</p>
          </div>
          <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-700 transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Search records..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-white/60 border border-stone-200 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:bg-white w-full md:w-64 shadow-sm transition-all"
             />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Form Card */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 rounded-2xl sticky top-24"
            >
              <h3 className="text-lg font-bold text-emerald-900 serif mb-6 border-b border-stone-200 pb-2">
                {editingId ? "Edit Record" : "New Entry"}
              </h3>
              
              <div className="space-y-4">
                <GlassInput icon={User} placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <GlassInput icon={Mail} placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <GlassInput icon={Phone} placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                
                <div className="flex gap-3 pt-4">
                  {editingId ? (
                    <>
                      <button onClick={handleUpdate} className="flex-1 bg-emerald-900 text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                        <Save size={18}/> Update
                      </button>
                      <button onClick={handleCancel} className="p-3 bg-stone-200 text-stone-600 rounded-xl hover:bg-stone-300 transition-colors">
                        <X size={20}/>
                      </button>
                    </>
                  ) : (
                    <button onClick={handleAdd} className="w-full bg-emerald-900 text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                      <Plus size={18}/> Add Record
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Records List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <Loader2 className="animate-spin mb-4" size={32}/>
                <p>Loading database...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-20 text-stone-400 glass-card rounded-2xl">
                <p>No records found.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredRecords.map((rec) => (
                  <motion.div
                    key={rec._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-emerald-300/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shadow-inner">
                        {rec.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-lg serif">{rec.name}</h4>
                        <div className="flex flex-wrap gap-3 text-sm text-stone-500 mt-1">
                          <span className="flex items-center gap-1"><Mail size={12}/> {rec.email}</span>
                          <span className="flex items-center gap-1"><Phone size={12}/> {rec.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 self-end sm:self-center">
                      <button 
                        onClick={() => handleEditClick(rec)}
                        className="p-2 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(rec._id)}
                        className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default RecordsPage;