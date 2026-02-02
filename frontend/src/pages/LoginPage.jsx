import React, { useState } from 'react';
import { Eye, EyeOff, Leaf, Mail, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Navigate, Link } from "react-router-dom"; // Added Link for better routing if needed, though window.location is preserved
import { useUser } from "../context/userContext"; 

const LoginPage = () => {
  const { user, setUser } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rememberMe, setRememberMe] = useState(false);

  // --- LOGIC SECTION (Unchanged) ---
  if (user) {
    return <Navigate to={user.role === "practitioner" ? "/doctor-dashboard" : "/dashboard"} replace />;
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return false;
    }
    if (!formData.password.trim()) {
      setMessage({ type: 'error', text: 'Password is required' });
      return false;
    }
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/user/login`,
        formData
      );

      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token);
        setMessage({ type: 'success', text: response.data.message || 'Login successful! Redirecting...' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Invalid email or password. Please try again.' });
      }

    } catch (error) {
      console.error(error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address first' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // --- RENDER SECTION (Redesigned) ---
  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-green-100">
      
      {/* LEFT SIDE: Visual Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-700 via-emerald-600 to-teal-500 overflow-hidden text-white items-center justify-center p-12">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
           </svg>
        </div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 rounded-full blur-[80px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-teal-200 rounded-full blur-[80px] opacity-30"></div>

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="mb-6 inline-flex p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
             <Leaf className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Holistic health, <br/> simplified for you.
          </h2>
          <p className="text-lg text-green-50/90 leading-relaxed mb-8">
            Manage your wellness journey, connect with practitioners, and track your progress all in one secure place.
          </p>
          
          {/* Testimonial / Stat Card */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
            <div className="flex items-center gap-4">
               <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                   <div key={i} className={`w-10 h-10 rounded-full border-2 border-green-600 bg-green-${i*100} flex items-center justify-center text-xs font-bold text-green-800`}>
                      U{i}
                   </div>
                 ))}
               </div>
               <div>
                 <p className="font-bold">Trusted by Users</p>
                 <p className="text-sm opacity-80">Join our growing community today.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-gradient-to-br from-green-50/50 via-white to-amber-50/30 lg:bg-none">
        
        {/* Mobile-only background blobs to keep the theme */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-10 -right-10 w-60 h-60 bg-green-200/30 rounded-full blur-3xl" />
           <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-200/30 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex bg-green-600 p-2 rounded-xl shadow-lg mb-4">
               <Leaf className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-500">
              Please enter your details to sign in.
            </p>
          </div>

          {/* Feedback Messages */}
          {message.text && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : message.type === 'info'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span className="font-medium pt-0.5">{message.text}</span>
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            
            <div className="space-y-5">
              {/* Email */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all duration-200 sm:text-sm"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all duration-200 sm:text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center">
                    <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer" 
                    />
                </div>
                <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
              </label>

              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline decoration-2 underline-offset-2 transition-all"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-green-600/20 text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
             <div className="flex items-center justify-center gap-1.5 text-sm">
                <span className="text-gray-600">Don't have an account?</span>
                <button 
                    onClick={() => { window.location.href = "/register" }}
                    className="font-bold text-green-600 hover:text-green-700 transition-colors"
                >
                    Create Account
                </button>
             </div>
          </div>
          
          {/* Footer Links */}
           <div className="flex justify-center gap-4 mt-6 text-xs text-gray-400">
                <button className="hover:text-green-600 transition-colors">Privacy</button>
                <span>•</span>
                <button className="hover:text-green-600 transition-colors">Terms</button>
           </div>

        </div>
      </div>
    </div>
  );
};
export default LoginPage;