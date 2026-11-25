from app.services.weather_service import get_weather_by_location


weather = get_weather_by_location("Jaipur")


print("WeatherGPT location weather test")
print("--------------------------------")
print("Location:", weather["location"])
print("Country:", weather["country"])
print("Temperature:", weather["temperature"])
print("Humidity:", weather["humidity"])
print("Feels Like:", weather["apparent_temperature"])
print("Condition:", weather["condition"])
print("Wind Speed:", weather["wind_speed"])
print("Precipitation:", weather["precipitation"])
print("Timezone:", weather["timezone"])