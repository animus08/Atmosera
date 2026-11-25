import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.weather_service import get_weather_by_location
from app.services.alert_service import check_weather_alerts

from app.database.connection import SessionLocal

from app.database.crud import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    create_user_preferences,
    get_user_preferences,
    update_user_preferences
)

from app.models.alert import Alert


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

DEFAULT_LOCATIONS = [
    {"name": "New Delhi", "region": "North India", "lang": "English"},
    {"name": "Mumbai", "region": "Maharashtra", "lang": "English"},
    {"name": "Bengaluru", "region": "Karnataka", "lang": "English"},
]


# -------------------------------------------------
# User request models
# -------------------------------------------------

class UserCreate(BaseModel):
    name: str
    email: str
    location: Optional[str] = None
    language: str = "en"


class UserLogin(BaseModel):
    email: str
    name: Optional[str] = None


class LocationItem(BaseModel):
    name: str
    region: Optional[str] = "India"
    lang: Optional[str] = "English"


class SavedLocationsUpdate(BaseModel):
    locations: List[Dict[str, Any]]


# -------------------------------------------------
# User preferences request model
# -------------------------------------------------

class UserPreferencesUpdate(BaseModel):
    severe_weather_alerts: bool = True
    rain_alerts: bool = True
    heat_alerts: bool = True
    wind_alerts: bool = True
    notifications_enabled: bool = True


# -------------------------------------------------
# Create user (Register)
# -------------------------------------------------

@router.post("/")
def register_user(user: UserCreate):
    db = SessionLocal()
    try:
        clean_email = user.email.strip().lower()
        existing_user = get_user_by_email(db, clean_email)

        if existing_user:
            # If user already registered, safely return user data rather than failing
            saved_locs = DEFAULT_LOCATIONS
            if existing_user.saved_locations:
                try:
                    parsed = json.loads(existing_user.saved_locations)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        saved_locs = parsed
                except Exception:
                    pass

            return {
                "success": True,
                "message": "User already registered, logged in successfully",
                "user": {
                    "id": existing_user.id,
                    "name": existing_user.name,
                    "email": existing_user.email,
                    "location": existing_user.location or "New Delhi",
                    "language": existing_user.language or "en",
                    "saved_locations": saved_locs
                }
            }

        initial_locations = [
            {"name": user.location, "region": "Primary Region", "lang": "English" if user.language == "en" else "Hindi"}
        ] if user.location else DEFAULT_LOCATIONS

        new_user = create_user(
            db=db,
            name=user.name.strip(),
            email=clean_email,
            location=user.location or "New Delhi",
            language=user.language,
            saved_locations=json.dumps(initial_locations)
        )

        create_user_preferences(db, new_user.id)

        return {
            "success": True,
            "message": "User created successfully",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "location": new_user.location,
                "language": new_user.language,
                "saved_locations": initial_locations
            }
        }
    finally:
        db.close()


# -------------------------------------------------
# Login user (Multi-tenant profile resolution)
# -------------------------------------------------

@router.post("/login")
def login_user(payload: UserLogin):
    db = SessionLocal()
    try:
        clean_email = payload.email.strip().lower()
        user = get_user_by_email(db, clean_email)

        if not user:
            # Auto-provision user account seamlessly if signing in for the first time
            user_name = payload.name.strip() if payload.name else clean_email.split("@")[0].capitalize()
            user = create_user(
                db=db,
                name=user_name,
                email=clean_email,
                location="New Delhi",
                language="en",
                saved_locations=json.dumps(DEFAULT_LOCATIONS)
            )
            create_user_preferences(db, user.id)

        # Parse saved locations safely
        saved_locs = DEFAULT_LOCATIONS
        if user.saved_locations:
            try:
                parsed = json.loads(user.saved_locations)
                if isinstance(parsed, list):
                    saved_locs = parsed
            except Exception:
                saved_locs = DEFAULT_LOCATIONS
        else:
            # Initialize user's default locations in database
            user.saved_locations = json.dumps(DEFAULT_LOCATIONS)
            db.commit()

        # Retrieve preferences
        prefs = get_user_preferences(db, user.id)
        if not prefs:
            prefs = create_user_preferences(db, user.id)

        return {
            "success": True,
            "message": f"Welcome back, {user.name}!",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "location": user.location or "New Delhi",
                "language": user.language or "en",
                "saved_locations": saved_locs,
                "preferences": {
                    "severe_weather_alerts": prefs.severe_weather_alerts,
                    "rain_alerts": prefs.rain_alerts,
                    "heat_alerts": prefs.heat_alerts,
                    "wind_alerts": prefs.wind_alerts,
                    "notifications_enabled": prefs.notifications_enabled,
                }
            }
        }
    finally:
        db.close()


# -------------------------------------------------
# User Saved Locations Endpoints (Cloud-persisted)
# -------------------------------------------------

@router.get("/{user_id}/saved-locations")
def get_user_saved_locations(user_id: int):
    db = SessionLocal()
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        locs = DEFAULT_LOCATIONS
        if user.saved_locations:
            try:
                parsed = json.loads(user.saved_locations)
                if isinstance(parsed, list):
                    locs = parsed
            except Exception:
                locs = DEFAULT_LOCATIONS

        return {
            "success": True,
            "user_id": user_id,
            "saved_locations": locs
        }
    finally:
        db.close()


@router.put("/{user_id}/saved-locations")
def update_user_saved_locations(user_id: int, payload: SavedLocationsUpdate):
    db = SessionLocal()
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.saved_locations = json.dumps(payload.locations)
        db.commit()

        return {
            "success": True,
            "message": "Saved locations updated successfully in database",
            "saved_locations": payload.locations
        }
    finally:
        db.close()


@router.post("/{user_id}/saved-locations")
def add_user_saved_location(user_id: int, loc: LocationItem):
    db = SessionLocal()
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        current_locs = []
        if user.saved_locations:
            try:
                parsed = json.loads(user.saved_locations)
                if isinstance(parsed, list):
                    current_locs = parsed
            except Exception:
                current_locs = []

        new_entry = {
            "name": loc.name.strip(),
            "region": (loc.region or "India").strip(),
            "lang": loc.lang or "English"
        }

        # Deduplicate by lowercase name, prepend new entry
        updated_locs = [new_entry] + [l for l in current_locs if l.get("name", "").lower() != new_entry["name"].lower()]

        user.saved_locations = json.dumps(updated_locs)
        db.commit()

        return {
            "success": True,
            "message": f"Location {new_entry['name']} saved to database",
            "saved_locations": updated_locs
        }
    finally:
        db.close()


@router.delete("/{user_id}/saved-locations/{location_name}")
def delete_user_saved_location(user_id: int, location_name: str):
    db = SessionLocal()
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        current_locs = []
        if user.saved_locations:
            try:
                parsed = json.loads(user.saved_locations)
                if isinstance(parsed, list):
                    current_locs = parsed
            except Exception:
                current_locs = []

        updated_locs = [l for l in current_locs if l.get("name", "").lower() != location_name.strip().lower()]

        user.saved_locations = json.dumps(updated_locs)
        db.commit()

        return {
            "success": True,
            "message": f"Location {location_name} deleted from database",
            "saved_locations": updated_locs
        }
    finally:
        db.close()


# -------------------------------------------------
# Get user
# -------------------------------------------------

@router.get("/{user_id}")
def get_user(user_id: int):

    db = SessionLocal()

    try:
        user = get_user_by_id(
            db,
            user_id
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "success": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "location": user.location,
                "language": user.language
            }
        }

    finally:
        db.close()


# -------------------------------------------------
# Get user preferences
# -------------------------------------------------

@router.get("/{user_id}/preferences")
def get_preferences(user_id: int):

    db = SessionLocal()

    try:
        user = get_user_by_id(
            db,
            user_id
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        preferences = get_user_preferences(
            db,
            user_id
        )

        if not preferences:
            preferences = create_user_preferences(
                db,
                user_id
            )

        return {
            "success": True,
            "user_id": user_id,
            "preferences": {
                "severe_weather_alerts":
                    preferences.severe_weather_alerts,

                "rain_alerts":
                    preferences.rain_alerts,

                "heat_alerts":
                    preferences.heat_alerts,

                "wind_alerts":
                    preferences.wind_alerts,

                "notifications_enabled":
                    preferences.notifications_enabled
            }
        }

    finally:
        db.close()


# -------------------------------------------------
# Update user preferences
# -------------------------------------------------

@router.put("/{user_id}/preferences")
def update_preferences(
    user_id: int,
    preferences_data: UserPreferencesUpdate
):

    db = SessionLocal()

    try:
        user = get_user_by_id(
            db,
            user_id
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        preferences = get_user_preferences(
            db,
            user_id
        )

        if not preferences:
            preferences = create_user_preferences(
                db,
                user_id
            )

        preferences = update_user_preferences(
            db=db,
            user_id=user_id,
            severe_weather_alerts=(
                preferences_data.severe_weather_alerts
            ),
            rain_alerts=(
                preferences_data.rain_alerts
            ),
            heat_alerts=(
                preferences_data.heat_alerts
            ),
            wind_alerts=(
                preferences_data.wind_alerts
            ),
            notifications_enabled=(
                preferences_data.notifications_enabled
            )
        )

        return {
            "success": True,
            "message": "Preferences updated successfully",
            "user_id": user_id,
            "preferences": {
                "severe_weather_alerts":
                    preferences.severe_weather_alerts,

                "rain_alerts":
                    preferences.rain_alerts,

                "heat_alerts":
                    preferences.heat_alerts,

                "wind_alerts":
                    preferences.wind_alerts,

                "notifications_enabled":
                    preferences.notifications_enabled
            }
        }

    finally:
        db.close()


# -------------------------------------------------
# Get current user alerts
# -------------------------------------------------

@router.get("/{user_id}/alerts")
def get_user_alerts(user_id: int):

    db = SessionLocal()

    try:
        # Find the user
        user = get_user_by_id(
            db,
            user_id
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # User must have a location
        if not user.location:
            raise HTTPException(
                status_code=400,
                detail="User location is not set"
            )

        # Get current weather
        weather = get_weather_by_location(
            user.location
        )

        # Detect weather alerts
        alerts = check_weather_alerts(
            weather
        )

        # Get user preferences
        preferences = get_user_preferences(
            db,
            user_id
        )

        if not preferences:
            preferences = create_user_preferences(
                db,
                user_id
            )

        saved_alerts = []

        # Process detected alerts
        for alert_data in alerts:

            alert_type = alert_data.get(
                "alert_type"
            )

            message = alert_data.get(
                "message",
                ""
            )

            severity = alert_data.get(
                "severity",
                "medium"
            )

            # Check user preference
            allowed = True

            if alert_type == "heat":
                allowed = preferences.heat_alerts

            elif alert_type == "rain":
                allowed = preferences.rain_alerts

            elif alert_type == "wind":
                allowed = preferences.wind_alerts

            elif alert_type == "severe_weather":
                allowed = (
                    preferences.severe_weather_alerts
                )

            # Notifications disabled
            if not preferences.notifications_enabled:
                allowed = False

            # User has disabled this alert type
            if not allowed:
                continue

            # -----------------------------------------
            # Check for duplicate unread alert
            # -----------------------------------------

            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.location == user.location,
                    Alert.alert_type == alert_type,
                    Alert.message == message,
                    Alert.is_read == False
                )
                .first()
            )

            # Existing unread alert
            if existing_alert:

                saved_alerts.append({
                    "id": existing_alert.id,
                    "alert_type": existing_alert.alert_type,
                    "severity": existing_alert.severity,
                    "message": existing_alert.message,
                    "is_read": existing_alert.is_read,
                    "created_at": (
                        existing_alert.created_at.isoformat()
                        if existing_alert.created_at
                        else None
                    )
                })

                continue

            # -----------------------------------------
            # Create new alert
            # -----------------------------------------

            new_alert = Alert(
                location=user.location,
                alert_type=alert_type,
                severity=severity,
                message=message
            )

            db.add(new_alert)
            db.commit()
            db.refresh(new_alert)

            saved_alerts.append({
                "id": new_alert.id,
                "alert_type": new_alert.alert_type,
                "severity": new_alert.severity,
                "message": new_alert.message,
                "is_read": new_alert.is_read,
                "created_at": (
                    new_alert.created_at.isoformat()
                    if new_alert.created_at
                    else None
                )
            })

        return {
            "success": True,
            "user_id": user_id,
            "location": user.location,
            "alerts": saved_alerts,
            "alert_count": len(saved_alerts)
        }

    finally:
        db.close()


# -------------------------------------------------
# Alert history
# -------------------------------------------------

@router.get("/{user_id}/alert-history")
def get_alert_history(user_id: int):

    db = SessionLocal()

    try:
        # Check that the user exists
        user = get_user_by_id(
            db,
            user_id
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Get all alerts for the user's location
        alerts = (
            db.query(Alert)
            .filter(
                Alert.location == user.location
            )
            .order_by(
                Alert.created_at.desc()
            )
            .all()
        )

        # Count unread alerts
        unread_count = sum(
            1
            for alert in alerts
            if not alert.is_read
        )

        return {
            "success": True,
            "user_id": user_id,
            "location": user.location,
            "alert_count": len(alerts),
            "unread_count": unread_count,
            "alerts": [
                {
                    "id": alert.id,
                    "alert_type": alert.alert_type,
                    "severity": alert.severity,
                    "message": alert.message,
                    "is_read": alert.is_read,
                    "created_at": (
                        alert.created_at.isoformat()
                        if alert.created_at
                        else None
                    )
                }
                for alert in alerts
            ]
        }

    finally:
        db.close()


# -------------------------------------------------
# Mark alert as read
# -------------------------------------------------

@router.patch("/{user_id}/alerts/{alert_id}/read")
def mark_alert_as_read(
    user_id: int,
    alert_id: int
):

    db = SessionLocal()

    try:
        # Check that the user exists
        user = get_user_by_id(
            db,
            user_id
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Find the alert
        alert = (
            db.query(Alert)
            .filter(
                Alert.id == alert_id,
                Alert.location == user.location
            )
            .first()
        )

        if not alert:
            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )

        # Mark alert as read
        alert.is_read = True

        db.commit()
        db.refresh(alert)

        return {
            "success": True,
            "message": "Alert marked as read",
            "alert": {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "message": alert.message,
                "is_read": alert.is_read,
                "created_at": (
                    alert.created_at.isoformat()
                    if alert.created_at
                    else None
                )
            }
        }

    finally:
        db.close()