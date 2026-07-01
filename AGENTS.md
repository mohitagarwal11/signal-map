# AGENTS.md

## Running Locally

```bash
# Backend (Python/FastAPI)
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload

# Frontend (React/Vite)
cd frontend
npm install
npm run dev
```

## Verification Commands

- `npm run lint` (frontend) - ESLint on entire `src/`
- Backend has no test/lint commands; add to `requirements.txt` for future

## Architecture Notes

- **Frontend**: React 19 + Vite, MapLibre via Mappls SDK, TailwindCSS v4
- **Backend**: FastAPI + SQLAlchemy, PostgreSQL/PostGIS (`cell_towers` table)
- **Env vars**: Backend uses `NEON_CONNECTION_STRING` or `DOCKER_CONNECTION_STRING`, `FRONTEND_URL`, `GEOCODE_API_KEY`

## Key Paths

- Frontend entry: `frontend/src/App.jsx` → `frontend/src/pages/Dashboard.jsx`
- Map component: `frontend/src/components/Map.jsx`
- Backend entry: `backend/src/main.py`
- Tower queries: `backend/src/controllers/towers_controller.py`
- Viewport logic: `frontend/src/services/viewport/viewportController.js`