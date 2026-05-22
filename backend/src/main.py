from fastapi import FastAPI
from routes.towers_routes import router as towers_router

app = FastAPI()

app.include_router(towers_router, prefix="/towers", tags=["Towers"])


@app.get("/")
def read_root():
    return {"message": "Server is Live"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
