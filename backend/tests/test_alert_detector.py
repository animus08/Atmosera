from app.services.alert_detector import detect_weather_alert


alert = detect_weather_alert(
    temperature=42,
    precipitation=0,
    wind_speed=10,
    weather_code=1
)

if alert:
    print("Alert detected!")
    print("Type:", alert["alert_type"])
    print("Message:", alert["message"])
    print("Severity:", alert["severity"])
else:
    print("No alert detected")