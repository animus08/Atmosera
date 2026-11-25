import time
from app.database.connection import SessionLocal
from app.database.crud import create_user, get_user_by_email


db = SessionLocal()

try:
    test_email = f"test_{int(time.time())}@example.com"
    user = create_user(
        db=db,
        name="Test User",
        email=test_email,
        location="Jaipur",
        language="en"
    )

    print("User created successfully!")
    print("ID:", user.id)
    print("Name:", user.name)
    print("Email:", user.email)

    found_user = get_user_by_email(
        db=db,
        email=test_email
    )

    print("\nUser found:")
    print("ID:", found_user.id)
    print("Name:", found_user.name)

finally:
    db.close()