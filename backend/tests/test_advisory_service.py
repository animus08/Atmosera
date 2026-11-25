from app.services.advisory_service import generate_advisories


weather_data = {
    "temperature": 42,
    "humidity": 90,
    "precipitation": 60,
    "wind_speed": 65
}

advisories = generate_advisories(weather_data)


print("WeatherGPT Advisory Test")
print("------------------------")

for advisory in advisories:
    print()
    print("Type:", advisory["type"])
    print("Priority:", advisory["priority"])
    print("Title:", advisory["title"])
    print("Advice:", advisory["advice"])