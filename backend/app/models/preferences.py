from sqlalchemy import Column, Integer, Boolean, ForeignKey

from app.database.connection import Base


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    severe_weather_alerts = Column(
        Boolean,
        default=True
    )

    rain_alerts = Column(
        Boolean,
        default=True
    )

    heat_alerts = Column(
        Boolean,
        default=True
    )

    wind_alerts = Column(
        Boolean,
        default=True
    )

    notifications_enabled = Column(
        Boolean,
        default=True
    )