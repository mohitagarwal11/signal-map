# Signal Map

Interactive map for exploring cellular tower data — heatmaps, per-operator filters, and network recommendations based on your current viewport.

Live: [signal-map-beryl.vercel.app](https://signal-map-beryl.vercel.app/)

## Stack

- **Backend** — Python + FastAPI. Serves tower and heatmap data via a REST API with viewport-aware quantized fetching to reduce load.
- **Frontend** — React + Vite. Renders map layers using MapLibre/Mapbox, consumes backend APIs via `frontend/src/api/towers.api.js`.

## Database

PostgreSQL + PostGIS, with SQLAlchemy (using `text()` for raw spatial queries where needed).

The dataset is ~2.4 million tower records stored in under 500MB. A few things that make this work well at that scale:

- PostGIS spatial indexing on tower coordinates — bounding box queries over millions of rows stay fast.
- Viewport-quantized queries on the backend — instead of querying exact viewport bounds on every map move, bounds are snapped to a grid, which maximizes cache hits and avoids redundant DB calls.
- Neon (serverless Postgres) in production — handles cold starts and connection pooling without a dedicated DB server.
- Docker + local Postgres with PostGIS in dev, keeping the environment consistent.

Latency stays acceptable even on large viewports because the spatial index does the heavy lifting and the quantization keeps repeated queries cheap.

## Features

- Heatmap layer — signal density and strength across regions.
- Raw tower layer — per-tower inspection and filtering by operator.
- Best network recommendation for the current viewport.
- Viewport stats — tower count, per-operator coverage percentages, area (km2), and tower density (towers/km2) for the current viewport.
- Viewport-optimized fetching — limits API calls during map interaction.
- Coming soon: infrastructure scoring and more.

## Project Structure

```
backend/
  routes/towers_routes.py       # API route definitions
  controllers/towers_controller.py
frontend/src/
  api/towers.api.js             # Client-side API functions
  map/                          # Map config and rendering logic
  map/layers/                   # Heatmap and raw tower layer definitions
  services/viewport/            # Viewport handling and fetch optimization
```

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Contributing

PRs welcome. Open an issue first for larger changes.
