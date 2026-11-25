from app.database.connection import SessionLocal
from app.services.alert_service import process_weather_for_user


db = SessionLocal()

try:

    # Simulated extreme weather
    weather_data = {
        "temperature": 42,
        "precipitation": 0,
        "wind_speed": 10,
        "weather_code": 1
    }

    alert = process_weather_for_user(
    db=db,
    user_id=1,
    location="Delhi",
    weather_data=weather_data
)

    if alert:
        print("Alert created successfully")
        print("ID:", alert.id)
        print("Type:", alert.alert_type)
        print("Message:", alert.message)
        print("Severity:", alert.severity)

    else:
        print(
            "No alert created. "
            "Either weather is normal or "
            "user preferences blocked the alert."
        )

finally:
    db.close()