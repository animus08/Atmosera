from app.services.weather_service import get_current_weather


latitude = 26.9124
longitude = 75.7873


weather = get_current_weather(
    latitude=latitude,
    longitude=longitude
)


print("Weather service working successfully!")
print()
print("Latitude:", weather["latitude"])
print("Longitude:", weather["longitude"])
print("Timezone:", weather["timezone"])
print("Time:", weather["time"])
print("Temperature:", weather["temperature"])
print("Humidity:", weather["humidity"])
print("Feels Like:", weather["apparent_temperature"])
print("Precipitation:", weather["precipitation"])
print("Weather Code:", weather["weather_code"])
print("Condition:", weather["condition"])
print("Wind Speed:", weather["wind_speed"])