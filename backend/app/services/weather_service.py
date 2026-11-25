import requests

from app.utils.location import get_coordinates


WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"


def weather_code_to_description(code):
    """
    Convert WMO weather codes into human-readable descriptions.
    """

    weather_codes = {
        0: "Clear sky",

        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",

        45: "Fog",
        48: "Depositing rime fog",

        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",

        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",

        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",

        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",

        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
    }

    return weather_codes.get(
        code,
        "Unknown weather condition"
    )


def get_current_weather(latitude, longitude, models="best_match"):
    """
    Get current weather information
    for a given latitude and longitude.
    """
    # Normalize ECMWF model to high-resolution 0.25 deg grid
    if models == "ecmwf_ifs04":
        models = "ecmwf_ifs025"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "models": models,
        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "apparent_temperature,"
            "precipitation,"
            "weather_code,"
            "wind_speed_10m"
        ),
        "timezone": "auto"
    }

    try:
        response = requests.get(
            WEATHER_API_URL,
            params=params,
            timeout=10
        )
    except requests.exceptions.SSLError:
        response = requests.get(
            WEATHER_API_URL,
            params=params,
            timeout=10,
            verify=False
        )

    response.raise_for_status()

    data = response.json()

    current = data.get("current")

    if not current:
        raise ValueError(
            "Weather data was not returned by the API"
        )

    weather_code = current.get("weather_code")
    temperature = current.get("temperature_2m")
    humidity = current.get("relative_humidity_2m")

    # Resilient fallback if specific NWP model does not emit real-time observation
    if temperature is None and models != "best_match":
        try:
            fb = get_current_weather(latitude, longitude, models="best_match")
            temperature = fb.get("temperature")
            humidity = fb.get("humidity")
        except Exception:
            pass

    return {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timezone": data.get("timezone"),
        "time": current.get("time"),
        "temperature": current.get("temperature_2m"),
        "humidity": current.get("relative_humidity_2m"),
        "temperature": temperature,
        "humidity": humidity,
        "apparent_temperature": current.get(
            "apparent_temperature"
        ),
        "precipitation": current.get("precipitation"),
        "weather_code": weather_code,
        "condition": weather_code_to_description(
            weather_code
        ),
        "wind_speed": current.get("wind_speed_10m"),
    }


def get_weather_by_location(location: str, models: str = "best_match") -> dict:
    """
    Get current weather using a location name.
    """

    coordinates = get_coordinates(location)

    weather = get_current_weather(
        latitude=coordinates["latitude"],
        longitude=coordinates["longitude"],
        models=models
    )

    return {
        "location": coordinates["name"],
        "country": coordinates["country"],
        "latitude": weather["latitude"],
        "longitude": weather["longitude"],
        "timezone": weather["timezone"],
        "time": weather["time"],
        "temperature": weather["temperature"],
        "humidity": weather["humidity"],
        "apparent_temperature": weather["apparent_temperature"],
        "precipitation": weather["precipitation"],
        "weather_code": weather["weather_code"],
        "condition": weather["condition"],
        "wind_speed": weather["wind_speed"],
    }
def get_weather_forecast(latitude, longitude, forecast_days=7, models="best_match"):
    """
    Get daily weather forecast for a given location.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "models": models,
        "daily": (
            "weather_code,"
            "temperature_2m_max,"
            "temperature_2m_min,"
            "apparent_temperature_max,"
            "apparent_temperature_min,"
            "precipitation_sum,"
            "wind_speed_10m_max"
        ),
        "forecast_days": forecast_days,
        "timezone": "auto"
    }

    try:
        response = requests.get(
            WEATHER_API_URL,
            params=params,
            timeout=10
        )
    except requests.exceptions.SSLError:
        response = requests.get(
            WEATHER_API_URL,
            params=params,
            timeout=10,
            verify=False
        )

    response.raise_for_status()

    data = response.json()

    daily = data.get("daily")

    if not daily:
        raise ValueError(
            "Forecast data was not returned by the API"
        )

    forecast = []

    for i in range(len(daily["time"])):

        weather_code = daily["weather_code"][i]

        forecast.append({
            "date": daily["time"][i],
            "temperature_max": daily["temperature_2m_max"][i],
            "temperature_min": daily["temperature_2m_min"][i],
            "feels_like_max": daily["apparent_temperature_max"][i],
            "feels_like_min": daily["apparent_temperature_min"][i],
            "precipitation": daily["precipitation_sum"][i],
            "weather_code": weather_code,
            "condition": weather_code_to_description(
                weather_code
            ),
            "wind_speed_max": daily["wind_speed_10m_max"][i]
        })

    return {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timezone": data.get("timezone"),
        "forecast": forecast
    }
def get_forecast_by_location(
    location: str,
    forecast_days: int = 7,
    models: str = "best_match"
) -> dict:
    """
    Get weather forecast using a location name.
    """

    coordinates = get_coordinates(location)

    forecast = get_weather_forecast(
        latitude=coordinates["latitude"],
        longitude=coordinates["longitude"],
        forecast_days=forecast_days,
        models=models
    )

    return {
        "location": coordinates["name"],
        "country": coordinates["country"],
        "latitude": forecast["latitude"],
        "longitude": forecast["longitude"],
        "timezone": forecast["timezone"],
        "forecast": forecast["forecast"]
    }


AQI_API_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"


def get_hourly_forecast(latitude, longitude, hours=24):
    """
    Get hourly weather forecast for a given location.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "apparent_temperature,"
            "precipitation_probability,"
            "precipitation,"
            "weather_code,"
            "wind_speed_10m,"
            "uv_index"
        ),
        "forecast_hours": hours,
        "timezone": "auto"
    }

    try:
        response = requests.get(
            WEATHER_API_URL,
            params=params,
            timeout=10
        )
    except requests.exceptions.SSLError:
        response = requests.get(
            WEATHER_API_URL,
            params=params,
            timeout=10,
            verify=False
        )

    response.raise_for_status()
    data = response.json()
    hourly = data.get("hourly")

    if not hourly:
        raise ValueError("Hourly forecast data was not returned by API")

    result = []
    times = hourly.get("time", [])
    for i in range(len(times)):
        weather_code = hourly["weather_code"][i]
        result.append({
            "time": times[i],
            "temperature": hourly["temperature_2m"][i],
            "feels_like": hourly["apparent_temperature"][i],
            "humidity": hourly["relative_humidity_2m"][i],
            "precipitation_probability": hourly["precipitation_probability"][i],
            "precipitation": hourly["precipitation"][i],
            "weather_code": weather_code,
            "condition": weather_code_to_description(weather_code),
            "wind_speed": hourly["wind_speed_10m"][i],
            "uv_index": hourly["uv_index"][i] if "uv_index" in hourly else 0.0,
        })

    return {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timezone": data.get("timezone"),
        "hourly": result
    }


def get_hourly_forecast_by_location(location: str, hours: int = 24) -> dict:
    """
    Get hourly forecast by location name.
    """
    coordinates = get_coordinates(location)
    data = get_hourly_forecast(
        latitude=coordinates["latitude"],
        longitude=coordinates["longitude"],
        hours=hours
    )
    return {
        "location": coordinates["name"],
        "country": coordinates["country"],
        "latitude": data["latitude"],
        "longitude": data["longitude"],
        "timezone": data["timezone"],
        "hourly": data["hourly"]
    }


def aqi_us_to_category(aqi_val):
    """
    Convert US AQI number to descriptive category, color, and health advice.
    """
    if aqi_val is None:
        return {
            "category": "Unknown",
            "color": "#94a3b8",
            "health_advice": "Air quality data is currently unavailable."
        }
    if aqi_val <= 50:
        return {
            "category": "Good",
            "color": "#10b981",
            "health_advice": "Air quality is satisfactory. Enjoy outdoor activities!"
        }
    if aqi_val <= 100:
        return {
            "category": "Moderate",
            "color": "#f59e0b",
            "health_advice": "Air quality is acceptable. Very sensitive individuals should monitor symptoms."
        }
    if aqi_val <= 150:
        return {
            "category": "Unhealthy for Sensitive Groups",
            "color": "#f97316",
            "health_advice": "Children, elderly, and people with respiratory conditions should reduce outdoor exertion."
        }
    if aqi_val <= 200:
        return {
            "category": "Unhealthy",
            "color": "#ef4444",
            "health_advice": "Everyone may begin to experience health effects. Wear a protective mask outdoors."
        }
    if aqi_val <= 300:
        return {
            "category": "Very Unhealthy",
            "color": "#8b5cf6",
            "health_advice": "Health alert: Significantly increased risk. Limit all non-essential outdoor exposure."
        }
    return {
        "category": "Hazardous",
        "color": "#7f1d1d",
        "health_advice": "Emergency warning: Serious health risk for entire population. Stay indoors with air filtration."
    }


def get_air_quality(latitude, longitude):
    """
    Get Air Quality Index and pollutants for coordinates.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "european_aqi,"
            "us_aqi,"
            "pm10,"
            "pm2_5,"
            "carbon_monoxide,"
            "nitrogen_dioxide,"
            "sulphur_dioxide,"
            "ozone,"
            "uv_index"
        ),
        "timezone": "auto"
    }

    try:
        response = requests.get(
            AQI_API_URL,
            params=params,
            timeout=10
        )
    except requests.exceptions.SSLError:
        response = requests.get(
            AQI_API_URL,
            params=params,
            timeout=10,
            verify=False
        )

    response.raise_for_status()
    data = response.json()
    current = data.get("current", {})

    us_aqi = current.get("us_aqi")
    category_info = aqi_us_to_category(us_aqi)

    return {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timezone": data.get("timezone"),
        "time": current.get("time"),
        "us_aqi": us_aqi,
        "european_aqi": current.get("european_aqi"),
        "category": category_info["category"],
        "color": category_info["color"],
        "health_advice": category_info["health_advice"],
        "pm2_5": current.get("pm2_5"),
        "pm10": current.get("pm10"),
        "ozone": current.get("ozone"),
        "nitrogen_dioxide": current.get("nitrogen_dioxide"),
        "sulphur_dioxide": current.get("sulphur_dioxide"),
        "carbon_monoxide": current.get("carbon_monoxide"),
        "uv_index": current.get("uv_index", 0.0),
    }


def get_air_quality_by_location(location: str) -> dict:
    """
    Get Air Quality Index by location name.
    """
    coordinates = get_coordinates(location)
    aqi_data = get_air_quality(
        latitude=coordinates["latitude"],
        longitude=coordinates["longitude"]
    )
    return {
        "location": coordinates["name"],
        "country": coordinates["country"],
        "latitude": aqi_data["latitude"],
        "longitude": aqi_data["longitude"],
        "timezone": aqi_data["timezone"],
        "data": aqi_data
    }


def calculate_weather_risk_index(weather: dict, aqi: dict = None) -> dict:
    """
    Compute a composite Disaster & Weather Safety Risk Score (0-100).
    """
    score = 0
    factors = []

    temperature = weather.get("temperature")
    precipitation = weather.get("precipitation")
    wind_speed = weather.get("wind_speed")
    weather_code = weather.get("weather_code")

    # 1. Heat / Cold Risk (up to 25 pts)
    if temperature is not None:
        if temperature >= 42 or temperature <= 2:
            score += 25
            factors.append("Extreme temperature hazard")
        elif temperature >= 38 or temperature <= 6:
            score += 18
            factors.append("Significant heat/cold stress")
        elif temperature >= 34:
            score += 10
            factors.append("Elevated heat index")

    # 2. Rain / Flood Risk (up to 25 pts)
    if precipitation is not None:
        if precipitation >= 25:
            score += 25
            factors.append("Heavy rainfall - waterlogging & flash flood risk")
        elif precipitation >= 10:
            score += 18
            factors.append("Moderate to heavy rainfall")
        elif precipitation >= 3:
            score += 10
            factors.append("Active rain showers")

    # 3. Wind / Gale Risk (up to 25 pts)
    if wind_speed is not None:
        if wind_speed >= 55:
            score += 25
            factors.append("Severe gale force winds - structural risk")
        elif wind_speed >= 35:
            score += 18
            factors.append("Strong wind gusts")
        elif wind_speed >= 20:
            score += 8
            factors.append("Moderate breezy conditions")

    # 4. Thunderstorm / Atmospheric Hazard (up to 25 pts)
    if weather_code in [95, 96, 99]:
        score += 25
        factors.append("Active thunderstorm & lightning potential")
    elif weather_code in [80, 81, 82]:
        score += 18
        factors.append("Violent convective rain showers")
    elif weather_code in [45, 48]:
        score += 12
        factors.append("Dense fog with reduced road visibility")

    # 5. Air Quality Contribution (bonus up to 10 pts if hazardous)
    if aqi and aqi.get("us_aqi"):
        aqi_val = aqi.get("us_aqi")
        if aqi_val > 200:
            score += 15
            factors.append("Severe air pollution hazard (AQI > 200)")
        elif aqi_val > 100:
            score += 8
            factors.append("Elevated air pollution (AQI > 100)")

    score = min(100, max(0, score))

    if score <= 20:
        level = "Low"
        color = "#10b981"
        summary = "Safe weather conditions. Ideal for outdoor activities and travel."
    elif score <= 45:
        level = "Moderate"
        color = "#f59e0b"
        summary = "Mild weather sensitivity. Standard outdoor precautions advised."
    elif score <= 70:
        level = "High"
        color = "#f97316"
        summary = "Adverse weather conditions present. Exercise caution and monitor updates."
    else:
        level = "Critical"
        color = "#ef4444"
        summary = "Severe weather threat detected. Restrict non-essential travel and stay indoors."

    return {
        "score": score,
        "level": level,
        "color": color,
        "summary": summary,
        "primary_factors": factors if factors else ["Normal atmospheric parameters"]
    }

