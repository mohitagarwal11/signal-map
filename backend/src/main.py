import logging
import json
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from routes.towers_routes import router as towers_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI()
logging.basicConfig(level=logging.INFO)

INITIAL_HEATMAP_PATH = (
    Path(__file__).resolve().parent / "scripts" / "initial_heatmap.json"
)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(towers_router, prefix="/towers", tags=["Towers"])


@lru_cache(maxsize=1)
def load_initial_heatmap_snapshot():
    try:
        with INITIAL_HEATMAP_PATH.open("r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=503,
            detail="Initial heatmap snapshot is unavailable.",
        ) from error


@app.get("/bootstrap/initial-heatmap")
def get_initial_heatmap_snapshot():
    return load_initial_heatmap_snapshot()


@app.get("/")
def read_root():
    return {"message": "Server is Live"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
