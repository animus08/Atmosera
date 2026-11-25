# Atmosera Frontend Client 💻

Modern glassmorphic weather intelligence and agricultural decision workspace built with **React 19**, **Vite 8**, and **Tailwind CSS**.

---

## 🌟 Key Features

- **Glassmorphic UI**: Ultra-clean, distraction-free meteorological workspace designed for high visual clarity in field and command center environments.
- **8-Crop Climate Analytics**: Responsive Recharts bar charts detailing decadal temperature anomalies, annual rainfall, and projected crop yield impacts across 8 major Indian crops.
- **Two-Tier Alert Display**: Top-level summary badge (calm green for zero alerts or active alerts count) paired with localized district alerts and pan-India synoptic watches.
- **Interactive Geospatial Maps**: Leaflet radar GIS mapping with live RainViewer precipitation radar overlays and global coordinate tracking.
- **Kisan Rural Advisory Hub**: Direct 1-click WhatsApp deep-link generation and Fast2SMS dispatch for vernacular farm bulletins.
- **Multilingual Voice Assistant**: Integrated Web Speech API supporting real-time Speech-to-Text and voice playback in English, Hindi (हिन्दी), and regional languages.
- **NWP Multi-Model Selector**: Switch numerical forecasting models on the fly (Auto Best Match, ECMWF IFS 0.25°, NCEP GFS, DWD ICON).
- **Multi-Tenant User Management**: Persistent saved locations per account, localized language toggles, and customized alert thresholds.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS + Custom CSS Glassmorphism
- **Charting**: Recharts
- **GIS / Mapping**: Leaflet, React-Leaflet, RainViewer Radar API
- **Reporting**: jsPDF + html2canvas for instant PDF weather bulletins
- **State & Protocol**: React Hooks + Resilient WebSocket client with automatic HTTP fallback

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run Vite dev server
npm run dev

# 3. Build for production
npm run build
```

Production build output is located in the `dist/` directory, ready for immediate deployment to Vercel, Netlify, or Cloudflare Pages.
