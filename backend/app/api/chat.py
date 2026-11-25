from fastapi import APIRouter, HTTPException

from app.services.weather_service import (
    get_weather_by_location,
    get_forecast_by_location,
    get_air_quality_by_location,
)

from app.services.alert_service import check_weather_alerts

from app.services.advisory_service import generate_advisories

from app.services.llm_service import generate_weather_response


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


@router.get("/")
def chat(
    location: str,
    question: str,
    language: str = "English",
    simulate_offline: bool = False,
):
    """
    WeatherGPT AI chat endpoint.
    """

    try:

        # --------------------------------------------------
        # Validate input
        # --------------------------------------------------

        if not location.strip():
            raise HTTPException(
                status_code=400,
                detail="Location cannot be empty.",
            )

        if not question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty.",
            )

        # --------------------------------------------------
        # Extract location from question if present
        # --------------------------------------------------
        
        import re
        extracted_location = location
        
        match = re.search(r'\b(?:in|for|at|of)\s+([a-zA-Z\s]+)(?:\?|$)', question, re.IGNORECASE)
        if match:
            potential_city = match.group(1).strip()
            potential_city = re.sub(r'\b(today|tomorrow|now|currently|please|tell|me)\b', '', potential_city, flags=re.IGNORECASE).strip()
            if len(potential_city) > 2:
                try:
                    from app.utils.location import get_coordinates
                    get_coordinates(potential_city)
                    extracted_location = potential_city
                except Exception:
                    pass

        # --------------------------------------------------
        # Get current weather
        # --------------------------------------------------

        weather = get_weather_by_location(extracted_location)

        # --------------------------------------------------
        # Get forecast
        # --------------------------------------------------

        forecast_data = get_forecast_by_location(
            extracted_location,
            forecast_days=7,
        )

        forecast = forecast_data.get(
            "forecast",
            [],
        )

        # --------------------------------------------------
        # Get alerts
        # --------------------------------------------------

        alerts = check_weather_alerts(
            weather
        )

        # --------------------------------------------------
        # Get advisories
        # --------------------------------------------------

        advisories = generate_advisories(
            weather
        )

        # --------------------------------------------------
        # Get AQI
        # --------------------------------------------------
        try:
            aqi_data = get_air_quality_by_location(extracted_location).get("data", {})
        except Exception:
            aqi_data = {}

        # --------------------------------------------------
        # Prepare data for AI
        # --------------------------------------------------

        weather_for_ai = dict(weather)
        weather_for_ai["forecast"] = forecast
        weather_for_ai["aqi"] = aqi_data

        # --------------------------------------------------
        # Generate AI response
        # --------------------------------------------------

        answer = generate_weather_response(
            weather_data=weather_for_ai,
            user_question=question,
            alerts=alerts,
            advisories=advisories,
            language=language,
            simulate_offline=simulate_offline,
        )

        # --------------------------------------------------
        # Return response
        # --------------------------------------------------

        return {
            "success": True,
            "location": extracted_location,
            "question": question,
            "language": language,
            "answer": answer,
            "weather": weather,
            "forecast": forecast,
            "aqi": aqi_data,
            "alerts": alerts,
            "advisories": advisories,
        }


    except HTTPException:
        raise

    except Exception as error:

        print("")
        print("========================================")
        print("WEATHERGPT CHAT ERROR")
        print("========================================")
        print(type(error).__name__)
        print(str(error))
        print("========================================")
        print("")

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )