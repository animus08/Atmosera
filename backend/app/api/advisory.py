from fastapi import APIRouter, HTTPException

from app.services.weather_service import get_weather_by_location
from app.services.advisory_service import generate_advisories


router = APIRouter(
    prefix="/advisories",
    tags=["Advisories"]
)


@router.get("/")
def get_advisories(location: str):
    """
    Get weather advisories for a location.
    """

    try:
        weather = get_weather_by_location(location)

        advisories = generate_advisories(weather)

        return {
            "success": True,
            "location": location,
            "advisories": advisories,
            "advisory_count": len(advisories)
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Advisory service error: {str(e)}"
        )