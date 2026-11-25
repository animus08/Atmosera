import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function KisanSubscription() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    crop: '',
    language: 'Hindi',
    channel: 'WhatsApp',
    trigger_mode: 'alert_only'
  });
  const [status, setStatus] = useState(null); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [lastBulletin, setLastBulletin] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setLastBulletin(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Successfully subscribed to Kisan Alerts!');
        if (data.bulletin) {
          setLastBulletin(data.bulletin);
        }
        // Retain language, channel, and trigger_mode preferences; reset inputs
        setFormData(prev => ({
          ...prev,
          name: '',
          phone: '',
          location: '',
          crop: ''
        }));
      } else {
        throw new Error(data.detail || 'Failed to subscribe');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 animate-enter border-l-4 border-l-green-500 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      
      <div className="mb-6 relative z-10">
        <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Kisan SMS & WhatsApp Alerts
        </h2>
        <p className="text-sm text-[#9ca3af] mt-1">
          Receive daily vernacular weather forecasts, extreme alerts, and crop advisories directly on your phone.
        </p>
      </div>

      {status === 'success' && (
        <div className="mb-6 bg-green-500/20 border border-green-500/40 text-green-300 p-5 rounded-xl text-sm space-y-3 animate-enter">
          <div className="flex items-center space-x-2 font-semibold text-green-400">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            <span>{message}</span>
          </div>

          {lastBulletin && (
            <div className="bg-[#0b0e17]/80 rounded-xl p-3.5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9ca3af]">Localized Alert Bulletin Prepared for:</span>
                <span className="text-[#eab308] font-bold">{lastBulletin.location} ({lastBulletin.crop})</span>
              </div>
              <pre className="text-xs font-mono text-white/90 whitespace-pre-wrap bg-black/40 p-3 rounded-lg border border-white/5 leading-relaxed">
                {lastBulletin.whatsapp_text}
              </pre>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <a
                  href={lastBulletin.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-green-950/40 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                  <span>Open & Send via WhatsApp Now</span>
                </a>
                <span className="text-[11px] text-green-400/90 font-medium flex items-center gap-1">
                  <span>✓ Fast2SMS gateway connected. Automated broadcast triggers on severe warnings.</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 bg-red-500/20 border border-red-500/40 text-red-400 p-4 rounded-xl text-sm font-semibold flex items-center space-x-2 animate-enter">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        
        <div>
          <label className="block text-xs font-bold text-[#9ca3af] mb-1.5 uppercase tracking-wide">Farmer Name</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Ramesh Kumar" className="w-full bg-[#181d2c] border border-white/10 focus:border-green-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all shadow-inner" />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#9ca3af] mb-1.5 uppercase tracking-wide">Phone Number</label>
          <input type="tel" name="phone" required autoComplete="off" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" className="w-full bg-[#181d2c] border border-white/10 focus:border-green-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all shadow-inner" />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#9ca3af] mb-1.5 uppercase tracking-wide">Village / District</label>
          <input type="text" name="location" required value={formData.location} onChange={handleChange} placeholder="e.g. Jaipur" className="w-full bg-[#181d2c] border border-white/10 focus:border-green-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all shadow-inner" />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#9ca3af] mb-1.5 uppercase tracking-wide">Primary Crop</label>
          <input type="text" name="crop" required value={formData.crop} onChange={handleChange} placeholder="e.g. Wheat, Rice, Cotton" className="w-full bg-[#181d2c] border border-white/10 focus:border-green-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all shadow-inner" />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#9ca3af] mb-1.5 uppercase tracking-wide">Language</label>
          <select name="language" value={formData.language} onChange={handleChange} className="w-full bg-[#181d2c] border border-white/10 focus:border-green-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all shadow-inner cursor-pointer">
            <option value="Hindi">Hindi (हिन्दी)</option>
            <option value="English">English</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#9ca3af] mb-1.5 uppercase tracking-wide">Alert Trigger Mode</label>
          <select name="trigger_mode" value={formData.trigger_mode} onChange={handleChange} className="w-full bg-[#181d2c] border border-white/10 focus:border-green-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all shadow-inner cursor-pointer">
            <option value="alert_only">Rainfall & Severe Warnings Only (Location-Specific)</option>
            <option value="daily_digest">Daily Morning Digest + Severe Alerts</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#9ca3af] mb-1.5 uppercase tracking-wide">Notification Channel</label>
          <select name="channel" value={formData.channel} onChange={handleChange} className="w-full bg-[#181d2c] border border-white/10 focus:border-green-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all shadow-inner cursor-pointer">
            <option value="WhatsApp">WhatsApp (Direct Link & Automated Bot)</option>
            <option value="SMS">SMS Text Message</option>
            <option value="Both">Both (WhatsApp + SMS)</option>
          </select>
        </div>

        <div className="md:col-span-2 pt-2">
          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-900/50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? 'Registering...' : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                Subscribe to Alerts
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
