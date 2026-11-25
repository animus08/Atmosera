"""
Atmosera Conversational AI Intelligence Service
Provides intelligent, weather-grounded, and bilingual (English & Hindi) decision support.
Supports Cloud LLMs (Google Gemini, Groq Llama 3) + Zero-API-Key Grounded Fallback Engine.
"""
import os
import requests
from app.config import settings

def normalize_language(lang_input: str) -> str:
    """Normalize language input to English or Hindi."""
    if not lang_input:
        return "English"
    lang_str = str(lang_input).strip().lower()
    if "hi" in lang_str or "हिन्दी" in lang_str or "hindi" in lang_str:
        return "Hindi"
    return "English"


def call_google_gemini(system_prompt: str, user_prompt: str, api_key: str) -> str:
    """Call Google Gemini 3.8 Flash via REST API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\nUser Query: {user_prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 300
        }
    }
    response = requests.post(url, headers=headers, json=payload, timeout=8)
    if response.ok:
        data = response.json()
        candidates = data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"].strip()
    raise Exception(f"Gemini error: {response.text}")


def call_groq_llama(system_prompt: str, user_prompt: str, api_key: str) -> str:
    """Call Groq Llama-3.3-70b-versatile via REST API (100% Free Tier)."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.4,
        "max_tokens": 300
    }
    response = requests.post(url, headers=headers, json=payload, timeout=8)
    if response.ok:
        data = response.json()
        choices = data.get("choices", [])
        if choices and "message" in choices[0]:
            return choices[0]["message"].get("content", "").strip()
    raise Exception(f"Groq error: {response.text}")


def generate_weather_response(
    weather_data: dict,
    user_question: str,
    alerts: list = None,
    advisories: list = None,
    language: str = "English",
    simulate_offline: bool = False
) -> str:
    """
    Generate an intelligent, weather-grounded response.
    First attempts Cloud LLMs (Gemini / Groq), falling back to offline grounded reasoning.
    """
    if alerts is None:
        alerts = []
    if advisories is None:
        advisories = []

    target_lang = normalize_language(language)

    # Auto-detect language from the user question (Devanagari or Romanized Hindi)
    q = str(user_question).lower().strip()
    if any('\u0900' <= c <= '\u097f' for c in user_question):
        target_lang = "Hindi"
    elif any(w in q.split() for w in ["kya", "hai", "mausam", "barish", "kaise", "aaj", "kheti", "fasal"]):
        target_lang = "Hindi"

    location = weather_data.get("location", "the location")
    temperature = weather_data.get("temperature")
    humidity = weather_data.get("humidity")
    feels_like = weather_data.get("apparent_temperature")
    condition = weather_data.get("condition") or "Clear"
    wind_speed = weather_data.get("wind_speed")
    precipitation = weather_data.get("precipitation")
    forecast = weather_data.get("forecast", [])

    # Check for Cloud LLM Keys
    gemini_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "")
    groq_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "")

    # Grounded System Prompt for LLM with strict language directive
    if target_lang == "Hindi":
        lang_instruction = (
            "CRITICAL LANGUAGE INSTRUCTION: The user has chosen HINDI. "
            "You MUST reply 100% in natural, fluent HINDI using Devanagari script (हिन्दी). "
            "Even if the user's question was asked in English, do NOT answer in English. "
            "Provide the complete response in Hindi (Devanagari script)."
        )
    else:
        lang_instruction = "Respond in clear, professional English."

    system_prompt = f"""You are Atmosera (formerly WeatherGPT), an expert meteorologist and disaster advisor.
You specialize in Decision Support for Agriculture, Aviation, Marine, and Urban Planning.
You are grounded with LIVE weather sensor data for {location}:
- Current Condition: {condition}
- Temperature: {temperature}°C (Feels like: {feels_like}°C)
- Humidity: {humidity}%
- Wind Speed: {wind_speed} km/h
- Precipitation / Rain: {precipitation} mm
- Active Alerts: {[a.get('message', '') for a in alerts]}
- Advisories: {[adv.get('advice', '') for adv in advisories]}

Instructions:
1. Provide a concise, clear, and actionable answer (under 3-4 sentences).
2. Ground your advice in the exact numbers above.
3. If the user asks about flights/aviation, focus on wind and visibility. If marine/fishing, focus on wind and storms. If urban, focus on AQI and heat/floods.
4. {lang_instruction}
"""

    if not simulate_offline:
        if gemini_key and gemini_key != "your_gemini_key_here":
            try:
                return call_google_gemini(system_prompt, user_question, gemini_key)
            except Exception as e:
                print(f"[LLM Service] Gemini API call failed, falling back to rule engine: {e}")

        if groq_key and groq_key != "your_groq_key_here":
            try:
                return call_groq_llama(system_prompt, user_question, groq_key)
            except Exception as e:
                print(f"[LLM Service] Groq API call failed, falling back to rule engine: {e}")

    # =========================================================
    # OFFLINE GROUNDED REASONING ENGINE (ZERO API KEYS NEEDED)
    # =========================================================
    question = str(user_question).lower().strip()

    # 1. Rain / Umbrella Questions
    rain_keywords = ["rain", "raining", "umbrella", "precipitation", "shower", "barish", "barsat", "paani", "बारिश", "बरसात", "पानी", "छाता"]
    if any(k in question for k in rain_keywords):
        has_rain = precipitation is not None and precipitation > 0
        if target_lang == "Hindi":
            if has_rain:
                return f"हाँ, वर्तमान में {location} में {precipitation} mm बारिश दर्ज की गई है। स्थिति '{condition}' है। बाहर जाते समय छाता अवश्य साथ रखें।"
            return f"वर्तमान में {location} में बारिश की कोई संभावना नहीं है। मौसम सामान्यतः '{condition}' बना हुआ है।"
        if has_rain:
            return f"Yes, precipitation ({precipitation} mm) is currently reported in {location}. The current condition is {condition}. Carrying an umbrella is recommended."
        return f"There is currently no significant precipitation reported for {location}. The current condition is {condition}."

    # 2. Farming / Crops / Irrigation
    farming_keywords = ["crop", "crops", "farm", "farming", "agriculture", "irrigation", "water my crops", "kheti", "fasal", "sinchai", "krishi", "खेती", "फसल", "सिंचाई", "किसान", "पानी", "दवा"]
    if any(k in question for k in farming_keywords):
        precip_val = precipitation or 0
        t_rain = forecast[1].get("precipitation", 0) if len(forecast) > 1 else 0
        if target_lang == "Hindi":
            if precip_val > 2 or t_rain > 2:
                return f"कृषि सलाह ({location}): आगामी/वर्तमान बारिश ({max(precip_val, t_rain)} mm) को देखते हुए अतिरिक्त सिंचाई टालें और जल निकासी सुनिश्चित करें।"
            return f"कृषि सलाह ({location}): मौसम मुख्यतः '{condition}' है और बारिश की संभावना नहीं है। मिट्टी की नमी के अनुसार नियमित सिंचाई कर सकते हैं।"
        if precip_val > 2 or t_rain > 2:
            return f"Agricultural Guidance for {location}: Notable precipitation is present or forecasted ({max(precip_val, t_rain)} mm). Avoid unnecessary irrigation and check fields for drainage."
        return f"Agricultural Guidance for {location}: Current condition is {condition} with minimal rainfall. Standard irrigation may proceed based on soil moisture and crop stage."

    # 3. Aviation
    aviation_keywords = ["flight", "aviation", "airplane", "fly", "airport", "pilot"]
    if any(k in question for k in aviation_keywords):
        if target_lang == "Hindi":
            if wind_speed and wind_speed > 40:
                return f"विमानन परामर्श ({location}): तेज हवाओं का जोखिम ({wind_speed} km/h)। उड़ानों में देरी की संभावना के लिए स्थानीय हवाईअड्डे से संपर्क करें।"
            return f"विमानन परामर्श ({location}): वर्तमान स्थिति '{condition}' है और वायु गति {wind_speed} km/h है। उड़ान संचालन अनुकूल और सामान्य है।"
        if wind_speed and wind_speed > 40:
            return f"Aviation Advisory for {location}: High crosswind risk ({wind_speed} km/h). Check local ATC for potential delays."
        return f"Aviation Advisory for {location}: Current condition is {condition} with {wind_speed} km/h winds. VFR conditions likely."

    # 4. Marine
    marine_keywords = ["marine", "fishing", "boat", "sea", "ocean", "fish", "sail"]
    if any(k in question for k in marine_keywords):
        if target_lang == "Hindi":
            if wind_speed and wind_speed > 35:
                return f"समुद्री परामर्श ({location}): छोटी नौकाओं के लिए चेतावनी। तेज हवाएं ({wind_speed} km/h) समुद्र की स्थिति को जोखिम भरा बनाती हैं।"
            return f"समुद्री परामर्श ({location}): समुद्र की स्थिति अपेक्षाकृत शांत है और हवा की गति {wind_speed} km/h है।"
        if wind_speed and wind_speed > 35:
            return f"Marine Advisory for {location}: Small craft warning. High winds ({wind_speed} km/h) make sea conditions hazardous."
        return f"Marine Advisory for {location}: Sea conditions are relatively calm with {wind_speed} km/h winds."

    # 5. Urban Planning
    urban_keywords = ["urban", "city", "pollution", "heat", "traffic", "aqi"]
    if any(k in question for k in urban_keywords):
        if target_lang == "Hindi":
            if temperature and temperature > 38:
                return f"शहरी परामर्श ({location}): अत्यधिक गर्मी ({temperature}°C)। दोपहर में सीधी धूप से बचें और खूब पानी पिएं।"
            return f"शहरी परामर्श ({location}): शहर में सामान्य स्थिति है। मौसम '{condition}', तापमान {temperature}°C।"
        if temperature and temperature > 38:
            return f"Urban Advisory for {location}: High heat stress ({temperature}°C). Recommend cooling centers and pausing outdoor construction."
        return f"Urban Advisory for {location}: Standard conditions for city operations. {condition}, {temperature}°C."

    # 6. Default Summary
    if target_lang == "Hindi":
        return f"{location} का मौसम सारांश: वर्तमान स्थिति '{condition}', तापमान {temperature}°C (महसूस {feels_like}°C), आर्द्रता {humidity}%, वायु गति {wind_speed} km/h और वर्षा {precipitation or 0} mm है।"
    return f"Weather Summary for {location}: Current condition is {condition} at {temperature}°C (feels like {feels_like}°C) with {humidity}% humidity, wind speed of {wind_speed} km/h, and {precipitation or 0} mm precipitation."
