import asyncio
import json
import logging
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(
    prefix="/ws",
    tags=["WebSockets"]
)

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Active clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to client: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Initial greeting payload
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to real-time alerting service"
        })
        
        while True:
            # We keep the connection open and wait for incoming messages if any
            data = await websocket.receive_text()
            pass
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Helper function to trigger a mock broadcast for testing
@router.post("/trigger_test_alert")
async def trigger_test_alert(title: str, severity: str, location: str):
    alert_payload = {
        "type": "severe_weather_alert",
        "data": {
            "title": title,
            "severity": severity,
            "location": location,
            "message": f"High probability of {title.lower()} detected in {location}. Please take precautions.",
            "timestamp": "Just now"
        }
    }
    await manager.broadcast(alert_payload)
    return {"status": "Alert broadcasted"}
