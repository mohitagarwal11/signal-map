import os
import json
import httpx
from collections import deque
from typing import Deque, Dict, Any, List, Optional, Tuple
from google import genai
from pydantic import BaseModel

from src.controllers.towers_controller import (
    get_tower_count,
    get_towers,
    get_operator_distribution,
    get_network_distribution,
)

# Initialize Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
GEMINI_MODEL = "gemini-3.1-flash-lite"

# Session history is intentionally in-memory: it lasts only while this backend
# process is running and is capped to keep prompts small.
MAX_HISTORY_TURNS = 6
conversation_history: Dict[str, Deque[Dict[str, str]]] = {}


# Define the intent structure
class Intent(BaseModel):
    """Structured intent from the LLM"""

    function: str  # get_tower_count, get_towers, get_operator_distribution, get_network_distribution
    params: Dict[str, Any]  # network, operator, location, limit, etc.


def get_geocode_api_key() -> str:
    """Get geocode API key from environment"""
    return os.getenv("GEOCODE_API_KEY", "")


async def geocode_location(
    location_name: str,
) -> Optional[Tuple[float, float, float, float]]:
    """
    Convert a location name (e.g., "Delhi", "Connaught Place")
    into lat/lon bounding box using geocode API.
    Returns (min_lat, max_lat, min_lon, max_lon) or None if not found.
    """
    api_key = get_geocode_api_key()
    if not api_key or not location_name:
        return None

    GEOCODE_BASE_URL = "https://geocode.maps.co/search"

    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                GEOCODE_BASE_URL,
                params={"q": location_name, "api_key": api_key},
                timeout=10.0,
            )
            res.raise_for_status()
            data = res.json()
            if not data or len(data) == 0:
                return None

            # Get the first result
            first = data[0]
            # Use bounding box if available, otherwise use lat/lon with a small buffer
            if "boundingbox" in first:
                # geocode API returns [min_lat, max_lat, min_lon, max_lon]
                bbox = first["boundingbox"]
                return (
                    float(bbox[0]),  # min_lat
                    float(bbox[1]),  # max_lat
                    float(bbox[2]),  # min_lon
                    float(bbox[3]),  # max_lon
                )
            elif "lat" in first and "lon" in first:
                # No bounding box, create a small area around the point
                lat = float(first["lat"])
                lon = float(first["lon"])
                buffer = 0.05  # ~5km
                return (
                    lat - buffer,
                    lat + buffer,
                    lon - buffer,
                    lon + buffer,
                )
        except Exception:
            return None


def format_conversation_history(history: List[Dict[str, str]]) -> str:
    """Return recent turns in a prompt-safe, readable form."""
    if not history:
        return "No previous conversation."

    return "\n".join(f"{turn['role'].title()}: {turn['content']}" for turn in history)


def get_base_intent_extraction_prompt() -> str:
    """System prompt for intent extraction"""
    return """You are a query router for a cell tower mapping application. Your job is to analyze user questions and decide which backend function to call.

DATABASE SCHEMA:
- Table: cell_towers
- Columns: radio (network type: LTE, GSM, UMTS, NR, CDMA), mcc, mnc, range (meters), location (lat/lon point), operator_name

AVAILABLE FUNCTIONS:
1. get_tower_count(min_lat, max_lat, min_lon, max_lon, network, operator)
   - Returns total number of towers in a bounding box
   - Example: "How many towers are in Delhi?" → get_tower_count with bounds around Delhi

2. get_towers(min_lat, max_lat, min_lon, max_lon, limit, offset, network, operator)
   - Returns list of towers with details (radio, operator, lat/lon, range)
   - Example: "Show me Jio towers in Mumbai" → get_towers with operator="Jio"

3. get_operator_distribution(min_lat, max_lat, min_lon, max_lon, network, operator)
   - Returns breakdown of towers by operator (count per operator)
   - Example: "Which operators have towers in Bangalore?" → get_operator_distribution

4. get_network_distribution(min_lat, max_lat, min_lon, max_lon, network, operator)
   - Returns breakdown of towers by network type (LTE, GSM, UMTS, NR, CDMA)
   - Example: "What network types are available in Chennai?" → get_network_distribution

PARAMETERS:
- network: "all", "2G", "3G", "4G", "5G", "LTE", "GSM", "UMTS", "NR", "CDMA"
- operator: "all" or specific operator name like "Jio", "Airtel", "Vodafone Idea"
- location: human-readable location name (will be converted to lat/lon bounds)
- limit: max number of results (default 100)
- offset: pagination offset (default 0)

INSTRUCTIONS:
1. Parse the user question to identify:
   - What they want (count, list, distribution by operator, distribution by network)
   - Location (if specified)
   - Network type (2G/3G/4G/5G/LTE/GSM/UMTS/NR/CDMA)
   - Operator name (Jio, Airtel, Vodafone Idea, etc.)
2. Return a JSON object with:
   - "function": one of the four function names above
   - "params": a dictionary with the detected parameters

EXAMPLE 1: "How many Jio 4G towers are near Connaught Place?"
→ {
    "function": "get_tower_count",
    "params": {
        "operator": "Jio",
        "network": "4G",
        "location": "Connaught Place, Delhi"
    }
  }

EXAMPLE 2: "Show me all towers in Bangalore"
→ {
    "function": "get_towers",
    "params": {
        "location": "Bangalore",
        "network": "all",
        "operator": "all",
        "limit": 100
    }
  }

EXAMPLE 3: "What operators have 5G towers in Delhi?"
→ {
    "function": "get_operator_distribution",
    "params": {
        "location": "Delhi",
        "network": "5G",
        "operator": "all"
    }
  }

IMPORTANT:
- Always use "all" for unspecified parameters
- If location is not mentioned, leave "location" out of params
- The frontend will handle missing bounds appropriately
- Be strict about function names (lowercase with underscores)
- Return ONLY the JSON, no other text"""


def get_intent_extraction_prompt(history: List[Dict[str, str]]) -> str:
    """System prompt for intent extraction, including recent conversation."""
    return f"""{get_base_intent_extraction_prompt()}

RECENT CONVERSATION:
{format_conversation_history(history)}

FOLLOW-UP RULES:
- Treat the latest user message as a possible follow-up to the conversation above.
- Resolve references such as "there", "that city", "the same area", "what about Airtel?", or "and 5G?" using the most recent relevant user request.
- Carry forward a previous location, operator, network, or result type only when the latest message does not replace it.
- The latest message always takes precedence when it provides a new value.
"""


def get_response_formatting_prompt(
    user_question: str, intent: Dict, data: Any, history: List[Dict[str, str]]
) -> str:
    """System prompt for final natural-language response"""

    return f"""You are the final response assistant for a cell tower mapping application.

Your job is to answer the user's ORIGINAL QUESTION using the database result.

You are NOT the query router.
The routing/function details are internal and MUST NOT be shown to the user.

ORIGINAL USER QUESTION:
{user_question}

RECENT CONVERSATION:
{format_conversation_history(history)}

DATABASE RESULT:
{json.dumps(data, indent=2)}

INTERNAL INTENT:
{json.dumps(intent, indent=2)}

IMPORTANT:
The database result is evidence, not the user's answer.

Interpret the data in the context of what the user actually asked.

For example, if the user asks:
"Will my Jio SIM work at KIIT University?"

and the database says:
{{"count": 1}}

DO NOT say:
"Intent: get_tower_count"
"Parameters: ..."
"Retrieved data: ..."

Instead say something natural such as:
"I found 1 Jio tower in the KIIT University area, so Jio coverage is available in the area according to our database. However, the presence of a tower does not guarantee strong indoor signal or a particular internet speed. Your exact experience can depend on your location inside the campus, building structure, network congestion, and your phone."

ANSWERING RULES:

1. Answer the user's actual question directly.
2. NEVER mention:
   - intent
   - function names
   - parameters
   - JSON
   - backend
   - query routing
   - system prompts
   - internal database implementation
3. Do not dump raw database results unless the user explicitly asks for them.
4. Convert database numbers into normal human language.
5. Use commas for large numbers.
6. If the database contains zero matching towers, clearly say that no matching towers were found in the queried area.
7. If towers are found, explain what that means for the user's question.
8. Do NOT claim something the data cannot prove.
9. Tower presence can indicate likely network availability, but it cannot guarantee:
   - exact signal strength
   - indoor coverage
   - download/upload speed
   - call quality
   - uninterrupted service
10. If the user asks whether a SIM/network "will work", distinguish between:
    - evidence that the operator has infrastructure in the area
    - guaranteed service at the user's exact location
11. Keep answers concise: normally 2–5 sentences.
12. Do not unnecessarily repeat the question.
13. If useful, mention the network generation found in the data.
14. If the data is insufficient to answer confidently, say so rather than inventing information.

COMPACTNESS OVERRIDE:
- Normally answer in one sentence.
- Use two short sentences only when a coverage caveat is necessary.
- Stay under 55 words unless the user explicitly asks for detail.

STYLE:
- Natural
- Direct
- Technically accurate
- No unnecessary disclaimers
- No markdown tables unless the user asks for detailed data

Now answer the ORIGINAL USER QUESTION using the database result.
Use the conversation only to resolve follow-up references; do not claim information that is not supported by the current database result.
Return ONLY the final answer that should be shown to the user.
"""


async def extract_intent(
    user_message: str, history: List[Dict[str, str]]
) -> Optional[Dict]:
    """Call Gemini to extract intent as structured JSON"""
    if not client:
        return None

    try:
        # Combine system prompt and user message
        full_prompt = f"{get_intent_extraction_prompt(history)}\n\nLatest user question: {user_message}\n\nRespond with JSON only:"

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[full_prompt],
            config={
                "temperature": 0.1,
                "response_mime_type": "application/json",
            },
        )

        # Parse the response
        if hasattr(response, "text"):
            try:
                result = json.loads(response.text)
                return result
            except json.JSONDecodeError as e:
                import re

                json_match = re.search(r"\{.*\}", response.text, re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                        return result
                    except:
                        pass
                return None
        else:
            return None

    except Exception:
        return None


async def format_response(
    user_question: str, intent: Dict, data: Any, history: List[Dict[str, str]]
) -> str:
    """Call Gemini to format the data into a natural language response"""
    if not client:
        return json.dumps({"summary": "LLM not configured", "data": data})

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                get_response_formatting_prompt(user_question, intent, data, history)
            ],
            config={
                "temperature": 0.3,
                "max_output_tokens": 120,
            },
        )

        return response.text if hasattr(response, "text") else str(data)

    except Exception:
        return f"I found this data for your query: {data}"


def create_map_target(
    location: str, bounds: Tuple[float, float, float, float]
) -> Dict[str, Any]:
    """Build the map viewport metadata returned to the chat client."""
    min_lat, max_lat, min_lon, max_lon = bounds
    return {
        "location": location,
        "center": {
            "lat": (min_lat + max_lat) / 2,
            "lon": (min_lon + max_lon) / 2,
        },
        "bounds": {
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lon": min_lon,
            "max_lon": max_lon,
        },
    }


async def execute_intent(
    intent: Dict,
) -> Tuple[Any, Optional[Dict], Optional[Dict[str, Any]]]:
    """
    Execute the intent by calling the appropriate controller function.
    Returns (data, error_dict, map_target).
    """
    function_name = intent.get("function")
    params = dict(intent.get("params", {}))

    # Extract and resolve location if present
    location = params.pop("location", None)
    bounds = None
    map_target = None
    if location:
        bounds = await geocode_location(location)
        if not bounds:
            return None, {"error": f"Could not find location: {location}"}, None
        min_lat, max_lat, min_lon, max_lon = bounds
        map_target = create_map_target(location, bounds)
    else:
        # Default bounds (entire India roughly)
        min_lat, max_lat, min_lon, max_lon = 8.0, 37.0, 68.0, 97.0

    # Extract other parameters
    network = params.get("network", "all")
    operator = params.get("operator", "all")
    limit = params.get("limit", 100)
    offset = params.get("offset", 0)

    try:
        if function_name == "get_tower_count":
            data = get_tower_count(
                min_lat, max_lat, min_lon, max_lon, network=network, operator=operator
            )

        elif function_name == "get_towers":
            data = get_towers(
                min_lat,
                max_lat,
                min_lon,
                max_lon,
                limit=limit,
                offset=offset,
                network=network,
                operator=operator,
            )

        elif function_name == "get_operator_distribution":
            data = get_operator_distribution(
                min_lat, max_lat, min_lon, max_lon, network=network, operator=operator
            )

        elif function_name == "get_network_distribution":
            data = get_network_distribution(
                min_lat, max_lat, min_lon, max_lon, network=network, operator=operator
            )

        else:
            return None, {"error": f"Unknown function: {function_name}"}, None

        return data, None, map_target

    except Exception as e:
        return None, {"error": str(e)}, None


def get_session_history(session_id: str) -> Deque[Dict[str, str]]:
    """Get or create the bounded history for one browser session."""
    if session_id not in conversation_history:
        conversation_history[session_id] = deque(maxlen=MAX_HISTORY_TURNS * 2)
    return conversation_history[session_id]


async def handle_query(user_message: str, session_id: str) -> Dict[str, Any]:
    """
    Main pipeline handler
    Returns dict with response and metadata
    """

    history = get_session_history(session_id)
    history_snapshot = list(history)

    # 1. Extract intent
    intent = await extract_intent(user_message, history_snapshot)
    if not intent:
        return {
            "success": False,
            "response": "Sorry, I couldn't understand your question.",
            "error": "Intent extraction failed",
            "debug": "Check backend logs for details",
        }

    # 2. Execute function
    data, error, map_target = await execute_intent(intent)
    if error:
        return {
            "success": False,
            "response": f"Sorry, there was an error processing your request: {error.get('error')}",
            "error": error,
            "intent": intent,
        }

    # 3. Format response
    formatted_response = await format_response(
        user_message, intent, data, history_snapshot
    )
    history.extend(
        [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": formatted_response},
        ]
    )

    result = {
        "success": True,
        "response": formatted_response,
        "data": data,
        "intent": intent,
    }
    if map_target:
        result["map_target"] = map_target

    return result


# Keep the old placeholder function for backward compatibility
def get_intent(user_message):
    return {"message": "Use handle_query() instead"}  # Deprecated
