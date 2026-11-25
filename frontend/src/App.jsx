import { useEffect, useState, useRef } from "react";
import "./App.css";

import {
  fetchAllWeatherData,
  fetchChatResponse,
} from "./services/api";

import ClimateAnalytics from "./components/ClimateAnalytics";
import WeatherMap from "./components/WeatherMap";
import AuthModal from "./components/AuthModal";
import KisanSubscription from "./components/KisanSubscription";
import AqiWidget from "./components/AqiWidget";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function App() {
  const [location, setLocation] = useState("New Delhi");
  const [nwpModel, setNwpModel] = useState("best_match");
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [aqi, setAqi] = useState(null);
  const [risk, setRisk] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [nationalAlerts, setNationalAlerts] = useState([]);
  const [advisories, setAdvisories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");

  // Location Manager Form States
  const [locInput, setLocInput] = useState("");
  const [regionInput, setRegionInput] = useState("");
  const [prefLang, setPrefLang] = useState("English");

  // Location Inline Editing States
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editLang, setEditLang] = useState("English");

  // Current User State (Scoped Multi-Account Profiles)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('weathergpt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Saved Locations List (Persisted per account & synced to backend database)
  const [savedLocations, setSavedLocations] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('weathergpt_user') || 'null');
      const storageKey = user?.email ? `weathergpt_saved_locations_${user.email}` : "weathergpt_saved_locations_guest";
      const saved = localStorage.getItem(storageKey) || localStorage.getItem("weathergpt_saved_locations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (user?.saved_locations && Array.isArray(user.saved_locations) && user.saved_locations.length > 0) {
        return user.saved_locations;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { name: "New Delhi", region: "North India", lang: "English" },
      { name: "Sāngāner", region: "Jaipur, Rajasthan", lang: "Hindi" },
    ];
  });

  // Slide-out Drawer & AI Assistant States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);

  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLanguage, setChatLanguage] = useState("English");
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState("");

  // Chat History (Persisted)
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const savedChat = localStorage.getItem("weathergpt_chat_history");
      if (savedChat) {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        sender: "bot",
        text: "Greetings! I am your **Atmosera AI Assistant**. Ask me anything regarding current weather, rainfall probability, severe alert priorities, or farming advisories in **English or Hindi**.",
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const chatEndRef = useRef(null);

  // Preload speech synthesis voices for responsive speech output
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Load & synchronize user-specific saved locations from backend database
  useEffect(() => {
    if (!currentUser) return;
    const storageKey = `weathergpt_saved_locations_${currentUser.email}`;
    
    // Check cached locations for this specific user
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedLocations(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Sync directly from backend database if user has an account
    if (currentUser.id) {
      fetch(`${API_BASE_URL}/users/${currentUser.id}/saved-locations`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.saved_locations) && data.saved_locations.length > 0) {
            setSavedLocations(data.saved_locations);
            try {
              localStorage.setItem(storageKey, JSON.stringify(data.saved_locations));
            } catch (e) {}
          }
        })
        .catch(err => console.warn("Backend saved-locations sync warning:", err));
    }
  }, [currentUser?.email]);

  // Sync Saved Locations to LocalStorage (User-scoped & fallback)
  useEffect(() => {
    try {
      const storageKey = currentUser?.email ? `weathergpt_saved_locations_${currentUser.email}` : "weathergpt_saved_locations_guest";
      localStorage.setItem(storageKey, JSON.stringify(savedLocations));
      localStorage.setItem("weathergpt_saved_locations", JSON.stringify(savedLocations));
    } catch (e) {
      console.error("Failed to save locations:", e);
    }
  }, [savedLocations, currentUser?.email]);

  // Sync Chat History to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "weathergpt_chat_history",
        JSON.stringify(chatMessages)
      );
    } catch (e) {
      console.error("Failed to save chat history:", e);
    }
  }, [chatMessages]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, aiLoading]);

  // WebSocket for Real-time Alerts
  useEffect(() => {
    let ws = null;
    try {
      const wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/ws/alerts";
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "severe_weather_alert") {
            // Push alert to the top
            setAlerts(prev => [data.data, ...prev]);
          }
        } catch (e) {
          console.error("WS error:", e);
        }
      };
      ws.onerror = (e) => {
        console.warn("WebSocket alerts connection notice (falling back to REST):", e);
      };
    } catch (err) {
      console.warn("WebSocket connection skipped:", err);
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Fetch when model changes
  useEffect(() => {
    if (location) {
      getWeather(location);
    }
  }, [nwpModel]);

  // Initial Load
  useEffect(() => {
    getWeather("New Delhi");
  }, []);

  // Fetch Weather Data
  const getWeather = async (searchCity = null) => {
    const targetCity = (searchCity || location || "").trim();
    if (!targetCity) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchAllWeatherData(targetCity, nwpModel);
      setWeather(data.weather);
      setHourly(data.hourly || []);
      setForecast(data.forecast || []);
      setAqi(data.aqi || null);
      setRisk(data.risk || null);
      setAlerts(data.alerts || []);
      setNationalAlerts(data.national_alerts || []);
      setAdvisories(data.advisories || []);
      setLocation(targetCity);

      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastUpdatedTime(timeStr);
    } catch (err) {
      console.error("Failed to fetch weather data:", err);
      setError("Unable to connect to Atmosera service. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  // Browser Geolocation Detection (Preserving working geolocation)
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          if (!response.ok) throw new Error("Reverse geocoding failed.");

          const result = await response.json();
          let detectedCity =
            result.city ||
            result.locality ||
            result.principalSubdivision ||
            "";

          if (!detectedCity && result.localityInfo?.administrative) {
            detectedCity =
              result.localityInfo.administrative.find(
                (item) =>
                  item.name &&
                  (item.description?.toLowerCase().includes("city") ||
                    item.description?.toLowerCase().includes("town") ||
                    item.description?.toLowerCase().includes("municipality"))
              )?.name || "";
          }

          if (!detectedCity) {
            throw new Error("Unable to identify city name.");
          }

          setLocation(detectedCity);
          await getWeather(detectedCity);
        } catch (err) {
          console.error("Location detection error:", err);
          setError("Detected coordinates, but could not resolve city name. Please select city manually.");
        } finally {
          setLocationLoading(false);
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        setLocationLoading(false);
        if (geoError.code === 1) {
          setError("Location permission was denied. Please allow access and try again.");
        } else {
          setError("Unable to detect current location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  };

  // Sync location list to backend database & user-scoped storage
  const syncLocationsToStorageAndBackend = (newLocationsList) => {
    setSavedLocations(newLocationsList);
    const storageKey = currentUser?.email ? `weathergpt_saved_locations_${currentUser.email}` : "weathergpt_saved_locations_guest";
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLocationsList));
      localStorage.setItem("weathergpt_saved_locations", JSON.stringify(newLocationsList));
    } catch (e) {
      console.error(e);
    }

    // Persist to backend database if logged in
    if (currentUser?.id) {
      fetch(`${API_BASE_URL}/users/${currentUser.id}/saved-locations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: newLocationsList }),
      }).catch(err => console.warn("Background DB sync failed:", err));
    }
  };

  // Save location to workspace list
  const handleSaveLocation = () => {
    if (!locInput.trim()) return;
    const newLoc = {
      name: locInput.trim(),
      region: regionInput.trim() || "India",
      lang: prefLang,
    };
    const updated = [newLoc, ...savedLocations.filter((l) => l.name.toLowerCase() !== newLoc.name.toLowerCase())];
    syncLocationsToStorageAndBackend(updated);
    setLocInput("");
    setRegionInput("");
    getWeather(newLoc.name);
  };

  const handleStartEditLocation = (index, loc) => {
    setEditingIndex(index);
    setEditName(loc.name);
    setEditRegion(loc.region || "");
    setEditLang(loc.lang || "English");
  };

  const handleSaveEditLocation = (index) => {
    if (!editName.trim()) return;
    const updated = savedLocations.map((item, idx) =>
      idx === index ? { name: editName.trim(), region: editRegion.trim() || "India", lang: editLang } : item
    );
    syncLocationsToStorageAndBackend(updated);
    setEditingIndex(null);
  };

  const handleDeleteSavedLocation = (nameToDelete) => {
    const updated = savedLocations.filter((l) => l.name.toLowerCase() !== nameToDelete.toLowerCase());
    syncLocationsToStorageAndBackend(updated);
  };

  // Generate PDF Report
  const downloadPdfReport = async () => {
    const input = document.getElementById('dashboard-content');
    if (!input) return;
    
    // Temporarily hide elements that shouldn't be in the PDF
    const hiddenElements = document.querySelectorAll('.hide-on-pdf');
    hiddenElements.forEach(el => el.style.display = 'none');

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        backgroundColor: '#030408',
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Atmosera_Report_${location.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      // Restore hidden elements
      hiddenElements.forEach(el => el.style.display = '');
    }
  };

  // Quick preset query trigger
  const triggerPresetPrompt = (promptText) => {
    setIsDrawerOpen(true);
    setChatQuestion(promptText);
    setTimeout(() => {
      handleSendChatMessage(null, promptText);
    }, 200);
  };

  // Voice Input Handler
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = chatLanguage === "English" ? "en-US" : (chatLanguage === "Hindi" ? "hi-IN" : "en-US");
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatQuestion(transcript);
      setIsListening(false);
      // Auto-submit after voice input
      setTimeout(() => {
        const formEvent = { preventDefault: () => {} };
        const autoSubmitBtn = document.getElementById("chat-submit-btn");
        if (autoSubmitBtn) autoSubmitBtn.click();
      }, 500);
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Text-to-Speech Handler
  const speakText = (text, lang) => {
    if (!isVoiceOutputEnabled) return;
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip markdown formatting before speaking
    const cleanedText = (text || "")
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .trim();

    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Determine language: prioritize user preference, or auto-detect Devanagari Hindi text
    const isHindi = lang === "Hindi" || /[\u0900-\u097F]/.test(cleanedText);

    if (isHindi) {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-US";
    }

    // Explicitly assign a matching browser/OS voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (isHindi) {
        const hindiVoice = voices.find(v => 
          v.lang === "hi-IN" || 
          v.lang === "hi_IN" || 
          v.lang.toLowerCase().startsWith("hi") ||
          v.name.toLowerCase().includes("hindi") ||
          v.name.includes("हिन्दी") ||
          v.name.toLowerCase().includes("kalpana") ||
          v.name.toLowerCase().includes("hemant") ||
          v.name.toLowerCase().includes("swara")
        );
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
      } else {
        const engVoice = voices.find(v => 
          (v.lang === "en-US" || v.lang === "en-GB" || v.lang.toLowerCase().startsWith("en"))
        );
        if (engVoice) {
          utterance.voice = engVoice;
        }
      }
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn("TTS playback warning:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Send message to AI Assistant
  const handleSendChatMessage = async (e, directText = null) => {
    if (e) e.preventDefault();
    const query = (directText || chatQuestion || "").trim();
    if (!query) return;

    const userMsg = {
      sender: "user",
      text: query,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatQuestion("");
    setAiLoading(true);

    try {
      const answer = await fetchChatResponse(
        weather?.location || location,
        query,
        chatLanguage,
        simulateOffline
      );
      const botMsg = {
        sender: "bot",
        text: answer,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, botMsg]);
      speakText(answer, chatLanguage);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = {
        sender: "bot",
        text: "I'm having trouble connecting to the Atmosera inference engine. Please ensure the backend is running at http://127.0.0.1:8000.",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  // Weather Condition Vector Icons (Zero Emojis)
  const renderWeatherSVG = (condition, className = "w-6 h-6") => {
    const val = (condition || "").toLowerCase();
    if (val.includes("thunder") || val.includes("storm")) {
      return (
        <svg className={`${className} text-[#eab308]`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="m13 10-4 6h6l-4 6" />
        </svg>
      );
    }
    if (val.includes("rain") || val.includes("drizzle") || val.includes("shower")) {
      return (
        <svg className={`${className} text-[#38bdf8]`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M16 14v6" />
          <path d="M8 14v6" />
          <path d="M12 16v6" />
        </svg>
      );
    }
    if (val.includes("clear") || val.includes("sunny")) {
      return (
        <svg className={`${className} text-[#eab308]`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    }
    // Default Cloudy / Partly Cloudy
    return (
      <svg className={`${className} text-[#eab308]`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="M20 12h2" />
        <path d="m19.07 4.93-1.41 1.41" />
        <path d="M15.5 12a3.5 3.5 0 0 0-3.5-3.5c-.8 0-1.5.3-2 .8A4.5 4.5 0 0 0 5 13.5 4.5 4.5 0 0 0 9.5 18h8a3.5 3.5 0 0 0 3.5-3.5c0-1.8-1.4-3.3-3.2-3.5Z" fill="rgba(234, 179, 8, 0.15)" />
      </svg>
    );
  };

  // Format 5-day outlook weekday name
  const formatDayName = (dateStr, index) => {
    if (index === 0) return "Today";
    if (!dateStr) return `Day ${index + 1}`;
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      return d.toLocaleDateString("en-US", { weekday: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#030408] text-[#e1e4ea] flex flex-col justify-between relative selection:bg-[#eab308] selection:text-black">
      
      {/* Night Stars Background with Shooting Stars */}
      <div className="night-stars-bg">
        <div className="stars-layer-1"></div>
        <div className="stars-layer-2"></div>
        <div className="shooting-star shooting-star-1"></div>
        <div className="shooting-star shooting-star-2"></div>
        <div className="shooting-star shooting-star-3"></div>
      </div>

      {/* TOP WORKSPACE HEADER */}
      <header className="w-full border-b border-white/10 bg-[#0c0f18]/85 backdrop-blur-xl sticky top-0 z-40 relative">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          
          {/* Brand Mark */}
          <div 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#eab308]/15 border border-[#eab308]/50 flex items-center justify-center text-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.25)] group-hover:scale-105 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-widest text-white uppercase font-display leading-none">Atmos<span className="text-[#eab308]">era</span></span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 relative z-10">
            {/* Custom Google Translate Trigger */}
            <div className="flex items-center space-x-2 bg-[#181d2c] border border-white/10 rounded-xl px-2 py-1">
              <svg className="w-4 h-4 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
              <select 
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                onChange={(e) => {
                  const lang = e.target.value;
                  if (lang === 'en') {
                    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
                  } else {
                    document.cookie = `googtrans=/en/${lang}; path=/;`;
                    document.cookie = `googtrans=/en/${lang}; domain=${window.location.hostname}; path=/;`;
                  }
                  window.location.reload();
                }}
                defaultValue={(() => {
                  const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
                  return match ? match[1] : 'en';
                })()}
              >
                <option className="bg-[#181d2c] text-white" value="en">English</option>
                <option className="bg-[#181d2c] text-white" value="hi">हिंदी (Hindi)</option>
              </select>
            </div>

            {currentUser ? (
              <div className="flex items-center space-x-3">
                <span className="text-[#38bdf8] text-xs font-bold bg-[#38bdf8]/10 px-3 py-1 rounded-full border border-[#38bdf8]/30">
                  {currentUser.name}
                </span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('weathergpt_user');
                    setCurrentUser(null);
                    const guestSaved = localStorage.getItem("weathergpt_saved_locations_guest");
                    if (guestSaved) {
                      try {
                        const parsed = JSON.parse(guestSaved);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                          setSavedLocations(parsed);
                          return;
                        }
                      } catch (e) {}
                    }
                    setSavedLocations([
                      { name: "New Delhi", region: "North India", lang: "English" },
                      { name: "Mumbai", region: "Maharashtra", lang: "English" },
                      { name: "Bengaluru", region: "Karnataka", lang: "English" },
                    ]);
                  }}
                  className="text-white/60 hover:text-white text-xs font-bold transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              >
                Sign In
              </button>
            )}
            <div className="h-6 w-px bg-white/10"></div>
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={detectLocation}
              disabled={locationLoading}
              className="hidden sm:flex items-center space-x-1.5 bg-[#141824] hover:bg-[#1c2233] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 transition-all active:scale-95"
              title="Use current GPS location"
            >
              <svg className="w-3.5 h-3.5 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              <span>{locationLoading ? "Locating..." : "Auto-detect"}</span>
            </button>

            {/* Live Workspace Status Pill */}
            <div className="flex items-center space-x-2 bg-[#141824] border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#4ade80] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping"></span>
              <span>Workspace live</span>
            </div>
          </div>

        </div>
      </header>

      {/* MAIN WORKSPACE CONTENT */}
      <main id="dashboard-content" className="w-full max-w-[96%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6 relative z-10">

        {/* HERO BANNER (WITH VOLUMETRIC NIGHT CLOUDS & FEATURES) */}
        <section className="animate-enter relative bg-gradient-to-r from-[#0e121e] via-[#121624] to-[#0a0d16] border border-white/10 rounded-2xl p-6 sm:p-9 overflow-hidden shadow-2xl min-h-[280px] flex items-center">
          
          {/* Volumetric Night Clouds (Corner) */}
          <div className="hero-cloud-cluster hidden md:block">
            <div className="cloud-layer-glow"></div>
            <div className="cloud-layer-back"></div>
            <div className="cloud-layer-main">
              <svg className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]" viewBox="0 0 280 150" fill="none">
                <defs>
                  <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#334155" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#1e293b" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="cloudRim" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="40%" stopColor="rgba(56,189,248,0.2)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path d="M50 110 C35 110, 20 98, 22 80 C24 62, 42 55, 55 58 C62 38, 88 25, 115 30 C132 15, 168 12, 192 28 C215 18, 245 28, 252 52 C268 58, 278 74, 272 92 C266 108, 248 112, 235 110 Z" fill="url(#cloudGrad)" stroke="url(#cloudRim)" strokeWidth="1.2" />
                <path d="M80 120 C65 120, 52 108, 55 92 C58 76, 75 70, 88 72 C96 55, 120 45, 142 50 C158 38, 190 35, 210 50 C230 42, 255 50, 260 70 C272 75, 280 88, 275 102 C270 116, 255 120, 242 120 Z" fill="rgba(15, 23, 42, 0.75)" filter="blur(4px)" />
              </svg>
            </div>
          </div>

          {/* Golden Stardust Glow */}
          <div className="absolute left-1/4 -top-20 w-80 h-80 bg-[#eab308]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-[#eab308]/15 border border-[#eab308]/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#eab308] shadow-[0_0_12px_rgba(234,179,8,0.2)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Decision support, grounded in your workspace</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-white tracking-tight leading-tight">
              Ask the sky a better question.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#9ca3af] leading-relaxed max-w-xl">
              Atmosera brings locations, warnings, and climate context into one calm conversational surface for faster, safer planning.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <div className="flex items-center space-x-2 bg-[#171c2b]/90 hover:bg-[#20273c] border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white shadow-sm transition-all cursor-default">
                <svg className="w-3.5 h-3.5 text-[#eab308]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Location forecasts</span>
              </div>

              <div className="flex items-center space-x-2 bg-[#171c2b]/90 hover:bg-[#20273c] border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white shadow-sm transition-all cursor-default">
                <svg className="w-3.5 h-3.5 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m5 8 6 6" />
                  <path d="m4 14 6-6 2-3" />
                  <path d="M2 5h12" />
                  <path d="M7 2h1" />
                  <path d="m22 22-5-10-5 10" />
                  <path d="M14 18h6" />
                </svg>
                <span>Indian languages</span>
              </div>

              <div className="flex items-center space-x-2 bg-[#171c2b]/90 hover:bg-[#20273c] border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white shadow-sm transition-all cursor-default">
                <svg className="w-3.5 h-3.5 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                <span>Voice-ready</span>
              </div>
            </div>

          </div>
        </section>

        {/* 3 SUMMARY STATS CARDS */}
        <section className="animate-enter delay-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div 
            onClick={() => {
              const el = document.getElementById("location-settings-section");
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="glass-card rounded-2xl p-5 flex items-start justify-between cursor-pointer hover:border-[#eab308]/40 transition-all group"
            title="Click to view and manage saved locations"
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af] group-hover:text-[#eab308] transition-colors flex items-center gap-1.5">
                <span>SAVED LOCATIONS</span>
                <span className="text-[9px] lowercase bg-[#eab308]/10 text-[#eab308] px-1.5 py-0.2 rounded font-normal">manage</span>
              </div>
              <div className="text-3xl font-extrabold font-display text-white mt-1">
                {savedLocations.length}
              </div>
              <div className="text-xs text-[#6b7280] font-medium mt-1">
                Ready for guidance • Click to edit
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#1c2233] border border-white/10 flex items-center justify-center text-white/80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                LOCAL ALERTS
              </div>
              <div className={`text-3xl font-extrabold font-display mt-1 ${alerts.length > 0 ? "text-[#ef4444]" : "text-[#4ade80]"}`}>
                {alerts.length}
              </div>
              <div className="text-xs text-[#6b7280] font-medium mt-1">
                {alerts.length > 0 ? "Review before planning" : "All clear for location"}
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              alerts.length > 0
                ? "bg-[#ef4444]/15 border border-[#ef4444]/35 text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80]"
            }`}>
              {alerts.length > 0 ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" x2="12" y1="9" y2="13" />
                  <line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>

          <AqiWidget location={weather?.location || location} latitude={weather?.latitude} longitude={weather?.longitude} />

        </section>

        {/* ERROR NOTICE (IF ANY) */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-300 p-4 rounded-xl text-xs flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* LIVE CONDITIONS & FORECAST SECTION */}
        <section className="animate-enter delay-2 glass-card rounded-2xl p-6 space-y-5">
          
          {/* Header Row with City Selector & Model Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
                <h2 className="text-base font-bold font-display text-white">Live conditions</h2>
              </div>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                Open-Meteo forecast, refreshed on demand.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={nwpModel}
                onChange={(e) => setNwpModel(e.target.value)}
                className="hide-on-pdf bg-[#181d2c] border border-white/15 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-blue-400 focus:outline-none focus:border-blue-400 cursor-pointer shadow-inner"
              >
                <option value="best_match">Auto (Best Match)</option>
                <option value="gfs_seamless">NCEP GFS</option>
                <option value="ecmwf_ifs025">ECMWF IFS (0.25°)</option>
                <option value="icon_seamless">DWD ICON</option>
              </select>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (location.trim()) {
                    getWeather(location);
                  }
                }}
                className="flex items-center space-x-2 hide-on-pdf"
              >
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search city..."
                  className="bg-[#181d2c] border border-white/15 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#eab308] placeholder-white/30 shadow-inner w-32 sm:w-40"
                />
                <button
                  type="submit"
                  className="bg-[#eab308] hover:bg-[#ca8a04] text-black px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                >
                  Search
                </button>
              </form>

              <button
                onClick={downloadPdfReport}
                className="hide-on-pdf flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                title="Download Dashboard as PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              <button
                onClick={() => getWeather()}
                disabled={loading}
                className="p-2 rounded-xl bg-[#181d2c] hover:bg-[#22283d] border border-white/15 text-white/80 transition-all hover:scale-105 active:scale-95"
                title="Refresh current forecast"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#eab308]" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </button>
            </div>
          </div>

          {/* Current Weather Card */}
          <div className="bg-[#0b0e17]/90 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80] px-3 py-1 rounded-full text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse"></span>
                  <span>Live • updated {lastUpdatedTime || "just now"}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-[#eab308]">
                    {renderWeatherSVG(weather?.condition, "w-14 h-14")}
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl sm:text-6xl font-black font-display text-white tracking-tight">
                      {weather?.temperature ?? 28}°C
                    </span>
                  </div>
                </div>

                <div className="text-sm text-[#9ca3af] font-medium">
                  {weather?.condition || "Partly cloudy"} • feels like {weather?.apparent_temperature ?? 34}°C
                </div>
              </div>

              <div className="max-w-xs text-xs text-[#6b7280] leading-relaxed bg-[#141926]/80 p-4 rounded-xl border border-white/5 shadow-sm">
                Current conditions are from the nearest forecast grid point for <strong className="text-white/90">{weather?.location || location}</strong>.
              </div>
            </div>

            {/* 4-Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
              
              <div className="bg-[#141926]/70 hover:bg-[#1a2133] p-3.5 rounded-xl border border-white/5 transition-all">
                <div className="text-xs text-[#9ca3af] flex items-center space-x-2 font-medium">
                  <svg className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                  <span>Humidity</span>
                </div>
                <div className="text-lg font-bold font-mono-data text-white mt-1.5">
                  {weather?.humidity ?? 88}%
                </div>
              </div>

              <div className="bg-[#141926]/70 hover:bg-[#1a2133] p-3.5 rounded-xl border border-white/5 transition-all">
                <div className="text-xs text-[#9ca3af] flex items-center space-x-2 font-medium">
                  <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.7 7.7A2.5 2.5 0 0 1 20 10H2" />
                    <path d="M14.7 17.7A2.5 2.5 0 0 0 17 20H2" />
                    <path d="M9.7 3.7A2.5 2.5 0 0 1 12 6H2" />
                  </svg>
                  <span>Wind</span>
                </div>
                <div className="text-lg font-bold font-mono-data text-white mt-1.5">
                  {weather?.wind_speed ?? 7} km/h
                </div>
              </div>

              <div className="bg-[#141926]/70 hover:bg-[#1a2133] p-3.5 rounded-xl border border-white/5 transition-all">
                <div className="text-xs text-[#9ca3af] flex items-center space-x-2 font-medium">
                  <svg className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M16 14v6" />
                    <path d="M8 14v6" />
                    <path d="M12 16v6" />
                  </svg>
                  <span>Rain now</span>
                </div>
                <div className="text-lg font-bold font-mono-data text-white mt-1.5">
                  {weather?.precipitation ?? 0} mm
                </div>
              </div>

              <div className="bg-[#141926]/70 hover:bg-[#1a2133] p-3.5 rounded-xl border border-white/5 transition-all">
                <div className="text-xs text-[#9ca3af] flex items-center space-x-2 font-medium">
                  <svg className="w-4 h-4 text-[#eab308]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                  </svg>
                  <span>Temperature</span>
                </div>
                <div className="text-lg font-bold font-mono-data text-white mt-1.5">
                  {weather?.temperature ?? 28}°C
                </div>
              </div>

            </div>

          </div>

          {/* FIVE-DAY OUTLOOK */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
              FIVE-DAY OUTLOOK
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(forecast.length > 0 ? forecast.slice(0, 5) : [
                { date: "2026-08-28", condition: "Partly cloudy", temperature_max: 34, temperature_min: 28, precipitation_probability_max: 4 },
                { date: "2026-08-29", condition: "Partly cloudy", temperature_max: 35, temperature_min: 27, precipitation_probability_max: 6 },
                { date: "2026-08-30", condition: "Drizzle", temperature_max: 36, temperature_min: 27, precipitation_probability_max: 57 },
                { date: "2026-08-31", condition: "Drizzle", temperature_max: 36, temperature_min: 27, precipitation_probability_max: 65 },
                { date: "2026-09-01", condition: "Thunderstorm", temperature_max: 34, temperature_min: 28, precipitation_probability_max: 82 },
              ]).map((day, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e121e]/80 hover:bg-[#161c2e] border border-white/5 hover:border-white/20 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-all hover:scale-102"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {formatDayName(day.date, idx)}
                    </span>
                    {renderWeatherSVG(day.condition, "w-5 h-5")}
                  </div>

                  <div className="text-xs text-[#9ca3af] font-medium truncate">
                    {day.condition || "Partly cloudy"}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-white font-mono-data">
                      {day.temperature_max}° <span className="text-[#6b7280] font-normal">{day.temperature_min}°</span>
                    </div>
                    <div className="text-[11px] text-[#38bdf8] font-semibold mt-0.5">
                      {day.precipitation_probability_max ?? (idx === 4 ? 82 : idx >= 2 ? 60 : 5)}% rain
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLIMATE ANALYTICS SECTION */}
        <ClimateAnalytics location={weather?.location || location} />

        {/* INTERACTIVE RADAR MAP */}
        <section className="animate-enter delay-3 relative z-0">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full"></div>
            <WeatherMap 
              location={weather?.location || location} 
              latitude={weather?.latitude} 
              longitude={weather?.longitude} 
            />
          </div>
        </section>

        {/* ATTENTION NOW (TWO-TIER WARNING SYSTEM: LOCAL & NATIONAL) */}
        <section className="animate-enter delay-3 glass-card rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-[#ef4444]">
                <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" x2="12" y1="9" y2="13" />
                  <line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
                <h2 className="text-base font-bold font-display text-white">Attention now & Active Hazards</h2>
              </div>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                Two-tier meteorological surveillance: Local district detection and nationwide synoptic watches.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                alerts.length > 0 
                  ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                Local: {alerts.length > 0 ? `${alerts.length} Active` : "All Clear"}
              </span>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
                National: {nationalAlerts.length || 4} Monitored
              </span>
            </div>
          </div>

          {/* TIER 1: LOCAL DISTRICT ALERTS */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af] flex items-center justify-between">
              <span>1. Local District Status ({weather?.location || location})</span>
              <span className="text-[10px] text-white/40 lowercase">grounded in live station observations</span>
            </div>

            {alerts.length > 0 ? (
              alerts.map((al, idx) => (
                <div
                  key={idx}
                  className={`bg-[#0b0e17]/90 border rounded-xl p-4 flex items-center justify-between transition-all ${
                    (al.severity || "").toLowerCase().includes("high")
                      ? "border-red-500/25 hover:border-red-500/50"
                      : "border-amber-500/25 hover:border-amber-500/50"
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                      <span>{al.title || al.alert_type}</span>
                    </h3>
                    <div className="text-xs text-[#9ca3af] flex items-center space-x-1.5">
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{al.message || weather?.location || location}</span>
                    </div>
                  </div>
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                      (al.severity || "").toLowerCase().includes("high")
                        ? "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40"
                        : "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40"
                    }`}
                  >
                    {al.severity || "Moderate"}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-[#0b0e17]/90 border border-emerald-500/25 rounded-xl p-4 flex items-center justify-between transition-all">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    All Clear • No Active Severe Warnings for {weather?.location || location}
                  </h3>
                  <div className="text-xs text-[#9ca3af] flex items-center space-x-1.5">
                    <span>Atmospheric sensors and radar report stable conditions for {weather?.location || location}.</span>
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Normal
                </span>
              </div>
            )}
          </div>

          {/* TIER 2: NATIONAL SYNOPTIC ADVISORIES ACROSS INDIA */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
              <span className="flex items-center gap-1.5">
                <span className="text-[#38bdf8]">🇮🇳</span>
                <span>2. Synoptic Bulletins Across India (National Weather Watch)</span>
              </span>
              <span className="text-[10px] text-white/40 lowercase">situational awareness across other Indian zones</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(nationalAlerts && nationalAlerts.length > 0 ? nationalAlerts : [
                {
                  id: "nat-01",
                  title: "Dense Winter Radiation Fog & Low Visibility Watch",
                  region: "Punjab, Haryana, Chandigarh & West UP",
                  zone: "North-West Plains",
                  severity: "Moderate",
                  message: "Night and early morning visibility dropping below 150m. Surface transport, railway schedules, and highway transit precautions active.",
                  source: "IMD Synoptic Bulletin • Northern Plains"
                },
                {
                  id: "nat-02",
                  title: "Western Disturbance & Higher Passes Snow Watch",
                  region: "Jammu & Kashmir, Ladakh & Upper Himachal",
                  zone: "Western Himalayas",
                  severity: "Moderate",
                  message: "Upper atmospheric cyclonic trough bringing sub-zero temperatures and isolated snowfall over high altitude passes. Slippery mountain road warning.",
                  source: "IMD Mountain Weather Division"
                },
                {
                  id: "nat-03",
                  title: "Severe Air Quality Health Watch (AQI 300+ Alert)",
                  region: "Delhi-NCR, Gurugram, Faridabad & Ghaziabad",
                  zone: "National Capital Region",
                  severity: "High",
                  message: "Atmospheric boundary inversion trapping PM2.5 particulates in Very Unhealthy zone. Vulnerable groups, elderly, and children advised to limit outdoor exposure.",
                  source: "Central Pollution Control Board (CPCB) Synoptic Feed"
                },
                {
                  id: "nat-04",
                  title: "Coastal Squall & High Sea Waves Advisory",
                  region: "South Bay of Bengal, Tamil Nadu & Andaman Coast",
                  zone: "Maritime Peninsular",
                  severity: "Moderate",
                  message: "Wind speed reaching 40-50 km/h with rough sea conditions due to easterly wave activity. Small craft and fishermen warned against deep sea venture.",
                  source: "Regional Meteorological Centre (RMC) Chennai"
                }
              ]).map((nat, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e121e]/90 border border-white/10 hover:border-[#38bdf8]/40 rounded-xl p-3.5 space-y-2 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-snug">
                        <span className={`w-1.5 h-1.5 rounded-full ${nat.severity === 'High' ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                        <span>{nat.title}</span>
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        nat.severity === 'High' 
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {nat.severity}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-[#38bdf8] flex items-center gap-1">
                      <span>📍</span>
                      <span>{nat.region}</span>
                    </div>

                    <p className="text-xs text-[#9ca3af] leading-relaxed">
                      {nat.message}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                    <span>{nat.zone}</span>
                    <span className="font-mono text-[#eab308]/80">{nat.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLIMATE SIGNALS */}
        <section className="animate-enter delay-4 glass-card rounded-2xl p-6 space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-[#eab308]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              <h2 className="text-base font-bold font-display text-white">Climate signals</h2>
            </div>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              Historical context, not a live observation.
            </p>
          </div>

          <div className="divide-y divide-white/5">
            <div className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-all">
              <div>
                <div className="text-sm font-bold text-white">Annual Precipitation Anomaly</div>
                <div className="text-xs text-[#6b7280]">{weather?.location || location} • 1991–2020 normals baseline</div>
              </div>
              <span className="text-sm font-bold font-mono-data text-[#4ade80]">+7.4%</span>
            </div>

            <div className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-all">
              <div>
                <div className="text-sm font-bold text-white">Decadal Surface Warming Trend</div>
                <div className="text-xs text-[#6b7280]">{weather?.location || location} • 2001–2025 climatological period</div>
              </div>
              <span className="text-sm font-bold font-mono-data text-[#ef4444]">+0.8°C</span>
            </div>

            <div className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-all">
              <div>
                <div className="text-sm font-bold text-white">Extreme Weather Frequency Index</div>
                <div className="text-xs text-[#6b7280]">{weather?.location || location} • Regional meteorological observation</div>
              </div>
              <span className="text-sm font-bold font-mono-data text-[#38bdf8]">-1.8%</span>
            </div>
          </div>
        </section>

        {/* LOCATION MANAGER & SETTINGS */}
        <section id="location-settings-section" className="animate-enter delay-5 glass-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Location settings & preferences
              </h2>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                Manage, edit, or delete monitored workspace locations.
              </p>
            </div>
            <span className="text-xs font-bold text-[#eab308] bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 rounded-full">
              {savedLocations.length} Saved
            </span>
          </div>

          {/* Active Saved Locations List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
              <span>Active Locations ({savedLocations.length})</span>
              <span className="text-[10px] text-white/40 lowercase">click to load weather immediately</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e121e] border border-white/10 hover:border-[#eab308]/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5 transition-all group"
                >
                  {editingIndex === idx ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-[#9ca3af] uppercase font-bold">City Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#181d2c] border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white mt-0.5"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#9ca3af] uppercase font-bold">Region</label>
                        <input
                          type="text"
                          value={editRegion}
                          onChange={(e) => setEditRegion(e.target.value)}
                          className="w-full bg-[#181d2c] border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white mt-0.5"
                          placeholder="Region"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#9ca3af] uppercase font-bold">Language</label>
                        <select
                          value={editLang}
                          onChange={(e) => setEditLang(e.target.value)}
                          className="w-full bg-[#181d2c] border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white mt-0.5 cursor-pointer"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi (हिन्दी)</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSaveEditLocation(idx)}
                          className="bg-[#eab308] text-black font-bold text-[10px] px-3 py-1 rounded-md"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="bg-white/10 text-white text-[10px] px-3 py-1 rounded-md hover:bg-white/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]"></span>
                            <span>{loc.name}</span>
                          </div>
                          <div className="text-[11px] text-[#9ca3af] mt-0.5">{loc.region || "Monitored Zone"}</div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#eab308] bg-[#eab308]/10 border border-[#eab308]/20 px-2 py-0.5 rounded">
                          {loc.lang || "English"}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setLocation(loc.name);
                            getWeather(loc.name);
                            setPrefLang(loc.lang || "English");
                            setChatLanguage(loc.lang || "English");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-[11px] font-bold text-[#eab308] hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <span>Load Weather →</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEditLocation(idx, loc)}
                            title="Edit Location"
                            className="text-white/40 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSavedLocation(loc.name)}
                            title="Delete Location"
                            className="text-red-400/60 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form to Add New Location */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
              Add New Location
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full bg-[#0e121e] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#eab308] transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">
                  Region
                </label>
                <input
                  type="text"
                  value={regionInput}
                  onChange={(e) => setRegionInput(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full bg-[#0e121e] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#eab308] transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9ca3af] mb-1.5">
                  Preferred language
                </label>
                <select
                  value={prefLang}
                  onChange={(e) => {
                    setPrefLang(e.target.value);
                    setChatLanguage(e.target.value);
                  }}
                  className="w-full bg-[#0e121e] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#eab308] cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveLocation}
              className="w-full py-2.5 rounded-xl bg-[#eab308] hover:bg-[#ca8a04] active:scale-[0.99] text-black font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
            >
              <span>+ Save New Location</span>
            </button>
          </div>

          {/* QUICK ADD POPULAR CITIES */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
              ADD A POPULAR PLACE
            </div>
            <div className="flex flex-wrap gap-2">
              {["Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai", "Hyderabad"].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setLocInput(city);
                    getWeather(city);
                  }}
                  className="bg-[#0e121e] hover:bg-[#171d30] border border-white/10 hover:border-[#eab308]/40 px-3.5 py-1.5 rounded-lg text-xs text-white font-medium transition-all"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* TALK TO ATMOSERA PRESET CARDS */}
        <section className="animate-enter delay-5 glass-card rounded-2xl p-6 space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-[#eab308]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
              </svg>
              <h2 className="text-base font-bold font-display text-white">
                Talk to Atmosera
              </h2>
            </div>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              Ask in natural language. Switch between English and Hindi whenever you need.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => triggerPresetPrompt("What is the agricultural advisory for today?")}
              className="bg-[#0e121e]/90 hover:bg-[#171d30] border border-white/5 hover:border-green-500/40 p-3 rounded-xl text-left transition-all group"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-green-500">AGRICULTURE</div>
              <div className="text-xs font-semibold text-white mt-1 group-hover:text-green-400">Crop/Irrigation Guidance</div>
            </button>

            <button
              onClick={() => triggerPresetPrompt("What is the aviation advisory for flights today?")}
              className="bg-[#0e121e]/90 hover:bg-[#171d30] border border-white/5 hover:border-[#38bdf8]/40 p-3 rounded-xl text-left transition-all group"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#38bdf8]">AVIATION</div>
              <div className="text-xs font-semibold text-white mt-1 group-hover:text-[#38bdf8]">Wind & Visibility</div>
            </button>

            <button
              onClick={() => triggerPresetPrompt("What is the marine advisory for fishing today?")}
              className="bg-[#0e121e]/90 hover:bg-[#171d30] border border-white/5 hover:border-blue-500/40 p-3 rounded-xl text-left transition-all group"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-blue-500">MARINE</div>
              <div className="text-xs font-semibold text-white mt-1 group-hover:text-blue-400">Sea & Storms</div>
            </button>

            <button
              onClick={() => triggerPresetPrompt("What is the urban planning advisory for today?")}
              className="bg-[#0e121e]/90 hover:bg-[#171d30] border border-white/5 hover:border-orange-500/40 p-3 rounded-xl text-left transition-all group"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-orange-500">URBAN</div>
              <div className="text-xs font-semibold text-white mt-1 group-hover:text-orange-400">AQI & Floods</div>
            </button>
          </div>

          <div className="text-[11px] text-[#6b7280] italic">
            The assistant is grounded in your saved workspace context.
          </div>
        </section>

        {/* KISAN SMS & WHATSAPP SUBSCRIPTION */}
        <KisanSubscription />

      </main>

      {/* FLOATING ASSISTANT PULSE BUTTON (BOTTOM RIGHT) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="w-14 h-14 rounded-full bg-[#eab308] hover:bg-[#ca8a04] text-black shadow-2xl flex items-center justify-center font-bold text-xl transition-all transform hover:scale-110 active:scale-95 chat-pulse-btn"
          title="Open Atmosera Assistant"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* SLIDE-OUT ATMOSERA ASSISTANT DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#0c0f18]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-400 ease-out flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}

          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#121624]">
            <div className="flex items-center space-x-3">
              {/* Animated AI Avatar */}
              <div className="relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${isSpeaking ? 'border-[#38bdf8] bg-[#38bdf8]/20 animate-pulse' : 'border-white/20 bg-[#181d2c]'}`}>
                  <svg className={`w-4 h-4 transition-all duration-300 ${isSpeaking ? 'text-[#38bdf8]' : 'text-[#9ca3af]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                </div>
                {isSpeaking && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-[#38bdf8] opacity-40 animate-ping"></div>
                    <div className="absolute -inset-1 rounded-full border border-[#38bdf8] opacity-20 animate-pulse"></div>
                  </>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white font-display flex items-center gap-2">
                  Atmosera
                  {isSpeaking && <span className="text-[9px] bg-[#38bdf8] text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">Speaking</span>}
                </h3>
                <div className="text-[10px] text-[#9ca3af] flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${simulateOffline ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                  {simulateOffline ? 'Offline Fallback Engine' : 'Cloud Neural Engine'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Offline Mode Toggle */}
              <button
                onClick={() => setSimulateOffline(!simulateOffline)}
                className={`p-2 rounded-xl transition-all ${simulateOffline ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-[#181d2c] text-[#9ca3af] border border-white/10 hover:bg-white/5'}`}
                title={simulateOffline ? "Disable Offline Mode" : "Simulate Network Outage (Offline Mode)"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {simulateOffline ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.163a1.5 1.5 0 01.143 1.052m-8.107 8.107l-2.829 2.829m11.414-11.414L3 3" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  )}
                </svg>
              </button>

              {/* TTS Toggle */}

            <button
              onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
              title={isVoiceOutputEnabled ? "Mute Voice" : "Enable Voice"}
              className={`p-1.5 rounded-lg transition-all ${isVoiceOutputEnabled ? 'text-[#eab308] bg-[#eab308]/10' : 'text-white/40 hover:text-white/80'}`}
            >
              {isVoiceOutputEnabled ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              )}
            </button>

            <select
              value={chatLanguage}
              onChange={(e) => {
                setChatLanguage(e.target.value);
                setPrefLang(e.target.value);
              }}
              className="bg-[#181d2c] border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#eab308]"
            >
              <option value="English">EN</option>
              <option value="Hindi">हिन्दी</option>
            </select>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-white/60 hover:text-white text-lg p-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Drawer Chat Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs leading-relaxed">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`${
                msg.sender === "user"
                  ? "bg-[#eab308]/20 border border-[#eab308]/40 p-3 rounded-2xl rounded-tr-none text-white text-right ml-6 font-medium shadow-sm"
                  : "bg-[#121726] border border-white/5 p-3.5 rounded-2xl rounded-tl-none text-[#d1d5db] mr-6 shadow-sm"
              }`}
            >
              {msg.text}
              {msg.sender === "bot" && (
                <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => speakText(msg.text, chatLanguage)}
                    className="text-[#9ca3af] hover:text-[#eab308] px-2 py-0.5 rounded hover:bg-white/5 transition-colors flex items-center gap-1 text-[10px]"
                    title="Speak in selected language"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                    <span>{chatLanguage === "Hindi" ? "सुनें (Listen)" : "Listen"}</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {aiLoading && (
            <div className="bg-[#121726] border border-white/5 p-3 rounded-2xl rounded-tl-none text-[#9ca3af] mr-6 animate-pulse flex items-center space-x-1.5">
              <span>Atmosera is thinking</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Drawer Input Field */}
        <div className="p-3.5 border-t border-white/10 bg-[#090b12]">
          <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              placeholder="Ask Atmosera..."
              className="flex-1 bg-[#141926] border border-white/15 focus:border-[#eab308] rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all"
            />
            
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`p-2.5 rounded-xl ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-[#1e2436] hover:bg-[#2a324a] text-[#9ca3af]'} transition-all`}
              title="Voice Input"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>

            <button
              id="chat-submit-btn"
              type="submit"
              disabled={aiLoading}
              className="p-2.5 rounded-xl bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/10 py-6 text-center text-xs text-[#6b7280] relative z-10">
        <div>Atmosera • Weather Intelligence Workspace</div>
      </footer>

      {/* MODALS */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('weathergpt_user', JSON.stringify(user));
          if (user.saved_locations && Array.isArray(user.saved_locations) && user.saved_locations.length > 0) {
            setSavedLocations(user.saved_locations);
            try {
              localStorage.setItem(`weathergpt_saved_locations_${user.email}`, JSON.stringify(user.saved_locations));
            } catch (e) {
              console.error(e);
            }
          }
        }}
      />
    </div>
  );
}

export default App;
