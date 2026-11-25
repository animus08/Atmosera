from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from app.database.connection import Base


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    location = Column(
        String,
        nullable=False
    )

    latitude = Column(
        Float,
        nullable=True
    )

    longitude = Column(
        Float,
        nullable=True
    )

    temperature = Column(
        Float,
        nullable=True
    )

    humidity = Column(
        Float,
        nullable=True
    )

    wind_speed = Column(
        Float,
        nullable=True
    )

    condition = Column(
        String,
        nullable=True
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow
    )