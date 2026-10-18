# HeatShield AI — Heat safety operations prototype

React + Vite + TypeScript manager dashboard and FastAPI backend. Includes measured-component WBGT screening, current-weather-derived heat screening, illustrative work/rest guidance, timecard/wage estimates, and local browser notifications.

> **Safety and demo notice:** Dashboard seed values are illustrative. Weather-derived values are rough screening estimates and are **not WBGT measurements** or regulatory exposure determinations. Never use them to declare a site safe. Use calibrated on-site WBGT instrumentation, applicable local standards, and a competent occupational-safety professional. Work/rest schedules and wage estimates are illustrative and require local review. Browser notifications are local to the device; remote mobile push/SMS is not configured. API timecards are not persisted across restarts.

## Run locally

Backend terminal (Python 3.11+ recommended):
```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend terminal (Node.js 20+ recommended):
```bash
cd frontend/manager-dashboard
npm install
npm run dev
```

Open http://localhost:5173. API docs: http://127.0.0.1:8000/docs. Weather estimate uses Open-Meteo and needs internet access. Set `VITE_API_BASE_URL` if the API is hosted elsewhere; see `.env.example`.

## API routes
- `GET /health`
- `GET /api/v1/overview`
- `POST /api/v1/heat-risk` — measured dry-bulb, natural wet-bulb and globe temperature inputs
- `POST /api/v1/weather-estimate` — latitude/longitude; rough weather estimate, not measured WBGT
- `GET /api/v1/work-rest/{LOW|MODERATE|HIGH|EXTREME}` — illustrative guidance
- `POST /api/v1/timecards` — in-memory timecard and wage estimate
- `GET /api/v1/alerts/{LOW|MODERATE|HIGH|EXTREME}?site=...` — alert message payload, not delivered

## GitHub and LinuxONE deployment
1. Create a repository on GitHub, then from the project root run `git init`, `git add .`, `git status`, `git commit -m "HeatShield AI prototype"`, `git branch -M main`, `git remote add origin https://github.com/YOUR-USERNAME/HeatShield-AI.git`, and `git push -u origin main`. Inspect `git status` and never commit `.env`, credentials, `.venv`, `node_modules`, or build output.
2. On LinuxONE, install a supported Python and Node.js version. Clone the repo, create a virtual environment in `backend`, install `backend/requirements.txt`, and run `uvicorn app.main:app --host 0.0.0.0 --port 8000` behind a TLS reverse proxy. Build the frontend with `npm ci` (or `npm install`) and `npm run build`; serve `frontend/manager-dashboard/dist` via a web server. Set `VITE_API_BASE_URL` to the public HTTPS API base before building, and update backend CORS allowed origins in `app/main.py` to your actual dashboard domain. Use HTTPS for browser notifications. Do not expose an unprotected prototype API to the public internet; add authentication, persistence, rate limits, logging and operational monitoring before production.

## Production work still required
Authentication/authorization, persistent database-backed timecards and alert audit trail, actual push/SMS provider integration, calibrated sensor ingestion, validated site-specific work/rest policies, local wage/overtime compliance, and production security/observability are not included.


## Saved timecards and wage ledger update

- `POST /api/v1/timecards` saves manager-recorded work/rest minutes, hourly rate, optional temperature/humidity context, notes, and timestamp in a local SQLite database (`backend/heatshield.db`).
- `GET /api/v1/timecards` lists saved records.
- `GET /api/v1/wage-ledger` derives totals and per-record wage estimates from those saved timecards; the wage screen does not ask for duplicate entries.
- The workforce screen's work/rest values are manager-recorded or should be populated by a separately validated worker-activity sensor. Ambient temperature and humidity alone cannot reliably determine whether an individual worker is physically working or resting. Do not represent these values as automatically detected.
- Wage values are estimates, not payroll output; apply relevant local wage, overtime, and break rules before use. SQLite is suitable for a single-instance demo; production multi-user deployment should use a managed database, access controls, backups, and audit policy.
