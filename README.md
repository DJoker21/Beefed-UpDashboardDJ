# Beefed-UpDashboard

Bonsmara cattle greenhouse-gas (GHG) footprint prediction dashboard.

**Two versions:**

| Version | Stack | Entry |
|---------|-------|-------|
| Streamlit (original) | Python | `bonsmara_dashboard.py` |
| Next.js + FastAPI (new) | Node 18 + Python 3.11 | `/frontend` + `/backend` |

The new version replicates all 7 pages in a dark-themed React SPA backed by a FastAPI REST API, deployable on Railway.

---

## Dashboard pages

| # | Page | Route |
|---|------|-------|
| 1 | Overview — KPIs, GHG distribution, state comparison | `/` |
| 2 | ML Model Metrics — 6 models, R², RMSE, confusion matrices | `/models` |
| 3 | Feature Importance — top-15 features, RF vs GB comparison | `/features` |
| 4 | Predict GHG Footprint — real-time sliders → prediction | `/predict` |
| 5 | Intervention Analysis — adoption, dose-response, CH₄ | `/interventions` |
| 6 | Farmer Benefits — income uplift, carbon credits, herd calculator | `/benefits` |
| 7 | Dataset Explorer — filters, scatter, stats table | `/explorer` |

---

## Project structure

```
/
├── bonsmara_dashboard.py       # Original Streamlit app (still works)
├── ml_results.json             # ML model metrics + predictions
├── bonsmara_interventions.csv  # 1,000 Bonsmara animal records
│
├── backend/                    # FastAPI service
│   ├── main.py
│   ├── requirements.txt
│   └── railway.json
│
└── frontend/                   # Next.js + React service
    ├── pages/                  # index, models, features, predict, interventions, benefits, explorer
    ├── components/             # Navbar, Card, Layout, PlotlyChart
    ├── lib/                    # api.js, theme.js
    ├── styles/globals.css
    ├── package.json
    ├── next.config.js
    └── railway.json
```

---

## Local development

### 1 — Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 2 — Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# Dashboard: http://localhost:3000
```

The frontend reads `NEXT_PUBLIC_API_URL` from `frontend/.env.local` (pre-set to `http://localhost:8000`).

### 3 — Streamlit (legacy)

```bash
pip install streamlit plotly scikit-learn pandas numpy
streamlit run bonsmara_dashboard.py
# http://localhost:8501
```

---

## Railway deployment

Railway deploys the backend and frontend as two **separate services** in the same project.

### Service 1 — Backend

1. Create a new Railway project → "Deploy from GitHub repo"
2. Set the **Root Directory** to `backend`
3. Railway auto-detects Python — set start command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Copy the generated backend URL (e.g. `https://bonsmara-api.up.railway.app`)

### Service 2 — Frontend

1. In the same project → "New Service" → same GitHub repo
2. Set the **Root Directory** to `frontend`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://<your-backend-url>
   ```
4. Railway auto-detects Node / Next.js and runs `npm run build && npm run start`

### Environment variables

| Service | Variable | Example value |
|---------|----------|---------------|
| Frontend | `NEXT_PUBLIC_API_URL` | `https://bonsmara-api.up.railway.app` |
| Backend | *(none required)* | — |

---

## Data files

Both `ml_results.json` and `bonsmara_interventions.csv` must be at the **repository root** (one level above `backend/`). The backend resolves them via `Path(__file__).parent.parent`.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/overview` | KPIs + distributions |
| GET | `/api/models` | All 6 model metrics |
| POST | `/api/predict` | GHG prediction |
| GET | `/api/interventions` | Intervention stats |
| GET | `/api/farmer-benefits` | Per-intervention economics |
| GET | `/api/dataset` | Filtered dataset records |

Full interactive docs at `/docs` (Swagger UI).
