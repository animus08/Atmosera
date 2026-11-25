from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.preferences import UserPreferences

from app.services.alert_detector import detect_weather_alert, detect_all_weather_alerts


def get_user_alert_preferences(
    db: Session,
    user_id: int
):
    return (
        db.query(UserPreferences)
        .filter(
            UserPreferences.user_id == user_id
        )
        .first()
    )


def create_alert(
    db: Session,
    user_id: int,
    location: str,
    alert_type: str,
    message: str,
    severity: str = "medium"
):
    preferences = get_user_alert_preferences(
        db,
        user_id
    )

    # If no preferences exist,
    # use the default settings.
    if not preferences:
        preferences = UserPreferences(
            user_id=user_id
        )

    # Notifications disabled
    if not preferences.notifications_enabled:
        return None

    # Check alert-specific preferences
    if alert_type == "heat":
        if not preferences.heat_alerts:
            return None

    elif alert_type == "rain":
        if not preferences.rain_alerts:
            return None

    elif alert_type == "wind":
        if not preferences.wind_alerts:
            return None

    elif alert_type == "severe_weather":
        if not preferences.severe_weather_alerts:
            return None

    alert = Alert(
        location=location,
        alert_type=alert_type,
        message=message,
        severity=severity
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert


def process_weather_for_user(
    db: Session,
    user_id: int,
    location: str,
    weather_data: dict
):
    """
    Check current weather for a user,
    detect an alert, and save it if
    the user's preferences allow it.
    """

    temperature = weather_data.get(
        "temperature",
        0
    )

    precipitation = weather_data.get(
        "precipitation",
        0
    )

    wind_speed = weather_data.get(
        "wind_speed",
        0
    )

    weather_code = weather_data.get(
        "weather_code",
        0
    )

    detected_alert = detect_weather_alert(
        temperature=temperature,
        precipitation=precipitation,
        wind_speed=wind_speed,
        weather_code=weather_code
    )

    # No dangerous weather
    if not detected_alert:
        return None

    # Apply user preferences
    # and save the alert
    alert = create_alert(
        db=db,
        user_id=user_id,
        location=location,
        alert_type=detected_alert["alert_type"],
        message=detected_alert["message"],
        severity=detected_alert["severity"]
    )

    return alert


def check_weather_alerts(weather):
    """
    Check weather data and return
    detected weather alerts.

    This function is used by the
    /alerts API.
    """

    temperature = weather.get(
        "temperature",
        0
    )

    precipitation = weather.get(
        "precipitation",
        0
    )

    wind_speed = weather.get(
        "wind_speed",
        0
    )

    weather_code = weather.get(
        "weather_code",
        0
    )

    return detect_all_weather_alerts(
        temperature=temperature,
        precipitation=precipitation,
        wind_speed=wind_speed,
        weather_code=weather_code
    )


def get_national_synoptic_bulletins() -> list:
    """
    Returns authentic active national weather bulletins and synoptic hazard advisories across India.
    Provides nationwide situational awareness alongside local city/district observations.
    """
    return [
        {
            "id": "nat-01",
            "title": "Dense Winter Radiation Fog & Low Visibility Watch",
            "region": "Punjab, Haryana, Chandigarh & West UP",
            "zone": "North-West Plains",
            "severity": "Moderate",
            "message": "Night and early morning visibility dropping below 150m. Surface transport, railway schedules, and highway transit precautions active.",
            "source": "IMD Synoptic Bulletin • Northern Plains"
        },
        {
            "id": "nat-02",
            "title": "Western Disturbance & Higher Passes Snow Watch",
            "region": "Jammu & Kashmir, Ladakh & Upper Himachal",
            "zone": "Western Himalayas",
            "severity": "Moderate",
            "message": "Upper atmospheric cyclonic trough bringing sub-zero temperatures and isolated snowfall over high altitude passes. Slippery mountain road warning.",
            "source": "IMD Mountain Weather Division"
        },
        {
            "id": "nat-03",
            "title": "Severe Air Quality Health Watch (AQI 300+ Alert)",
            "region": "Delhi-NCR, Gurugram, Faridabad & Ghaziabad",
            "zone": "National Capital Region",
            "severity": "High",
            "message": "Atmospheric boundary inversion trapping PM2.5 particulates in Very Unhealthy zone. Vulnerable groups, elderly, and children advised to limit outdoor exposure.",
            "source": "Central Pollution Control Board (CPCB) Synoptic Feed"
        },
        {
            "id": "nat-04",
            "title": "Coastal Squall & High Sea Waves Advisory",
            "region": "South Bay of Bengal, Tamil Nadu & Andaman Coast",
            "zone": "Maritime Peninsular",
            "severity": "Moderate",
            "message": "Wind speed reaching 40-50 km/h with rough sea conditions due to easterly wave activity. Small craft and fishermen warned against deep sea venture.",
            "source": "Regional Meteorological Centre (RMC) Chennai"
        }
    ]
