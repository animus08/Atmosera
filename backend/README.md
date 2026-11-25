# Atmosera Backend Engine 🚀

Asynchronous high-performance meteorological microservice powered by **FastAPI**, **SQLAlchemy**, and **Open-Meteo Multi-Model NWP Gateway**.

---

## 🛠️ Tech Stack & Key Modules

- **Framework**: FastAPI (Python 3.11+) with ASGI Uvicorn Server
- **Database**: SQLite via SQLAlchemy ORM (PostgreSQL migration ready)
- **NWP Engine**: Multi-Model Numeric Weather Prediction (ECMWF IFS 0.25°, NCEP GFS, DWD ICON, CMC GEM, Auto Best Match)
- **Agro-Analytics**: 8-Crop Climate Analytics Engine across 4 Indian Agro-Climatic Zones
- **Early Warning**: Two-Tier Hazard Detection (Local District alerts + National Synoptic Bulletins)
- **Conversational AI**: Groq Llama 3.3 70B & Gemini 3.8 Flash with offline fallback engine
- **Rural Outreach**: Fast2SMS gateway + WhatsApp 1-click deep-link engine

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/weather/overview` | Unified high-performance endpoint returning current weather, hourly forecast, 7-day forecast, AQI, alerts, national watches, advisories, and risk scores. |
| `GET` | `/weather/` | Real-time weather observation for a queried location. |
| `GET` | `/weather/forecast` | 7-to-16 day daily numerical weather prediction. |
| `GET` | `/weather/hourly` | 24-to-48 hour granular temperature, rain, and wind telemetry. |
| `GET` | `/weather/aqi` | Real-time Air Quality Index (PM2.5, PM10, Ozone, NO2). |
| `GET` | `/weather/risk` | Multi-parameter severe hazard risk index (0–100 scale). |
| `GET` | `/analytics/historical` | 10-year decadal anomaly analysis & 8-crop yield impact calculations. |
| `POST`| `/users/login` | Multi-tenant user login and auto-provisioning with profile sync. |
| `GET` | `/users/{id}/saved-locations` | Fetch user-specific saved locations. |
| `POST`| `/users/{id}/saved-locations` | Add or update monitored user locations with strict tenant isolation. |
| `POST`| `/subscriptions/register` | Register farmer for automated daily crop advisories & severe alerts. |
| `POST`| `/chat/` | Conversational weather and agricultural decision support (Hindi & English). |
| `WS`  | `/ws/alerts` | WebSocket live stream pushing critical alerts to connected workspaces. |

---

## 🚀 Local Development

```bash
# 1. Activate Virtual Environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 2. Install Dependencies
pip install -r requirements.txt

# 3. Start Server
uvicorn app.main:app --reload --port 8000
```

Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`

