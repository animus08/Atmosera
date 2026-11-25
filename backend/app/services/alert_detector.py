def detect_weather_alert(
    temperature: float,
    precipitation: float,
    wind_speed: float,
    weather_code: int
):
    """
    Detect primary weather alert from current weather data.
    Maintained for single-alert backwards compatibility.
    """
    alerts = detect_all_weather_alerts(temperature, precipitation, wind_speed, weather_code)
    return alerts[0] if alerts else None


def detect_all_weather_alerts(
    temperature: float,
    precipitation: float,
    wind_speed: float,
    weather_code: int
) -> list:
    """
    Detect all concurrent weather alerts from meteorological parameters:
    - Extreme Heatwave (>= 40°C)
    - Cold Wave / Frost (<= 3°C)
    - Heavy Precipitation (>= 10mm)
    - Gale Winds (>= 40 km/h)
    - Severe Thunderstorm / Squall / Hail (WMO 95, 96, 99)
    """
    alerts = []

    # Severe Thunderstorm / Squall / Hail
    if weather_code in [95, 96, 99]:
        alerts.append({
            "alert_type": "severe_weather",
            "type": "severe_weather",
            "title": "Severe Thunderstorm & Hail Warning",
            "message": "Violent convective storm with intense lightning and hail detected in radar scan",
            "severity": "high"
        })

    # Extreme Heatwave
    if temperature >= 40:
        alerts.append({
            "alert_type": "heat",
            "type": "heat",
            "title": "Severe Heatwave Alert",
            "message": f"Extreme thermal stress detected: {temperature}°C ambient temperature",
            "severity": "high"
        })
    elif temperature <= 3.0:
        alerts.append({
            "alert_type": "frost",
            "type": "frost",
            "title": "Cold Wave & Ground Frost Warning",
            "message": f"Near or sub-zero temperature detected: {temperature}°C. Risk of crop frost injury",
            "severity": "high" if temperature <= 0 else "medium"
        })

    # Heavy Precipitation
    if precipitation >= 10:
        alerts.append({
            "alert_type": "rain",
            "type": "rain",
            "title": "Heavy Precipitation Advisory",
            "message": f"Excessive surface runoff and localized waterlogging risk: {precipitation} mm",
            "severity": "high" if precipitation >= 35 else "medium"
        })

    # Strong Wind
    if wind_speed >= 40:
        alerts.append({
            "alert_type": "wind",
            "type": "wind",
            "title": "Gale-Force Wind Alert",
            "message": f"Dangerous surface wind gusts detected: {wind_speed} km/h",
            "severity": "high" if wind_speed >= 60 else "medium"
        })

    return alerts