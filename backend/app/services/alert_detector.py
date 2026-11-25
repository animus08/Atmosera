import re


def detect_weather_alert(
    temperature: float,
    precipitation: float,
    wind_speed: float,
    weather_code: int,
    aqi: dict = None,
    location: str = "",
    national_alerts: list = None
):
    """
    Detect primary weather alert from current weather data.
    Maintained for single-alert backwards compatibility.
    """
    alerts = detect_all_weather_alerts(
        temperature=temperature,
        precipitation=precipitation,
        wind_speed=wind_speed,
        weather_code=weather_code,
        aqi=aqi,
        location=location,
        national_alerts=national_alerts
    )
    return alerts[0] if alerts else None


def _matches_location(target_location: str, bulletin: dict) -> bool:
    """
    Determine if a national bulletin applies to the user's specific district/location.
    Supports city-to-state and state-to-synoptic zone mapping.
    """
    if not target_location or not bulletin:
        return False

    loc_lower = target_location.lower().strip()
    region_lower = (bulletin.get("region") or "").lower()
    title_lower = (bulletin.get("title") or "").lower()
    zone_lower = (bulletin.get("zone") or "").lower()

    # Exact or substring match in region or title
    if loc_lower in region_lower or loc_lower in title_lower:
        return True

    # Token extraction from location
    loc_tokens = [t.strip() for t in re.split(r'[,&/ -]', loc_lower) if len(t.strip()) >= 3]

    # Explicit Synoptic Region Keyword Mappings
    ncr_keywords = ["delhi", "gurugram", "gurgaon", "faridabad", "ghaziabad", "noida", "ncr"]
    north_plains_keywords = ["punjab", "haryana", "chandigarh", "ludhiana", "amritsar", "jalandhar", "patiala", "west up", "meerut", "bareilly"]
    himalayan_keywords = ["srinagar", "jammu", "kashmir", "ladakh", "leh", "himachal", "shimla", "manali", "dharamshala", "kullu"]
    maritime_keywords = ["bay of bengal", "chennai", "tamil nadu", "andaman", "nicobar", "port blair", "coastal", "arabian sea"]

    for tok in loc_tokens:
        if tok in region_lower:
            return True
        if any(k in tok for k in ncr_keywords) and "delhi-ncr" in region_lower:
            return True
        if any(k in tok for k in north_plains_keywords) and "punjab" in region_lower:
            return True
        if any(k in tok for k in himalayan_keywords) and ("jammu" in region_lower or "himachal" in region_lower):
            return True
        if any(k in tok for k in maritime_keywords) and ("bay of bengal" in region_lower or "andaman" in region_lower):
            return True

    return False


def detect_all_weather_alerts(
    temperature: float,
    precipitation: float,
    wind_speed: float,
    weather_code: int,
    aqi: dict = None,
    location: str = "",
    national_alerts: list = None
) -> list:
    """
    Detect all concurrent weather, air quality, and synoptic alerts for a district:
    - Extreme Heatwave (>= 40°C)
    - Cold Wave / Frost (<= 3°C)
    - Heavy Precipitation (>= 10mm)
    - Gale Winds (>= 40 km/h)
    - Severe Thunderstorm / Squall / Hail (WMO 95, 96, 99)
    - Severe Air Quality Hazard (AQI >= 150, >= 200, >= 300)
    - Active National Synoptic Bulletins affecting the local district
    """
    alerts = []

    # 1. Severe Thunderstorm / Squall / Hail
    if weather_code in [95, 96, 99]:
        alerts.append({
            "alert_type": "severe_weather",
            "type": "severe_weather",
            "title": "Severe Thunderstorm & Hail Warning",
            "message": "Violent convective storm with intense lightning and hail detected in radar scan",
            "severity": "high"
        })

    # 2. Extreme Heatwave / Cold Wave
    if temperature is not None:
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
                "message": f"Near or sub-zero temperature detected: {temperature}°C. Risk of frost and freeze",
                "severity": "high" if temperature <= 0 else "medium"
            })

    # 3. Heavy Precipitation
    if precipitation is not None and precipitation >= 10:
        alerts.append({
            "alert_type": "rain",
            "type": "rain",
            "title": "Heavy Precipitation Advisory",
            "message": f"Excessive surface runoff and localized waterlogging risk: {precipitation} mm",
            "severity": "high" if precipitation >= 35 else "medium"
        })

    # 4. Strong Gale Wind
    if wind_speed is not None and wind_speed >= 40:
        alerts.append({
            "alert_type": "wind",
            "type": "wind",
            "title": "Gale-Force Wind Alert",
            "message": f"Dangerous surface wind gusts detected: {wind_speed} km/h",
            "severity": "high" if wind_speed >= 60 else "medium"
        })

    # 5. Air Quality Index (AQI) Hazard Integration
    aqi_val = None
    if isinstance(aqi, dict):
        aqi_val = aqi.get("us_aqi")
        if aqi_val is None:
            aqi_val = aqi.get("european_aqi")
    elif isinstance(aqi, (int, float)):
        aqi_val = aqi

    if aqi_val is not None:
        if aqi_val >= 300:
            alerts.append({
                "alert_type": "air_quality",
                "type": "air_quality",
                "title": "Severe Air Quality Emergency (AQI 300+)",
                "message": f"Critical atmospheric boundary inversion trapping PM2.5 particulates (AQI {int(aqi_val)}). Hazardous to all populations.",
                "severity": "high"
            })
        elif aqi_val >= 200:
            alerts.append({
                "alert_type": "air_quality",
                "type": "air_quality",
                "title": "Very Unhealthy Air Quality Advisory (AQI 200+)",
                "message": f"Dense particulate pollution detected (AQI {int(aqi_val)}). Vulnerable groups and public advised to stay indoors.",
                "severity": "high"
            })
        elif aqi_val >= 150:
            alerts.append({
                "alert_type": "air_quality",
                "type": "air_quality",
                "title": "Unhealthy Air Quality Advisory (AQI 150+)",
                "message": f"Elevated particulate concentration detected (AQI {int(aqi_val)}). Limit prolonged outdoor exertion.",
                "severity": "medium"
            })

    # 6. Cross-Tier Synoptic National Watch Harmonization
    # If the current district falls inside an active national watch, elevate it to Tier 1 Local District Status
    if location and national_alerts:
        for bulletin in national_alerts:
            if _matches_location(location, bulletin):
                # Avoid duplicate alert titles
                if not any(a.get("title") == bulletin.get("title") for a in alerts):
                    alerts.append({
                        "alert_type": "national_watch",
                        "type": "national_watch",
                        "title": bulletin.get("title"),
                        "message": f"{bulletin.get('message', '')} (Active watch covering {bulletin.get('region', '')})",
                        "severity": (bulletin.get("severity") or "Moderate").lower()
                    })

    return alerts