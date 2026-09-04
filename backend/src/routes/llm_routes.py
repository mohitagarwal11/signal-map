from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from src.controllers.llm_controller import handle_query

router = APIRouter()


class QueryRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


@router.post("/query")
async def query_llm(request: QueryRequest):
    """
    Handle natural language queries about cell towers.

    Example queries:
    - "How many 4G towers are in Delhi?"
    - "Show me Jio towers in Mumbai"
    - "What operators have 5G towers in Bangalore?"
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        session_id = request.session_id or str(uuid4())
        result = await handle_query(request.message, session_id)

        # Return the response in a clean format
        response_data = {
            "success": result["success"],
            "response": result["response"],
            "intent": result.get("intent"),
            "data": result.get("data"),
            "session_id": session_id,
        }

        if result.get("map_target"):
            response_data["map_target"] = result["map_target"]

        # Remove error field from successful responses
        if result["success"]:
            response_data.pop("error", None)
        else:
            response_data["error"] = result.get("error")

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
