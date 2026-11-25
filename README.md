# Bundesliga Analytics — 2026/27

Full-stack interactive Bundesliga (2026–27 season) analytics dashboard built with **FastAPI**, **SQLite**, and **React (Vite + TypeScript + Tailwind CSS + Recharts)**.

## Project Structure

```text
bundesliga/
├── backend/
│   ├── database.py        # SQLite schema & connection helper
│   ├── sync_data.py       # Idempotent OpenFootball + ESPN data ingestion
│   ├── main.py            # FastAPI app & analytics endpoints
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # HeaderBar, LeagueTable, AttackDefenseChart, MatchdayExplorer, ClubDeepDive, TeamBadge
    │   ├── api.ts
    │   ├── types.ts
    │   └── App.tsx
    └── package.json
```

## Running Locally

### 1. Backend (FastAPI + SQLite)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python sync_data.py
.\.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

API docs are available at `http://127.0.0.1:8000/docs`.

### 2. Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173/` in your browser.
