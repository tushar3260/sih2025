import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2, CheckCircle2 } from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const ReviewModal = ({ appointment, patientId, onClose, onSuccess }) => {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  const handleSubmit = async () => {
    if (!rating) { setError("Please select a star rating."); return; }
    try {
      setLoading(true);
      setError("");
      await axios.post(`${API_BASE_URL}/reviews`, {
        appointmentId: appointment.id || appointment._id,
        rating,
        comment,
      });
      setSubmitted(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1800);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/60"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 p-7 text-white relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")` }} />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">Rate Your Experience</p>
                <h3 className="text-2xl font-bold serif">{appointment?.title || "Session"}</h3>
                <p className="text-emerald-200 text-sm mt-1">with Dr. {appointment?.doctor || "your practitioner"}</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-7">
            {submitted ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} className="text-emerald-600" />
                </div>
                <h4 className="text-xl font-bold text-stone-900 serif mb-2">Thank You!</h4>
                <p className="text-stone-500 text-sm">Your review helps other patients find the best care.</p>
              </motion.div>
            ) : (
              <>
                {/* Stars */}
                <div className="text-center mb-6">
                  <p className="text-stone-500 text-sm font-medium mb-4">How was your experience?</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={40}
                          className="transition-colors duration-150"
                          fill={(hovered || rating) >= star ? "#f59e0b" : "none"}
                          stroke={(hovered || rating) >= star ? "#f59e0b" : "#d6d3d1"}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                  {(hovered || rating) > 0 && (
                    <motion.p
                      key={hovered || rating}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-amber-600 font-bold text-sm mt-2"
                    >
                      {labels[hovered || rating]}
                    </motion.p>
                  )}
                </div>

                {/* Comment */}
                <div className="mb-6">
                  <label className="text-sm font-bold text-stone-600 block mb-2">
                    Add a comment <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Share details of your experience, what went well, what could be better..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
                  />
                  <p className="text-xs text-stone-400 text-right mt-1">{comment.length}/500</p>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-red-600 text-sm font-medium mb-4 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={onClose}
                    className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !rating}
                    className="flex-1 py-3 bg-emerald-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    {loading ? "Submitting…" : "Submit Review"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
