# 🌩️ Atmosera
**Next-Generation AI Meteorological & Agricultural Climate Intelligence Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 📖 Overview

**Atmosera** is an intelligent, conversational climate intelligence and decision-support workspace uniting real-time satellite telemetry, numerical weather prediction (NWP) multi-models, 8-crop agro-climatic projections, and rural early-warning systems into a cohesive glassmorphic web dashboard.

Instead of displaying raw meteorological data points that demand domain expertise, Atmosera delivers **actionable, contextual decisions** in **6 Indian languages** through natural-language conversation, voice recognition, SMS/WhatsApp rural broadcasts, and interactive GIS radar mapping.

---

## ✨ Key Capabilities

1. **🌾 8-Crop Climate Analytics Engine:** Grounded across 4 distinct Indian agro-climatic zones (Granary Plains, Arid Desert, Lower Gangetic Delta, Deccan Plateau). Delivers decadal anomaly-grounded yield projections for **Wheat, Rice, Jute, Cotton, Sugarcane, Mustard/Pulses, Pearl Millet (Bajra), and Tea/Plantation**.
2. **🚨 Two-Tier Hazard Detection System:**
   - **Tier 1 (District Level):** Real-time local hazard detection for extreme heat ($\ge 40^\circ\text{C}$), torrential rain ($\ge 10\text{ mm}$), gale-force winds ($\ge 40\text{ km/h}$), severe thunderstorms, and cold wave frost ($\le 3^\circ\text{C}$). Features calm "All Clear" indicators during stable weather.
   - **Tier 2 (National Level):** Live synoptic hazard bulletins and regional watches across India (Western Himalayas, Indo-Gangetic Plains, Coastal Peninsular, etc.).
3. **📱 Kisan Rural Advisory & WhatsApp/SMS Dispatch:** Automated agricultural advisories formatted for 1-click **WhatsApp** deep links (`wa.me`) and direct **Fast2SMS** mobile gateway dispatch with 10-digit Indian phone normalization.
4. **🌐 NWP Multi-Model Selector:** Seamlessly switch forecasting engines between **Auto Best Match**, **ECMWF IFS (0.25° High-Res)**, **NCEP GFS**, and **DWD ICON**.
5. **🎙️ Grounded Multilingual AI Assistant:** Powered by Groq Llama 3.3 70B & Gemini 3.8 Flash with an automated offline fallback engine. Automatically recognizes Devanagari Hindi and Romanized Hindi (`"kya aaj barish hogi"`) to deliver 100% Devanagari speech and text output.
6. **👥 Multi-Tenant User Isolation:** Strict per-account profile synchronization with independent saved location lists, language preferences, and alert settings without cross-account contamination.
7. **🛰️ Live Precipitation Radar & GIS Maps:** High-performance geospatial visualization powered by Leaflet, OpenStreetMap, and RainViewer live radar overlays.
8. **⚡ Real-Time Push Telemetry:** WebSocket infrastructure (`/ws/alerts`) pushing severe meteorological warnings instantly to active workspaces with automatic HTTP polling fallback.
9. **📱 Progressive Web App (PWA):** Installable on mobile and desktop with offline service worker caching for field workers.

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ATMOSERA ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend (Client Layer):                                                   │
│    • React 19 + Vite 8 + Tailwind CSS (Glassmorphic Theme)                  │
│    • Web Speech API (SpeechRecognition + SpeechSynthesis)                   │
│    • React-Leaflet + RainViewer Radar Overlay + React Globe                 │
│    • Recharts 8-Crop Analytics + jsPDF Instant Report Export                │
│                                                                             │
│  Backend (Services & Inference Layer):                                      │
│    • FastAPI (Python 3.11+) Asynchronous REST API + WebSockets              │
│    • SQLAlchemy ORM + SQLite Embedded Persistence (Postgres Ready)          │
│    • Open-Meteo REST API (Satellite & Global NWP Multi-Model Aggregator)    │
│    • Groq Llama 3.3 70B / Google Gemini AI / Offline Heuristic Engine       │
│    • Fast2SMS & WhatsApp Web Deep-Link Rural Outreach Gateways              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Option A: One-Click Launch (Windows)
Double-click [`run_atmosera.bat`](run_atmosera.bat) in the repository root. This automatically activates the Python environment, launches the FastAPI server on port 8000, starts the Vite frontend on port 5173, and opens your browser.

```powershell
.\run_atmosera.bat
```

---

### Option B: Manual Setup (Two Separate Terminals)

#### 1. Backend Setup (Terminal 1)
```bash
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend Swagger API docs will be accessible at: `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup (Terminal 2)
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Frontend interface will open at: `http://localhost:5173`

---

## 🌐 Production Cloud Deployment Guide

### 1. Backend Deployment (Render.com — 100% Free Web Service)
1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New +** → **Web Service**.
3. Connect your repository and configure:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. In **Environment Variables**, set:
   - `CORS_ORIGINS`: `*`
   - `GROQ_API_KEY`: `your_groq_api_key_here`
   - `FAST2SMS_API_KEY`: `your_fast2sms_api_key_here`
5. Click **Create Web Service**. Render will output your live URL (e.g. `https://atmosera-api.onrender.com`).

> **💡 Zero Cold-Start Tip**: Set up a free 10-minute ping on [cron-job.org](https://cron-job.org) targeting your backend URL to keep it awake 24/7 with instant 0-second responses!

### 2. Frontend Deployment (Vercel.com — 100% Free)
1. Sign in to [Vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://atmosera-api.onrender.com` *(your backend URL without trailing slash)*
5. Click **Deploy**. Your application will be live globally in under a minute!

---

## 🔐 Environment Configuration

A configuration template is provided at [`backend/.env.example`](backend/.env.example):

```env
# Server & CORS
PORT=8000
CORS_ORIGINS=*
DATABASE_URL=sqlite:///./weathergpt.db

# Meteorological & Geospatial
WEATHER_API_KEY=open-meteo

# Conversational AI (Optional - System includes offline fallback)
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Kisan Rural Outreach SMS & WhatsApp Gateways
FAST2SMS_API_KEY=your_fast2sms_api_key_here
CALLMEBOT_APIKEY=your_callmebot_apikey_here
```

---

## 📂 Repository Structure

```
Atmosera/
├── backend/
│   ├── app/                            # FastAPI core application
│   │   ├── api/                        # REST & WebSocket route endpoints
│   │   ├── services/                   # Weather, NWP, LLM, alerts & subscription services
│   │   ├── models/                     # SQLAlchemy database models
│   │   ├── utils/                      # Smart geocoding & alias resolution
│   │   └── database/                   # SQLite database connections & schemas
│   ├── tests/                          # Automated backend test suites
│   ├── requirements.txt                # Python backend dependencies
│   ├── README.md                       # Backend service documentation
│   └── .env.example                    # Environment variable template
├── frontend/
│   ├── src/                            # React components, views & services
│   ├── public/                         # PWA manifest, service worker & icons
│   ├── package.json                    # NPM packages & build scripts
│   ├── vite.config.js                  # Vite configuration
│   └── README.md                       # Frontend UI documentation
├── run_atmosera.bat                    # One-click Windows workspace launcher
├── run_weathergpt.bat                  # Backward-compatible launcher
├── ARCHITECTURE_DIAGRAM.md             # End-to-end system architecture
├── ATMOSERA_MASTER_DOCUMENTATION.md    # Comprehensive system manual
├── PROJECT_SUMMARY_AND_FEATURES.md     # Feature matrix & specifications
└── README.md                           # Repository overview
```

---

## 📄 License
This project is licensed under the MIT License.
