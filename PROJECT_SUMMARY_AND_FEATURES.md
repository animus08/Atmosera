# 🌦️ Atmosera • Complete Project Summary & Feature Matrix
**AI-Powered Meteorological, Agronomic & Climate Risk Intelligence Platform**

---

## 🌟 Executive Summary

**Atmosera** is a full-stack, AI-driven weather and disaster management platform designed to solve the critical last-mile problem in meteorological communications. In most regions, weather reports are presented as technical data points (temperatures, millimeter metrics, barometric hectopascals) that are difficult for farmers, logistics managers, and citizens to translate into immediate actions.

Atmosera bridges this gap by converting live satellite telemetry, numerical weather prediction (NWP) models, and GIS radar feeds into **direct, domain-specific decisions** (*"Do not spray pesticide today—heavy rain in 3 hours will wash chemicals away"*, *"Pause irrigation tube-wells"*, *"Foliar fungal risk high"*) delivered in **6 Indian languages** through natural language, voice interaction, and automated SMS/WhatsApp alerts.

---

## 🚀 Core Functional Modules

### 1. 🌾 Kisan Decision Engine & Crop Advisory Matrix
* **Crop-Specific Agronomic Rules**: Farmers select crops (*Wheat / गेहूं, Paddy / धान, Cotton / कपास, Mustard / सरसों, Sugarcane / गन्ना, Tomato / टमाटर*).
* **7-Day Dynamic Farm Guidance**:
  * **Optimal Spraying Windows**: Evaluates wind velocity ($<12\text{ km/h}$) and 36-hour rain probability ($<25\%$) to prevent expensive chemical washouts.
  * **Irrigation Scheduling**: Detects upcoming natural precipitation to pause tube-wells, saving electricity and preventing root waterlogging.
  * **Harvest & Drying Risk Index (0–100)**: Evaluates moisture and storm probability for open-field crop drying.
  * **Fungal Blight Risk Assessment**: Monitors relative humidity and temperature corridor thresholds to flag foliar disease risks.
* **Automated Farmer Bulletins**: Daily WhatsApp (CallMeBot) and SMS (Fast2SMS) weather broadcasts tailored to the farmer's registered location and preferred language.

### 2. 🎙️ Two-Way Multilingual Voice AI Assistant
* **Browser-Native Web Speech Integration**: Zero latency, zero third-party audio costs using native `SpeechRecognition` and `SpeechSynthesis`.
* **6 Indian Languages Supported**:
  * 🇬🇧 **English** • 🇮🇳 **हिन्दी (Hindi)** • 🇮🇳 **தமிழ் (Tamil)** • 🇮🇳 **తెలుగు (Telugu)** • 🇮🇳 **मराठी (Marathi)** • 🇮🇳 **বাংলা (Bengali)**
* **Dual-Engine Zero-Downtime AI**:
  * **Cloud Neural Engine**: High-speed reasoning powered by Groq (Llama 3.3 70B) and Google Gemini.
  * **Offline Heuristic Engine**: Grounded, rule-based fallback that parses live local numbers and answers queries with 100% reliability even if external AI APIs drop.

### 3. 🚨 Disaster Management & Early Warning System
* **Automated Alert Detection**: Real-time threshold monitoring triggering warnings for Heatwaves ($\ge 38^\circ\text{C}$), Heavy Downpours ($\ge 15\text{ mm}$), Gale Winds ($\ge 40\text{ km/h}$), and Severe Thunderstorms.
* **WebSocket Push Dissemination**: Live socket connection (`/ws/alerts`) pushing instant notifications directly to active client dashboards without requiring manual page reloads.
* **Emergency SOS Kit**: One-click direct speed dials to:
  * 📞 **NDMA National Disaster Helpline**: `1078`
  * 📞 **State Disaster Management (SDMA)**: `1070`
  * 📞 **District Emergency Operations (DEOC)**: `1077`
  * 📞 **National Emergency Unified Response**: `112`

### 4. 🛰️ Geospatial Radar & Interactive 3D Globe
* **Live Precipitation Radar**: Interactive Leaflet map utilizing RainViewer real-time global radar tiles over OpenStreetMap.
* **3D Planetary Globe**: Visual location context and storm tracking built with `react-globe.gl`.
* **Dynamic NWP Engine Selector**: Switch live forecasting datasets between **NCEP GFS**, **ECMWF IFS**, and **DWD ICON**.

### 5. 📊 Historical Climate Variance Analytics
* **Decadal Climate Trends**: Interactive Recharts visualization tracking 10-year temperature anomalies and monsoon rainfall variance to help researchers identify shifting seasonal patterns.

### 6. 📄 Instant PDF Intelligence Dossier
* **One-Click Export**: Generates clean, downloadable PDF weather summaries using `html2canvas` and `jsPDF` for field officers, insurance claims, and logistics dispatchers.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technologies Used | Key Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite 8, Tailwind CSS | High-performance cosmic glassmorphic dashboard |
| **Visualizations** | Leaflet, RainViewer, React Globe, Recharts | Interactive radar, 3D globe, and climate analytics |
| **Voice Interface** | Web Speech API | Client-side speech-to-text and speech synthesis |
| **Backend Core** | FastAPI (Python 3.11+), Uvicorn | High-throughput asynchronous REST API and WebSockets |
| **Database** | SQLite + SQLAlchemy ORM | Local zero-config persistence for users, preferences, and subscriptions |
| **Telemetry Ingestion**| Open-Meteo REST API | Keyless global satellite and NWP model aggregator |
| **Conversational AI** | Groq Llama 3.3 70B, Google Gemini, Offline NLP | Grounded, anti-hallucination domain intelligence |
| **Outreach Gateways** | CallMeBot, Fast2SMS, Twilio | Free WhatsApp and SMS rural dispatch integration |

---

## ⚡ Quick Launch Commands

### Method A: One-Click Launcher (Windows)
```powershell
.\run_atmosera.bat
```
*(or `.\run_weathergpt.bat` for backward compatibility)*

### Method B: Manual Startup (Two Separate Terminals)

**Terminal 1 — Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev
```

* **Frontend Dashboard**: `http://localhost:5173`
* **Interactive API Documentation**: `http://localhost:8000/docs`
* **Alternative ReDoc API Schema**: `http://localhost:8000/redoc`

---

## 📁 Project Documentation Directory

1. **[`README.md`](README.md)**: Main developer and repository documentation.
2. **[`ARCHITECTURE_DIAGRAM.md`](ARCHITECTURE_DIAGRAM.md)**: Technical architecture flow and subsystem specifications.
3. **[`SIH_PITCH_DECK_AND_QA_DEFENSE.md`](SIH_PITCH_DECK_AND_QA_DEFENSE.md)**: 10-slide presentation outline and judge Q&A defense.
4. **[`SIH_PRESENTATION_GUIDE.md`](SIH_PRESENTATION_GUIDE.md)**: Step-by-step 3-minute live presentation script.
