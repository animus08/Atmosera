from app.services.llm_service import generate_weather_response


weather_data = {
    "location": "Jaipur",
    "temperature": 33.6,
    "condition": "Mainly clear",
    "humidity": 53,
    "wind_speed": 8.5
}


question = "What is the weather like?"


answer = generate_weather_response(
    weather_data,
    question
)


print("WeatherGPT Mock LLM Test")
print("------------------------")
print("Question:", question)
print()
print("Response:")
print(answer)