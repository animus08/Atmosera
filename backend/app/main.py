from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.weather import router as weather_router
from app.api.chat import router as chat_router
from app.api.alerts import router as alerts_router
from app.api.advisory import router as advisory_router
from app.api.users import router as users_router
from app.api.subscriptions import router as subscriptions_router


app = FastAPI(
    title="WeatherGPT API",
    description="Weather intelligence backend for WeatherGPT",
    version="1.0.0"
)


# -------------------------------------------------
# CORS
# -------------------------------------------------
# Allows the React/Vite frontend to communicate
# with the FastAPI backend across localhost & cloud.
# -------------------------------------------------

import os

cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
env_origins = os.getenv("CORS_ORIGINS", "")
if env_origins:
    cors_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# API Routers
# -------------------------------------------------

app.include_router(weather_router)
app.include_router(chat_router)
app.include_router(alerts_router)
app.include_router(advisory_router)
app.include_router(users_router)
app.include_router(subscriptions_router)

# Add SIH 2026 Phase 1 Routers
from app.api.ws import router as ws_router
from app.api.analytics import router as analytics_router

app.include_router(ws_router)
app.include_router(analytics_router)


# -------------------------------------------------
# Root endpoint
# -------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "WeatherGPT API is running"
    }


# -------------------------------------------------
# Health check
# -------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }