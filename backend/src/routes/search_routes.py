# routes/search.py
import os
import httpx
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

GEOCODE_API_KEY = os.getenv("GEOCODE_API_KEY")
GEOCODE_BASE_URL = "https://geocode.maps.co/search"


@router.get("/fgeocode")
async def search_location(q: str = Query(..., min_length=2)):
    if not GEOCODE_API_KEY:
        raise HTTPException(status_code=500, detail="Geocode API key not configured")

    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                GEOCODE_BASE_URL,
                params={"q": q, "api_key": GEOCODE_API_KEY},
                timeout=10.0,
            )
            res.raise_for_status()
            return res.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Geocode API timed out")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code, detail="Geocode API error"
            )
