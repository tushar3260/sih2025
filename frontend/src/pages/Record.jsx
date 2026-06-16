import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Trash2, Edit2, Save, X, Search, 
  User, Mail, Phone, Loader2, CheckCircle2,
  Calendar, BookOpen, DollarSign, Activity, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/userContext";
import { useNavigate } from "react-router-dom";

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

const AnimBg = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" style={{animation:'rdrift 24s ease-in-out infinite'}} />
    <style>{`@keyframes rdrift{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,30px)}}`}</style>
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    Scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Cancelled: "bg-red-100 text-red-800 border-red-200",
  }[status] || "bg-stone-100 text-stone-600 border-stone-200";
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${cfg}`}>
      {status}
    </span>
  );
};

const RecordsPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapies, setTherapies] = useState([]);
  const [practitionerDocId, setPractitionerDocId] = useState(null);

  // Form states matching backend fields
  const [form, setForm] = useState({
    patient: "",
    therapy: "",
    sessionDate: "",
    notes: "",
    status: "Scheduled",
    paymentAmount: 0,
    paymentPaid: false,
    paymentMethod: "Cash"
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // 1. Fetch records
      const resRecords = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/records`);
      setRecords(resRecords.data);

      // 2. Fetch patients
      const resPatients = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user/patients`);
      setPatients(resPatients.data);

      // 3. Fetch therapies
      const resTherapies = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/therapies`);
      setTherapies(resTherapies.data);

      // 4. Fetch practitioner profile ID
      const resPracs = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/practitioners`);
      const myDoc = resPracs.data.find(p => String(p.user?._id || p.user) === String(user.id || user._id));
      if (myDoc) {
        setPractitionerDocId(myDoc._id);
      } else {
        setMessage({ type: "error", text: "Practitioner profile not found. Please set up profile first." });
      }
    } catch (error) {
      console.error("Error loading records data:", error);
      setMessage({ type: "error", text: "Failed to load clinic records." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  // Sync therapy price to amount when selected
  const handleTherapyChange = (therapyId) => {
    const selected = therapies.find(t => t._id === therapyId);
    setForm(prev => ({
      ...prev,
      therapy: therapyId,
      paymentAmount: selected ? selected.price : 0
    }));
  };

  // Add Record
  const handleAdd = async () => {
    if (!form.patient || !form.therapy || !form.sessionDate || !practitionerDocId) {
      setMessage({ type: "error", text: "Patient, Therapy, and Session Date are required." });
      return;
    }

    try {
      const payload = {
        patient: form.patient,
        therapy: form.therapy,
        doctor: practitionerDocId,
        sessionDate: new Date(form.sessionDate).toISOString(),
        notes: form.notes,
        status: form.status,
        payment: {
          amount: Number(form.paymentAmount),
          paid: form.paymentPaid,
          method: form.paymentMethod
        }
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/records`, payload);
      resetForm();
      fetchInitialData();
      setMessage({ type: "success", text: "Record added successfully!" });
    } catch (error) {
      console.error("Error adding record:", error);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to create record." });
    }
  };

  // Update Record
  const handleUpdate = async () => {
    if (!form.patient || !form.therapy || !form.sessionDate) {
      setMessage({ type: "error", text: "Patient, Therapy, and Session Date are required." });
      return;
    }

    try {
      const payload = {
        patient: form.patient,
        therapy: form.therapy,
        doctor: practitionerDocId,
        sessionDate: new Date(form.sessionDate).toISOString(),
        notes: form.notes,
        status: form.status,
        payment: {
          amount: Number(form.paymentAmount),
          paid: form.paymentPaid,
          method: form.paymentMethod
        }
      };

      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/records/${editingId}`, payload);
      setEditingId(null);
      resetForm();
      fetchInitialData();
      setMessage({ type: "success", text: "Record updated successfully!" });
    } catch (error) {
      console.error("Error updating record:", error);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update record." });
    }
  };

  // Delete Record
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this clinical record?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/records/${id}`);
      fetchInitialData();
      setMessage({ type: "success", text: "Record deleted successfully." });
    } catch (error) {
      console.error("Error deleting record:", error);
      setMessage({ type: "error", text: "Failed to delete record." });
    }
  };

  const handleEditClick = (rec) => {
    setEditingId(rec._id);
    const dateFormatted = rec.sessionDate ? new Date(rec.sessionDate).toISOString().split("T")[0] : "";
    setForm({
      patient: rec.patient?._id || "",
      therapy: rec.therapy?._id || "",
      sessionDate: dateFormatted,
      notes: rec.notes || "",
      status: rec.status || "Scheduled",
      paymentAmount: rec.payment?.amount || 0,
      paymentPaid: rec.payment?.paid || false,
      paymentMethod: rec.payment?.method || "Cash"
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      patient: "",
      therapy: "",
      sessionDate: "",
      notes: "",
      status: "Scheduled",
      paymentAmount: 0,
      paymentPaid: false,
      paymentMethod: "Cash"
    });
  };

  const filteredRecords = records.filter(r => {
    const pName = r.patient?.name || "";
    const tName = r.therapy?.name || "";
    return pName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           tName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#F5F5F4] relative selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
      <GlobalStyles />
      <AnimBg />
      <div className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <button onClick={() => navigate('/doctor-dashboard')}
              className="flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors mb-2 text-xs font-bold uppercase tracking-wider">
              &larr; Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-stone-900 serif mb-2">Clinical Session Records</h1>
            <p className="text-stone-500">Record treatments, session details, and client payments.</p>
          </div>
          <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-700 transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Search patient/therapy..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-white/60 border border-stone-200 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:bg-white w-full md:w-64 shadow-sm transition-all"
             />
          </div>
        </div>

        {/* Status Message */}
        <AnimatePresence>
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-xl text-sm font-semibold border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}
            >
               {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Form Card */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 rounded-2xl sticky top-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-emerald-900 serif border-b border-stone-200 pb-2">
                {editingId ? "Edit Record" : "New Entry"}
              </h3>
              
              <div className="space-y-4">
                {/* Patient Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Patient</label>
                  <select 
                    value={form.patient}
                    onChange={(e) => setForm({ ...form, patient: e.target.value })}
                    className="w-full bg-white/60 border border-stone-200 rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:bg-white transition-all shadow-sm"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                    ))}
                  </select>
                </div>

                {/* Therapy Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Therapy / Treatment</label>
                  <select 
                    value={form.therapy}
                    onChange={(e) => handleTherapyChange(e.target.value)}
                    className="w-full bg-white/60 border border-stone-200 rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:bg-white transition-all shadow-sm"
                  >
                    <option value="">Select Therapy</option>
                    {therapies.map(t => (
                      <option key={t._id} value={t._id}>{t.name} (₹{t.price})</option>
                    ))}
                  </select>
                </div>

                {/* Session Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Session Date</label>
                  <input 
                    type="date"
                    value={form.sessionDate}
                    onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                    className="w-full bg-white/60 border border-stone-200 rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Treatment Notes</label>
                  <textarea 
                    placeholder="Enter diagnostic details, herbs prescribed, etc."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full bg-white/60 border border-stone-200 rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Status</label>
                  <select 
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-white/60 border border-stone-200 rounded-xl py-3 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:bg-white transition-all shadow-sm"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Payment Fields */}
                <div className="border-t border-stone-200 pt-3 space-y-3">
                  <label className="text-xs font-bold text-emerald-800 uppercase block">Payment Info</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500">Amount (₹)</label>
                      <input 
                        type="number"
                        value={form.paymentAmount}
                        onChange={(e) => setForm({ ...form, paymentAmount: Number(e.target.value) })}
                        className="w-full bg-white/60 border border-stone-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500">Method</label>
                      <select 
                        value={form.paymentMethod}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                        className="w-full bg-white/60 border border-stone-200 rounded-xl py-2 px-2 text-sm focus:outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Insurance">Insurance</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input 
                      type="checkbox"
                      checked={form.paymentPaid}
                      onChange={(e) => setForm({ ...form, paymentPaid: e.target.checked })}
                      className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-stone-600">Mark as Paid</span>
                  </label>
                </div>
                
                {/* Submit Action */}
                <div className="flex gap-3 pt-4">
                  {editingId ? (
                    <>
                      <button onClick={handleUpdate} className="flex-1 bg-emerald-900 text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg text-sm">
                        <Save size={16}/> Update
                      </button>
                      <button onClick={handleCancel} className="p-3 bg-stone-200 text-stone-600 rounded-xl hover:bg-stone-300 transition-colors">
                        <X size={18}/>
                      </button>
                    </>
                  ) : (
                    <button onClick={handleAdd} className="w-full bg-emerald-900 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg text-sm">
                      <Plus size={16}/> Save Record
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
                <p className="font-semibold">Syncing clinical database...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-20 text-stone-400 glass-card rounded-2xl">
                <p className="font-semibold">No patient records found.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredRecords.map((rec) => (
                  <motion.div
                    key={rec._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card p-5 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-4 group hover:border-emerald-300/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-950 text-white flex flex-col items-center justify-center font-bold shadow-md shrink-0">
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">
                          {rec.sessionDate ? new Date(rec.sessionDate).toLocaleDateString('en-IN', { month: 'short' }) : "Date"}
                        </span>
                        <span className="text-lg leading-none serif">
                          {rec.sessionDate ? new Date(rec.sessionDate).getDate() : "--"}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="font-bold text-stone-800 text-lg serif leading-snug">{rec.patient?.name || "Unknown Patient"}</h4>
                          <StatusBadge status={rec.status} />
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 font-medium">
                          <span className="flex items-center gap-1"><BookOpen size={13} className="text-emerald-700"/> {rec.therapy?.name || "No therapy"}</span>
                          {rec.patient?.email && <span className="flex items-center gap-1"><Mail size={13}/> {rec.patient.email}</span>}
                          {rec.payment && (
                            <span className="flex items-center gap-1">
                              <DollarSign size={13} className={rec.payment.paid ? "text-emerald-700" : "text-amber-600"}/>
                              ₹{rec.payment.amount} ({rec.payment.paid ? "Paid" : "Unpaid"} via {rec.payment.method})
                            </span>
                          )}
                        </div>

                        {rec.notes && (
                          <p className="text-sm text-stone-600 leading-relaxed bg-stone-100/50 p-3 rounded-lg border border-stone-200/40 mt-2 flex items-start gap-2">
                            <FileText size={15} className="text-stone-400 shrink-0 mt-0.5" />
                            <span>{rec.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 self-end md:self-start">
                      <button 
                        onClick={() => handleEditClick(rec)}
                        className="p-2 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                        title="Edit Record"
                      >
                        <Edit2 size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(rec._id)}
                        className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete Record"
                      >
                        <Trash2 size={16}/>
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