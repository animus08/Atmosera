from fastapi import APIRouter, HTTPException

from app.services.weather_service import get_weather_by_location
from app.services.alert_service import check_weather_alerts, get_national_synoptic_bulletins


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


@router.get("/")
def get_alerts(location: str):
    """
    Get weather alerts for a given location, combined with India-wide national synoptic advisories.
    """
    try:
        # Get current weather
        weather = get_weather_by_location(location)

        # Check weather conditions for local alerts
        local_alerts = check_weather_alerts(weather)
        national_alerts = get_national_synoptic_bulletins()

        return {
            "success": True,
            "location": location,
            "alerts": local_alerts,
            "national_alerts": national_alerts,
            "alert_count": len(local_alerts),
            "national_count": len(national_alerts)
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Alert service error: {str(e)}"
        )


@router.get("/national")
def get_national_alerts():
    """
    Get active India-wide national synoptic weather bulletins across all meteorological zones.
    """
    try:
        national_alerts = get_national_synoptic_bulletins()
        return {
            "success": True,
            "count": len(national_alerts),
            "bulletins": national_alerts
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"National alerts service error: {str(e)}"
        )