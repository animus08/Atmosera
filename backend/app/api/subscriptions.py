from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from app.services.subscription_service import (
    register_farmer_subscription,
    get_all_farmer_subscriptions,
    delete_farmer_subscription,
    generate_farmer_bulletin,
    broadcast_all_daily_updates,
)

router = APIRouter(
    prefix="/subscriptions",
    tags=["Subscriptions & Kisan Broadcasts"]
)


class RegisterFarmerRequest(BaseModel):
    name: str = Field(..., description="Farmer full name", example="Ramesh Kumar")
    phone: str = Field(..., description="Mobile number with country code", example="+919876543210")
    location: str = Field(..., description="Village / District / City", example="Jaipur")
    crop: str = Field(default="Wheat", description="Primary crop", example="Wheat")
    language: str = Field(default="Hindi", description="Preferred language", example="Hindi")
    channel: str = Field(default="WhatsApp", description="Channel: WhatsApp, SMS, Both", example="WhatsApp")
    daily_time: str = Field(default="06:00 AM", description="Broadcast time", example="06:00 AM")


@router.post("/register")
def register_farmer(req: RegisterFarmerRequest):
    """Register a farmer for automated daily WhatsApp / SMS weather updates."""
    try:
        sub = register_farmer_subscription(
            name=req.name,
            phone=req.phone,
            location=req.location,
            crop=req.crop,
            language=req.language,
            channel=req.channel,
            daily_time=req.daily_time
        )
        
        # Generate instant localized bulletin with WhatsApp deep link
        bulletin = generate_farmer_bulletin(
            name=req.name,
            location=req.location,
            crop=req.crop,
            language=req.language,
            phone=req.phone
        )

        return {
            "success": True,
            "message": f"Farmer {req.name} registered successfully for {req.channel} updates in {req.language}!",
            "data": sub,
            "bulletin": bulletin
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
def list_subscribers():
    """Retrieve all registered farmers."""
    try:
        subscribers = get_all_farmer_subscriptions()
        return {
            "success": True,
            "count": len(subscribers),
            "data": subscribers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{phone}")
def unsubscribe_farmer(phone: str):
    """Unsubscribe a farmer from daily broadcasts."""
    try:
        deleted = delete_farmer_subscription(phone)
        if not deleted:
            raise HTTPException(status_code=404, detail="Phone number not found in subscriptions.")
        return {
            "success": True,
            "message": f"Successfully unsubscribed {phone} from WeatherGPT broadcasts."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preview")
def preview_bulletin(
    name: str = Query("Ramesh Kumar", description="Farmer Name"),
    location: str = Query("Jaipur", description="District/Location"),
    crop: str = Query("Wheat", description="Crop Type"),
    language: str = Query("Hindi", description="Language")
):
    """Preview a customized live weather & crop bulletin before broadcasting."""
    try:
        bulletin = generate_farmer_bulletin(name, location, crop, language)
        return {
            "success": True,
            "data": bulletin
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/broadcast")
def trigger_daily_broadcast():
    """Trigger automated daily morning broadcast for all registered farmers."""
    try:
        report = broadcast_all_daily_updates()
        return {
            "success": True,
            "message": f"Successfully dispatched daily weather bulletins to {report['total_dispatched']} farmers!",
            "data": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
