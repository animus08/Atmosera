def generate_advisories(weather):
    """
    Generate practical weather-based advisories.

    These recommendations are rule-based and use
    current weather conditions.
    """

    advisories = []

    temperature = weather.get("temperature")
    feels_like = weather.get("apparent_temperature")
    humidity = weather.get("humidity")
    precipitation = weather.get("precipitation")
    wind_speed = weather.get("wind_speed")
    condition = weather.get("condition", "")

    # ---------------------------------------------------------
    # HEAT ADVISORY
    # ---------------------------------------------------------

    if temperature is not None:

        if temperature >= 38:
            advisories.append({
                "type": "heat",
                "priority": "high",
                "title": "High Heat",
                "advice": (
                    "Avoid prolonged outdoor activity, "
                    "stay hydrated, and protect crops from "
                    "excessive heat where possible."
                )
            })

        elif temperature >= 33:
            advisories.append({
                "type": "heat",
                "priority": "medium",
                "title": "Warm Conditions",
                "advice": (
                    "Stay hydrated during outdoor work and "
                    "monitor crops for heat stress."
                )
            })

    # ---------------------------------------------------------
    # HUMIDITY ADVISORY
    # ---------------------------------------------------------

    if humidity is not None:

        if humidity >= 85:
            advisories.append({
                "type": "humidity",
                "priority": "medium",
                "title": "High Humidity",
                "advice": (
                    "High humidity can increase the risk of "
                    "fungal diseases in crops. Monitor plants "
                    "closely and avoid unnecessary irrigation."
                )
            })

    # ---------------------------------------------------------
    # RAIN / IRRIGATION ADVISORY
    # ---------------------------------------------------------

    if precipitation is not None:

        if precipitation >= 5:
            advisories.append({
                "type": "rain",
                "priority": "high",
                "title": "Significant Rainfall",
                "advice": (
                    "Significant rainfall is occurring. "
                    "Avoid unnecessary irrigation and check "
                    "fields for waterlogging."
                )
            })

        elif precipitation > 0:
            advisories.append({
                "type": "rain",
                "priority": "low",
                "title": "Light Rainfall",
                "advice": (
                    "Some rainfall is present. Check soil "
                    "moisture before irrigating crops."
                )
            })

    # ---------------------------------------------------------
    # WIND ADVISORY
    # ---------------------------------------------------------

    if wind_speed is not None:

        if wind_speed >= 40:
            advisories.append({
                "type": "wind",
                "priority": "high",
                "title": "Strong Winds",
                "advice": (
                    "Strong winds may damage crops and "
                    "structures. Avoid spraying pesticides "
                    "during strong winds."
                )
            })

        elif wind_speed >= 20:
            advisories.append({
                "type": "wind",
                "priority": "medium",
                "title": "Moderate Winds",
                "advice": (
                    "Moderate winds are present. Use caution "
                    "when spraying agricultural chemicals."
                )
            })

    # ---------------------------------------------------------
    # GENERAL WEATHER ADVISORY
    # ---------------------------------------------------------

    if not advisories:
        advisories.append({
            "type": "general",
            "priority": "low",
            "title": "Weather Conditions Look Normal",
            "advice": (
                "No significant weather-related precautions "
                "are currently required."
            )
        })

    return advisories