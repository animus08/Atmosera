from app.database.connection import SessionLocal
from app.services.alert_service import create_alert


db = SessionLocal()

try:
    alert = create_alert(
        db=db,
        user_id=1,
        location="Jaipur",
        alert_type="heat",
        message="High temperature detected",
        severity="high"
    )

    if alert:
        print("Alert created successfully")
        print("ID:", alert.id)
        print("Type:", alert.alert_type)
        print("Message:", alert.message)
        print("Severity:", alert.severity)
    else:
        print("Alert was blocked by user preferences")

finally:
    db.close()