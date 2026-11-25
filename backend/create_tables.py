from app.database.connection import Base, engine

from app.models.user import User
from app.models.weather import WeatherRecord
from app.models.alert import Alert


print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")