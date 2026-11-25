import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        // Register User in Backend Database
        const res = await fetch(`${API_BASE_URL}/users/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, language: "en" })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.detail || "Registration failed");
        
        // Auto-login after register
        onLoginSuccess(data.user);
        onClose();
      } else {
        // Login User from Backend Database
        const res = await fetch(`${API_BASE_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.detail || "Login failed");
        
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0c0f18] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-enter">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white font-display">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#141926] border border-white/10 focus:border-[#eab308] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#141926] border border-white/10 focus:border-[#eab308] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all"
              placeholder="name@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? "Please wait..." : (isRegister ? "Sign Up" : "Log In")}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#9ca3af]">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-[#eab308] hover:underline font-bold"
          >
            {isRegister ? "Log in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
