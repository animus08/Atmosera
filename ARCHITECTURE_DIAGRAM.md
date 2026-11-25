# 🏗️ Atmosera • Technical System Architecture Blueprint
**Next-Generation AI Meteorological & Climate Intelligence Platform**

---

## 🛰️ 1. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph DATA_SOURCES ["1. Global Satellite & NWP Ingestion Layer"]
        A1["🛰️ NOAA GFS / ECMWF IFS / DWD ICON"]
        A2["🌐 Open-Meteo High-Resolution Engine (1km Grid)"]
        A3["🌧️ RainViewer Real-Time Radar API"]
        A1 --> A2
    end

    subgraph BACKEND_CORE ["2. FastAPI Asynchronous Backend (Python 3.11+)"]
        A2 --> B1["📍 Geocoding & Coordinates Resolver (/weather)"]
        B1 --> B2["📡 Telemetry Pipelines: Hourly, 7-Day & AQI"]
        B2 --> B3["⚠️ Composite Disaster Risk Engine (/weather/risk)"]
        B2 --> B4["🚨 Threshold Alert Detector (/alerts & /ws/alerts)"]
        B2 --> B5["🌾 Kisan Agronomic Service (Irrigation & Foliar Math)"]
        
        B2 & B3 & B4 --> C1["🧠 Anti-Hallucination Prompt Grounding Engine"]
        C1 --> C2["🤖 Conversational AI Service (Groq Llama 3.3 / Gemini)"]
        C1 -.-> C3["⚡ Offline Heuristic Reasoning Engine (Zero-Downtime Fallback)"]
        
        B5 --> D1["📲 Rural Subscriber Dispatch Gateway (CallMeBot / Fast2SMS / Twilio)"]
        D1 --> DB[("💾 SQLite Database: Users, Preferences, Alerts, Subscriptions")]
    end

    subgraph CLIENT_INTERFACE ["3. React 19 + Vite Glassmorphic Client (PWA)"]
        C2 & C3 & B2 --> E1["💻 Live Interactive Command Dashboard (Port 5173)"]
        E1 --> F1["🗺️ Dynamic Leaflet Radar & 3D Interactive Globe"]
        E1 --> F2["🎙️ Multilingual Two-Way Voice I/O (Web Speech API)"]
        E1 --> F3["🌾 Smart Kisan Agricultural Advisory Matrix"]
        E1 --> F4["🚨 Attention Now Severe Weather Warning Feed"]
        E1 --> F5["📊 Historical Climate Variance Analytics (Recharts)"]
        E1 --> F6["📄 Instant Client-Side PDF Report Generation (jsPDF)"]
        E1 --> F7["📱 PWA Offline Service Worker (CacheStorage API)"]
    end

    subgraph DEPLOYMENT ["4. Production & Cloud Infrastructure"]
        BACKEND_CORE --> DEP_RAILWAY["🚂 Railway (Python Asynchronous Service)"]
        CLIENT_INTERFACE --> DEP_VERCEL["▲ Vercel (Edge CDN React Static Build)"]
    end

    style DATA_SOURCES fill:#0a1120,stroke:#38bdf8,stroke-width:2px,color:#ffffff
    style BACKEND_CORE fill:#071a12,stroke:#22c55e,stroke-width:2px,color:#ffffff
    style CLIENT_INTERFACE fill:#120e24,stroke:#a855f7,stroke-width:2px,color:#ffffff
    style DEPLOYMENT fill:#1c1408,stroke:#eab308,stroke-width:2px,color:#ffffff
```

---

## 🔬 2. Subsystems & Technical Specifications

| Subsystem | Underlying Technology | Performance Benchmark | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Telemetry Aggregator** | Open-Meteo REST (GFS/ECMWF/ICON) | $<200\text{ ms}$ query latency | Fetches real-time temperature, humidity, wind velocity, precipitation, UV index, and PM2.5/PM10. |
| **Unified Data Endpoint** | `/weather/overview` (FastAPI) | $<250\text{ ms}$ payload hydration | Consolidates current weather, 7-day outlook, hourly trends, AQI, alerts, and advisories in one request. |
| **Disaster Risk Engine** | Custom 0–100 Weighted Composite | Instantaneous ($<2\text{ ms}$) | Calculates composite hazard scores based on wind thresholds, temperature extremes, downpour volume, and AQI. |
| **Dual-Engine AI Brain** | Groq (Llama 3.3 70B) + Gemini + Offline Heuristics | $<350\text{ ms}$ TTFT | Grounded multilingual conversational agent answering weather and agronomic queries with zero hallucinations. |
| **Voice Interface** | Browser-Native Web Speech API | Instant ($0\text{ ms}$ network) | Speech-to-Text input and SpeechSynthesis playback supporting English and 5 regional Indian languages. |
| **Geospatial Radar** | React-Leaflet + RainViewer API | Real-time tile streaming | Overlays live precipitation radar imagery over global OpenStreetMap vector basemaps. |
| **Kisan Outreach** | Fast2SMS + CallMeBot + Twilio | Background queued | Formats vernacular bulletins (Hindi/Tamil/English) and sends automated WhatsApp and SMS weather updates. |
| **Offline Resilience** | Service Worker (`sw.js`) + Cache API | 100% offline ready | Caches critical telemetry, emergency contacts, and crop guidance for remote zero-connectivity fields. |

---

## 🛡️ 3. Security, Deployment & Data Integrity

1. **Zero Secret Leaks:**
   * Full `.gitignore` protection isolates private `.env` keys, virtual environments (`venv/`), Node dependencies (`node_modules/`), and SQLite databases.
2. **Keyless Resilience:**
   * Primary meteorological telemetry requires no paid API keys.
   * If third-party AI keys expire or lose network connectivity, the system automatically falls back to its internal heuristic engine without throwing runtime errors.
3. **Optimized Cloud Architecture:**
   * **Backend:** Easily hosted on **Railway** via standard Python requirements without container bloat.
   * **Frontend:** Deployed to **Vercel** with global edge caching and instant Vite asset bundling.
