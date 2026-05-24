import logging
from fastapi import FastAPI
from routes.towers_routes import router as towers_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI()
logging.basicConfig(level=logging.INFO)

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
app.mount(
    "/static",
    StaticFiles(directory=Path(__file__).resolve().parent / "static"),
    name="static",
)


@app.get("/")
def read_root():
    return {"message": "Server is Live"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
