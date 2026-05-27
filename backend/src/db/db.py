import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("NEON_CONNECTION_STRING") or os.getenv(
    "DOCKER_CONNECTION_STRING"
)

engine = create_engine(DATABASE_URL)

# TESTING DB CONNECTION
with engine.connect() as conn:

    db = conn.execute(
        text(
            "SELECT current_database(), COUNT(*) FROM information_schema.tables WHERE table_schema='public'"
        )
    ).fetchone()
    print("Connected to DB:", db[0], "| Public tables:", db[1])

    result = conn.execute(text("SELECT COUNT(*) FROM cell_towers")).scalar()
    print("Row count:", result)
