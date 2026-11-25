from app.database.connection import Base, engine

# Import all models so SQLAlchemy knows about their tables
from app.models.user import User
from app.models.preferences import UserPreferences


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables initialized successfully")