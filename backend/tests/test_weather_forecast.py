from app.services.weather_service import get_forecast_by_location


weather = get_forecast_by_location("Jaipur")


print("WeatherGPT Forecast Test")
print("------------------------")

print("Location:", weather["location"])
print("Country:", weather["country"])
print("Timezone:", weather["timezone"])

print()

for day in weather["forecast"]:
    print("Date:", day["date"])
    print("Max Temperature:", day["temperature_max"])
    print("Min Temperature:", day["temperature_min"])
    print("Condition:", day["condition"])
    print("Precipitation:", day["precipitation"])
    print("Max Wind Speed:", day["wind_speed_max"])
    print("------------------------")