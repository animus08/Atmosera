from sqlalchemy.orm import Session

from app.models.user import User
from app.models.preferences import UserPreferences


def create_user(
    db: Session,
    name: str,
    email: str,
    location: str | None = None,
    language: str = "en",
    saved_locations: str | None = None
):
    user = User(
        name=name,
        email=email,
        location=location,
        language=language,
        saved_locations=saved_locations
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_user_by_email(
    db: Session,
    email: str
):
    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )
def get_user_by_id(
    db: Session,
    user_id: int
):
    return (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )
def create_user_preferences(
    db: Session,
    user_id: int
):
    existing = get_user_preferences(db, user_id)
    if existing:
        return existing

    preferences = UserPreferences(
        user_id=user_id
    )

    db.add(preferences)
    db.commit()
    db.refresh(preferences)

    return preferences


def get_user_preferences(
    db: Session,
    user_id: int
):
    return (
        db.query(UserPreferences)
        .filter(UserPreferences.user_id == user_id)
        .first()
    )


def update_user_preferences(
    db: Session,
    user_id: int,
    severe_weather_alerts: bool,
    rain_alerts: bool,
    heat_alerts: bool,
    wind_alerts: bool,
    notifications_enabled: bool
):
    preferences = get_user_preferences(db, user_id)

    if not preferences:
        return None

    preferences.severe_weather_alerts = severe_weather_alerts
    preferences.rain_alerts = rain_alerts
    preferences.heat_alerts = heat_alerts
    preferences.wind_alerts = wind_alerts
    preferences.notifications_enabled = notifications_enabled

    db.commit()
    db.refresh(preferences)

    return preferences