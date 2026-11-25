from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database.connection import Base


class FarmerSubscription(Base):
    __tablename__ = "farmer_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, index=True, nullable=False)
    location = Column(String, nullable=False)
    crop = Column(String, nullable=False, default="Wheat")
    language = Column(String, nullable=False, default="Hindi")
    channel = Column(String, nullable=False, default="WhatsApp") # WhatsApp, SMS, Both
    daily_time = Column(String, nullable=False, default="06:00 AM")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
