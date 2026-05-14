# Beefed-UpDashboard

Beefed-UpDashboard is a Streamlit app for exploring greenhouse gas outcomes in Bonsmara cattle production. It combines model evaluation, intervention analysis, and interactive prediction tools in a single dashboard aimed at comparing baseline emissions with practical mitigation strategies.

## What the dashboard includes

- An overview page with headline metrics, baseline vs intervention comparisons, and quick model summaries
- A model metrics section covering performance tables, comparison charts, actual-vs-predicted plots, confusion matrices, and feature insights
- An interactive prediction workflow for estimating greenhouse gas output under different intervention choices
- An intervention analysis section for adoption patterns, reduction impact, methane and sequestration trends, dose-response behavior, and farmer income uplift views

## Project files

- `bonsmara_dashboard.py`: main Streamlit application
- `ml_results.json`: serialized model outputs and metrics used throughout the dashboard
- `bonsmara_interventions.csv`: intervention and emissions dataset used for analysis and visualization
- `.gitignore`: excludes local Streamlit log files from version control

## Requirements

Install the Python packages used by the app:

```bash
pip install streamlit plotly scikit-learn pandas numpy
```

## Run locally

From the project directory, start the dashboard with:

```bash
streamlit run bonsmara_dashboard.py
```

Streamlit will print a local URL, typically `http://localhost:8501`.

## Data expectations

The app expects these files to be present in the same directory as the dashboard script:

- `ml_results.json`
- `bonsmara_interventions.csv`

If `ml_results.json` is missing, the dashboard stops and shows an error message.

## Notes

This repository currently stores the dashboard script and supporting data files directly at the project root for simple local execution.

## Branch review summary

The current review branch does **not** contain the FastAPI backend, Next.js frontend, or Railway deployment setup described in the earlier planning chat. Compared with `origin/main`, the branch has no functional application changes.

What is currently present:

- A single-file Streamlit dashboard in `bonsmara_dashboard.py`
- Supporting data assets in `ml_results.json` and `bonsmara_interventions.csv`
- Basic repository docs and ignore rules

What is currently **not** present:

- No `backend/` directory or FastAPI application
- No `frontend/` directory, `package.json`, or Next.js code
- No deployment manifests such as `railway.json`, Dockerfiles, or environment templates
- No automated tests for backend APIs or frontend pages

## Verification performed on this branch

- `python -m py_compile bonsmara_dashboard.py` ✅
- Repository structure reviewed against the requested FastAPI + Next.js architecture ✅
- GitHub Actions checked: only the Copilot cloud agent workflow is configured ✅

## What still needs testing

### Current Streamlit app

Before any deployment, manually verify:

1. The dashboard starts with `streamlit run bonsmara_dashboard.py`
2. All five main areas load correctly:
   - Overview
   - Model Metrics
   - Predict GHG Footprint
   - Intervention Analysis
   - Dataset Explorer
3. `ml_results.json` is read successfully and model charts/tables render
4. `bonsmara_interventions.csv` loads and dataset explorer filters work
5. Prediction inputs produce sensible outputs across baseline and intervention scenarios

### Planned FastAPI + Next.js migration

If the enterprise-grade migration is still the goal, these test areas will be needed after implementation:

1. FastAPI endpoint tests for overview, models, prediction, interventions, and dataset routes
2. Frontend build validation with `npm install` and `npm run build`
3. End-to-end checks that the Next.js frontend can call the backend successfully
4. Environment/config validation for deployment URLs, CORS, and data file paths

## Deployment next steps

### Option 1: Deploy what exists now

Deploy the current repository as a Streamlit app. This is the only deployable implementation presently in the branch.

### Option 2: Complete the promised migration first

To reach the planned FastAPI + Next.js architecture, the next implementation steps are:

1. Create a `backend/` FastAPI service that exposes the current Streamlit business logic as API endpoints
2. Create a `frontend/` Next.js app that consumes those endpoints and recreates the dashboard UI
3. Add dependency manifests (`requirements.txt`, `package.json`) and environment variable templates
4. Add deployment configuration for Railway or the chosen platform
5. Add automated tests and a build pipeline before production deployment

Until those steps are complete, Railway deployment for a split backend/frontend architecture is **not ready** from this branch.
