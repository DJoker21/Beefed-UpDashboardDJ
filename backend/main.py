"""
Bonsmara GHG Dashboard — FastAPI Backend
Run with: uvicorn main:app --reload
Serves data from ml_results.json and bonsmara_interventions.csv
"""

import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Data loading (cached at startup) ────────────────────────────
BASE_DIR = Path(__file__).parent.parent  # repo root

_ml_data: dict = {}
_df: pd.DataFrame = pd.DataFrame()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _ml_data, _df
    json_path = BASE_DIR / "ml_results.json"
    csv_path  = BASE_DIR / "bonsmara_interventions.csv"

    if not json_path.exists():
        raise RuntimeError(f"ml_results.json not found at {json_path}")
    with open(json_path) as f:
        _ml_data = json.load(f)

    if csv_path.exists():
        _df = pd.read_csv(csv_path)
    else:
        _df = pd.DataFrame()

    yield


# ─── App init ────────────────────────────────────────────────────
app = FastAPI(
    title="Bonsmara GHG Dashboard API",
    description="Greenhouse gas footprint prediction for Bonsmara cattle (South Africa)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_ml_data() -> dict:
    if not _ml_data:
        raise HTTPException(status_code=503, detail="ML data not loaded")
    return _ml_data


def get_df() -> pd.DataFrame:
    if _df.empty:
        raise HTTPException(status_code=503, detail="CSV dataset not loaded")
    return _df


# ─── Helper ──────────────────────────────────────────────────────
def _int_stats(df: pd.DataFrame, col: str) -> dict:
    """Compute per-intervention economic + environmental stats from CSV."""
    sub = df[df[col] == "Yes"]
    if sub.empty:
        return {}

    bl_ghg = sub["Baseline_Net_GHG_CO2e_kg"].mean()
    in_ghg = sub["Int_Net_GHG_CO2e_kg"].mean()
    bl_ch4 = sub["Baseline_Total_CH4_kg"].mean()
    in_ch4 = sub["Int_Total_CH4_kg"].mean()
    bl_seq = sub["Baseline_Carbon_Seq_kg"].mean()
    in_seq = sub["Int_Carbon_Seq_kg"].mean()
    bl_ci  = sub["Baseline_Carbon_Intensity"].mean()
    in_ci  = sub["Int_Carbon_Intensity"].mean()
    bl_adg = sub["Avg_Daily_Gain_kg"].mean()
    in_adg = sub["Int_ADG_kg"].mean()

    ghg_red_pct  = (bl_ghg - in_ghg) / bl_ghg * 100 if bl_ghg != 0 else 0.0
    ch4_red_pct  = (bl_ch4 - in_ch4) / bl_ch4 * 100 if bl_ch4 != 0 else 0.0
    seq_inc_pct  = (in_seq - bl_seq)  / bl_seq  * 100 if bl_seq  != 0 else 0.0
    ci_red_pct   = (bl_ci  - in_ci)   / bl_ci   * 100 if bl_ci   != 0 else 0.0
    adg_inc_pct  = (in_adg - bl_adg)  / bl_adg  * 100 if bl_adg  != 0 else 0.0

    # Economic model (matches Streamlit logic exactly)
    beef_price   = 65.0
    slaughter_kg = 450.0
    base_revenue = slaughter_kg * beef_price  # R29,250

    ch4_premium_pct  = ch4_red_pct * 0.30
    adg_income_gain  = adg_inc_pct / 100 * slaughter_kg * beef_price * 0.5
    carbon_credit_rpa = (bl_ghg - in_ghg) / 1000 * 250
    total_income_uplift = base_revenue * ch4_premium_pct / 100 + adg_income_gain + carbon_credit_rpa
    total_income_pct    = total_income_uplift / base_revenue * 100

    return {
        "bl_ghg": round(bl_ghg, 2),
        "in_ghg": round(in_ghg, 2),
        "ghg_red_pct": round(ghg_red_pct, 2),
        "bl_ch4": round(bl_ch4, 3),
        "in_ch4": round(in_ch4, 3),
        "ch4_red_pct": round(ch4_red_pct, 2),
        "bl_seq": round(bl_seq, 2),
        "in_seq": round(in_seq, 2),
        "seq_inc_pct": round(seq_inc_pct, 2),
        "ci_red_pct": round(ci_red_pct, 2),
        "bl_adg": round(bl_adg, 4),
        "in_adg": round(in_adg, 4),
        "adg_inc_pct": round(adg_inc_pct, 2),
        "ch4_premium_pct": round(ch4_premium_pct, 4),
        "carbon_credit_rpa": round(carbon_credit_rpa, 2),
        "adg_income_gain": round(adg_income_gain, 2),
        "total_income_uplift": round(total_income_uplift, 2),
        "total_income_pct": round(total_income_pct, 4),
    }


# ─── Health check ─────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": bool(_ml_data), "csv_loaded": not _df.empty}


# ─── GET /api/overview ────────────────────────────────────────────
@app.get("/api/overview")
def overview():
    data = get_ml_data()
    ds   = data["dataset"]
    return {
        "n_total":           ds["n_total"],
        "n_states":          ds["n_states"],
        "mean_baseline_ghg": ds["mean_baseline_ghg"],
        "mean_int_ghg":      ds["mean_int_ghg"],
        "mean_reduction_pct": ds["mean_reduction_pct"],
        "mean_ch4":          ds["mean_ch4"],
        "mean_seq":          ds["mean_seq"],
        "ghg_distribution":  ds["ghg_distribution"],
        "ghg_by_state":      ds["ghg_by_state"],
        "ghg_class_dist":    ds.get("ghg_class_dist", {"Low": 333, "Medium": 334, "High": 333}),
        "reduction_by_int":  ds["reduction_by_int"],
        "intervention_adoption": ds["intervention_adoption"],
        "states":            ds["states"],
        "models_summary": {
            name: {
                "reg_r2":        m["reg_r2"],
                "cls_accuracy":  m["cls_accuracy"],
            }
            for name, m in data["models"].items()
        },
    }


# ─── GET /api/models ─────────────────────────────────────────────
@app.get("/api/models")
def models_endpoint():
    data   = get_ml_data()
    result = {}
    for name, m in data["models"].items():
        result[name] = {
            "type":           m.get("type", ""),
            "architecture":   m.get("architecture", ""),
            "reg_r2":         m["reg_r2"],
            "reg_rmse":       m["reg_rmse"],
            "reg_mae":        m["reg_mae"],
            "cls_accuracy":   m["cls_accuracy"],
            "cls_f1":         m["cls_f1"],
            "feature_importance": m.get("feature_importance", {}),
            "y_test":         m.get("y_test", []),
            "y_pred":         m.get("y_pred", []),
            "confusion_matrix": m.get("confusion_matrix", []),
            "cv_r2_mean":     m.get("cv_r2_mean", m["reg_r2"]),
            "cv_r2_std":      m.get("cv_r2_std", 0),
            "cv_r2_scores":   m.get("cv_r2_scores", [m["reg_r2"]] * 5),
        }
    return {
        "models":       result,
        "class_labels": data.get("class_labels", ["High", "Low", "Medium"]),
    }


# ─── POST /api/predict ───────────────────────────────────────────
class PredictInput(BaseModel):
    weight:  float = Field(350, ge=150, le=600)
    adg:     float = Field(0.85, ge=0.3, le=1.4)
    bcs:     float = Field(3.5, ge=1.0, le=5.0)
    age:     float = Field(36, ge=6, le=120)
    cp:      float = Field(11.0, ge=7.0, le=16.0)
    tdn:     float = Field(61.0, ge=50, le=72)
    dmi:     float = Field(8.0, ge=3.0, le=16.0)
    temp:    float = Field(25, ge=14, le=32)
    rain:    float = Field(500, ge=300, le=700)
    humid:   float = Field(55, ge=30, le=80)
    housing: str   = Field("Extensive")
    grazing: str   = Field("Rotational")
    veld:    str   = Field("Fair")
    moringa: bool  = False
    tannin:  bool  = False
    genetic: bool  = False
    solar:   bool  = False


def _predict_ghg(p: dict, mean_baseline: float) -> float:
    """Approximate GHG prediction — matches Streamlit logic exactly."""
    base = mean_baseline

    weight_eff  = (p["weight"] - 350) * 0.8
    adg_eff     = (p["adg"]    - 0.85) * -200
    bcs_eff     = (p["bcs"]    - 3.5)  * -80
    age_eff     = (p["age"]    - 36)   * 1.5
    cp_eff      = (p["cp"]     - 11)   * -25
    tdn_eff     = (p["tdn"]    - 61)   * -15
    dmi_eff     = (p["dmi"]    - 8)    * 180
    temp_eff    = (p["temp"]   - 25)   * 30
    rain_eff    = (p["rain"]   - 500)  * -0.4
    humid_eff   = (p["humid"]  - 55)   * 5

    housing_map = {"Extensive": 0, "Semi-intensive": 200, "Intensive": 400}
    grazing_map = {"Continuous": 100, "Rotational": -150, "Strip": -200}
    housing_eff = housing_map.get(p["housing"], 0)
    grazing_eff = grazing_map.get(p["grazing"], 0)

    moringa_eff = -320 if p["moringa"] else 0
    tannin_eff  = -420 if p["tannin"]  else 0
    genetic_eff = -300 if p["genetic"] else 0
    solar_eff   = -160 if p["solar"]   else 0

    veld_map = {"Good": -400, "Fair": -200, "Poor": -80}
    seq_eff  = veld_map.get(p["veld"], -200)

    prediction = (
        base + weight_eff + adg_eff + bcs_eff + age_eff
        + cp_eff + tdn_eff + dmi_eff
        + temp_eff + rain_eff + humid_eff
        + housing_eff + grazing_eff + seq_eff
        + moringa_eff + tannin_eff + genetic_eff + solar_eff
    )
    return max(200.0, prediction)


@app.post("/api/predict")
def predict(body: PredictInput):
    data = get_ml_data()
    mean_baseline = data["dataset"]["mean_baseline_ghg"]
    params = body.model_dump()

    pred = _predict_ghg(params, mean_baseline)
    params_no_int = {**params, "moringa": False, "tannin": False, "genetic": False, "solar": False}
    pred_no_int = _predict_ghg(params_no_int, mean_baseline)
    reduction = pred_no_int - pred

    if pred < 2000:
        ghg_class = "LOW"
    elif pred < 3500:
        ghg_class = "MEDIUM"
    else:
        ghg_class = "HIGH"

    breakdown = {
        "Moringa": -320 if params["moringa"] else 0,
        "Tannin":  -420 if params["tannin"]  else 0,
        "Genetic": -300 if params["genetic"] else 0,
        "Solar":   -160 if params["solar"]   else 0,
    }

    return {
        "prediction_ghg":    round(pred, 1),
        "prediction_no_int": round(pred_no_int, 1),
        "ghg_class":         ghg_class,
        "reduction":         round(reduction, 1),
        "reduction_pct":     round(reduction / pred_no_int * 100, 2) if pred_no_int > 0 else 0,
        "mean_baseline_ghg": mean_baseline,
        "breakdown":         breakdown,
    }


# ─── GET /api/interventions ──────────────────────────────────────
@app.get("/api/interventions")
def interventions():
    data = get_ml_data()
    ds   = data["dataset"]
    return {
        "adoption":       ds["intervention_adoption"],
        "n_total":        ds["n_total"],
        "reduction_by_int": ds["reduction_by_int"],
        "mean_baseline_ghg": ds["mean_baseline_ghg"],
        "mean_reduction_pct": ds["mean_reduction_pct"],
        "ghg_by_state":   ds["ghg_by_state"],
        "ch4_by_forage":  ds.get("ch4_by_forage", {}),
        "ghg_by_housing": ds.get("ghg_by_housing", {}),
        "seq_by_grazing": ds.get("seq_by_grazing", {}),
    }


# ─── GET /api/farmer-benefits ─────────────────────────────────────
@app.get("/api/farmer-benefits")
def farmer_benefits():
    df = get_df()

    int_keys = [
        ("Intervention_Moringa", "Moringa"),
        ("Intervention_Tannin",  "Tannin"),
        ("Intervention_Genetic", "Genetic"),
        ("Intervention_Solar",   "Solar"),
    ]
    stats = {name: _int_stats(df, col) for col, name in int_keys}

    overall_ghg_red = float(df["Delta_Pct_Net_GHG_Reduction"].mean())
    overall_ch4_red = (
        (df["Baseline_Total_CH4_kg"].mean() - df["Int_Total_CH4_kg"].mean())
        / df["Baseline_Total_CH4_kg"].mean() * 100
    )
    overall_seq_inc = (
        (df["Int_Carbon_Seq_kg"].mean() - df["Baseline_Carbon_Seq_kg"].mean())
        / df["Baseline_Carbon_Seq_kg"].mean() * 100
    )

    return {
        "stats":              stats,
        "overall_ghg_red":    round(overall_ghg_red, 2),
        "overall_ch4_red":    round(overall_ch4_red, 2),
        "overall_seq_inc":    round(overall_seq_inc, 2),
        "base_revenue":       29250.0,
        "beef_price":         65.0,
        "slaughter_kg":       450.0,
    }


# ─── GET /api/dataset ─────────────────────────────────────────────
@app.get("/api/dataset")
def dataset(
    state: Optional[str] = Query(None, description="Comma-separated states"),
    sex:   Optional[str] = Query(None, description="Comma-separated sexes"),
    intervention: Optional[str] = Query(
        None,
        description="all | any | none | moringa | tannin | genetic | solar",
    ),
    limit: int = Query(100, ge=1, le=1000),
):
    df = get_df().copy()

    if state:
        states = [s.strip() for s in state.split(",")]
        df = df[df["State"].isin(states)]

    if sex:
        sexes = [s.strip() for s in sex.split(",")]
        df = df[df["Sex"].isin(sexes)]

    if intervention and intervention.lower() not in ("all", ""):
        iv = intervention.lower()
        if iv == "any":
            df = df[df["Num_Interventions"] > 0]
        elif iv == "none":
            df = df[df["Num_Interventions"] == 0]
        elif iv == "moringa":
            df = df[df["Intervention_Moringa"] == "Yes"]
        elif iv == "tannin":
            df = df[df["Intervention_Tannin"] == "Yes"]
        elif iv == "genetic":
            df = df[df["Intervention_Genetic"] == "Yes"]
        elif iv == "solar":
            df = df[df["Intervention_Solar"] == "Yes"]

    show_cols = [
        "Animal_ID", "State", "Sex", "Age_months", "Current_Weight_kg",
        "Housing_Type", "Forage_Type", "Total_CH4_kg",
        "Baseline_Net_GHG_CO2e_kg", "Int_Net_GHG_CO2e_kg",
        "Delta_Net_GHG_CO2e_kg", "Delta_Pct_Net_GHG_Reduction",
        "Intervention_Moringa", "Intervention_Tannin",
        "Intervention_Genetic", "Intervention_Solar",
        "Num_Interventions",
    ]
    existing_cols = [c for c in show_cols if c in df.columns]
    subset = df[existing_cols].head(limit)

    summary_cols = [
        "Baseline_Net_GHG_CO2e_kg", "Int_Net_GHG_CO2e_kg",
        "Total_CH4_kg", "Baseline_Carbon_Seq_kg", "Delta_Pct_Net_GHG_Reduction",
    ]
    summary = {
        c: {
            "mean": round(float(df[c].mean()), 2),
            "std":  round(float(df[c].std()),  2),
            "min":  round(float(df[c].min()),  2),
            "max":  round(float(df[c].max()),  2),
        }
        for c in summary_cols if c in df.columns
    }

    adoption = {}
    for col, label in [
        ("Intervention_Moringa", "Moringa"),
        ("Intervention_Tannin",  "Tannin"),
        ("Intervention_Genetic", "Genetic"),
        ("Intervention_Solar",   "Solar"),
    ]:
        if col in df.columns:
            cnt = int((df[col] == "Yes").sum())
            adoption[label] = {"count": cnt, "pct": round(cnt / len(df) * 100, 1) if len(df) else 0}

    unique_states = sorted(df["State"].unique().tolist()) if "State" in df.columns else []
    unique_sexes  = sorted(df["Sex"].unique().tolist())   if "Sex"   in df.columns else []
    scatter_x_options = [
        "Current_Weight_kg", "Age_months", "Dry_Matter_Intake_kg",
        "Avg_Daily_Gain_kg", "Crude_Protein_pct", "TDN_pct",
        "Avg_Temp_C", "Annual_Rainfall_mm",
    ]
    scatter_y_options = [
        "GHG_Net_CO2e_kg", "Total_CH4_kg", "Carbon_Seq_kg_CO2",
        "Delta_Net_GHG_CO2e_kg", "GHG_Gross_CO2e_kg",
    ]

    return {
        "n_filtered":          len(df),
        "records":             subset.replace({float("nan"): None}).to_dict(orient="records"),
        "summary":             summary,
        "adoption":            adoption,
        "unique_states":       unique_states,
        "unique_sexes":        unique_sexes,
        "scatter_x_options":   [c for c in scatter_x_options if c in df.columns],
        "scatter_y_options":   [c for c in scatter_y_options if c in df.columns],
    }


# ─── GET /api/scatter ─────────────────────────────────────────────
@app.get("/api/scatter")
def scatter(
    x: str = Query(..., description="X-axis column name"),
    y: str = Query(..., description="Y-axis column name"),
    color_by: Optional[str] = Query(None, description="Column to colour by"),
    state: Optional[str] = Query(None),
    sex: Optional[str] = Query(None),
    intervention: Optional[str] = Query(None),
):
    df = get_df().copy()

    if state:
        states = [s.strip() for s in state.split(",")]
        df = df[df["State"].isin(states)]

    if sex:
        sexes = [s.strip() for s in sex.split(",")]
        df = df[df["Sex"].isin(sexes)]

    if intervention and intervention.lower() not in ("all", ""):
        iv = intervention.lower()
        if iv == "any":
            df = df[df["Num_Interventions"] > 0]
        elif iv == "none":
            df = df[df["Num_Interventions"] == 0]
        elif iv == "moringa":
            df = df[df["Intervention_Moringa"] == "Yes"]
        elif iv == "tannin":
            df = df[df["Intervention_Tannin"] == "Yes"]
        elif iv == "genetic":
            df = df[df["Intervention_Genetic"] == "Yes"]
        elif iv == "solar":
            df = df[df["Intervention_Solar"] == "Yes"]

    for col in [x, y]:
        if col not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Column '{col}' not found. Available columns: {sorted(df.columns.tolist())}",
            )

    cols = [x, y]
    if color_by and color_by in df.columns and color_by not in cols:
        cols.append(color_by)

    result: dict = {c: df[c].tolist() for c in cols}
    result["n_filtered"] = len(df)
    return result
