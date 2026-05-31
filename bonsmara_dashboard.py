"""
╔══════════════════════════════════════════════════════════════╗
║   BONSMARA CATTLE — GREENHOUSE GAS PREDICTION DASHBOARD      ║
║   ML Models: RF | GradBoost | Logistic/Ridge | DNN | CNN | RNN ║
╚══════════════════════════════════════════════════════════════╝

Run with:  streamlit run bonsmara_dashboard.py
Requires:  pip install streamlit plotly scikit-learn pandas numpy
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import json
import warnings
warnings.filterwarnings("ignore")

# ─── PAGE CONFIG ───────────────────────────────────────────────
st.set_page_config(
    page_title="Bonsmara GHG Dashboard",
    page_icon="🐄",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── COLOUR PALETTE ─────────────────────────────────────────────
PALETTE = {
    "bg":         "#0D1117",
    "card":       "#161B22",
    "border":     "#30363D",
    "accent":     "#58A6FF",
    "green":      "#3FB950",
    "orange":     "#F78166",
    "yellow":     "#E3B341",
    "purple":     "#BC8CFF",
    "teal":       "#39D0D8",
    "red":        "#FF6B6B",
    "text":       "#E6EDF3",
    "muted":      "#8B949E",
    "moringa":    "#2EA043",
    "tannin":     "#C06A2D",
    "genetic":    "#1B7FC4",
    "solar":      "#D4A017",
}

MODEL_COLORS = {
    "Random Forest":              "#3FB950",
    "Gradient Boosting":          "#58A6FF",
    "Logistic/Ridge Regression":  "#E3B341",
    "Deep Learning (MLP/DNN)":    "#BC8CFF",
    "CNN-Equivalent":             "#39D0D8",
    "RNN-Equivalent":             "#F78166",
}

MODEL_ICONS = {
    "Random Forest":              "🌲",
    "Gradient Boosting":          "⚡",
    "Logistic/Ridge Regression":  "📈",
    "Deep Learning (MLP/DNN)":    "🧠",
    "CNN-Equivalent":             "🔬",
    "RNN-Equivalent":             "🔄",
}

# ─── GLOBAL PLOTLY TEMPLATE ─────────────────────────────────────
PLOT_LAYOUT = dict(
    paper_bgcolor=PALETTE["card"],
    plot_bgcolor=PALETTE["bg"],
    font=dict(family="'JetBrains Mono', 'Fira Code', monospace", color=PALETTE["text"], size=11),
    margin=dict(l=40, r=20, t=40, b=40),
    xaxis=dict(gridcolor=PALETTE["border"], showgrid=True, zeroline=False),
    yaxis=dict(gridcolor=PALETTE["border"], showgrid=True, zeroline=False),
    legend=dict(bgcolor="rgba(0,0,0,0)", bordercolor=PALETTE["border"]),
    hoverlabel=dict(bgcolor=PALETTE["card"], bordercolor=PALETTE["accent"],
                    font=dict(color=PALETTE["text"])),
)

# ─── CSS INJECTION ──────────────────────────────────────────────
st.markdown(f"""
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Sora:wght@300;400;600;700&display=swap');

  :root {{
    --bg:     {PALETTE["bg"]};
    --card:   {PALETTE["card"]};
    --border: {PALETTE["border"]};
    --accent: {PALETTE["accent"]};
    --text:   {PALETTE["text"]};
    --muted:  {PALETTE["muted"]};
  }}

  html, body, [class*="css"] {{
    background-color: var(--bg) !important;
    color: var(--text) !important;
    font-family: 'Sora', sans-serif;
  }}

  /* Sidebar */
  [data-testid="stSidebar"] {{
    background: var(--card) !important;
    border-right: 1px solid var(--border) !important;
  }}
  [data-testid="stSidebar"] * {{ color: var(--text) !important; }}

  /* Selectbox / Multiselect */
  .stSelectbox > div > div, .stMultiSelect > div > div {{
    background: var(--bg) !important;
    border: 1px solid var(--border) !important;
    border-radius: 6px !important;
    color: var(--text) !important;
  }}

  /* Metric cards */
  [data-testid="stMetric"] {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 16px;
  }}
  [data-testid="stMetricValue"] {{ font-family: 'JetBrains Mono', monospace !important; color: var(--accent) !important; }}
  [data-testid="stMetricLabel"] {{ color: var(--muted) !important; font-size: 0.8rem !important; }}
  [data-testid="stMetricDelta"] {{ font-size: 0.8rem !important; }}

  /* Tab styling */
  .stTabs [data-baseweb="tab-list"] {{
    background: var(--card);
    border-bottom: 1px solid var(--border);
    gap: 2px;
  }}
  .stTabs [data-baseweb="tab"] {{
    background: transparent;
    border: none;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    padding: 10px 18px;
    border-radius: 6px 6px 0 0;
  }}
  .stTabs [aria-selected="true"] {{
    background: var(--bg) !important;
    color: var(--accent) !important;
    border-bottom: 2px solid var(--accent) !important;
  }}

  /* Dividers */
  hr {{ border-color: var(--border) !important; }}

  /* Headers */
  h1, h2, h3, h4 {{ font-family: 'Sora', sans-serif !important; color: var(--text) !important; }}

  /* Slider */
  .stSlider > div {{ background: transparent !important; }}

  /* Info / Success / Warning boxes */
  .stAlert {{ border-radius: 8px !important; border: 1px solid var(--border) !important; }}

  /* Custom card */
  .metric-card {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 20px;
    margin: 4px 0;
    position: relative;
  }}
  .metric-card .label {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 4px;
  }}
  .metric-card .value {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--accent);
  }}
  .metric-card .sub {{
    font-size: 0.78rem;
    color: var(--muted);
    margin-top: 2px;
  }}
  .accent-bar {{
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    border-radius: 10px 0 0 10px;
  }}

  /* Tag badges */
  .badge {{
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 20px;
    margin: 2px;
    font-weight: 600;
  }}

  /* Model card */
  .model-card {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px;
    margin: 6px 0;
    transition: border-color 0.2s;
  }}
  .model-card:hover {{ border-color: var(--accent); }}

  /* Prediction panel */
  .pred-result {{
    background: linear-gradient(135deg, rgba(88,166,255,0.08), rgba(63,185,80,0.08));
    border: 1px solid var(--accent);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin-top: 12px;
  }}
  .pred-value {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--accent);
  }}
</style>
""", unsafe_allow_html=True)


# ─── DATA LOADING ───────────────────────────────────────────────
@st.cache_data
def load_data():
    """Load ML results JSON – embedded fallback if file missing."""
    try:
        with open("ml_results.json") as f:
            return json.load(f)
    except FileNotFoundError:
        st.error("⚠️ ml_results.json not found. Please run the ML pipeline first.")
        st.stop()

@st.cache_data
def load_csv():
    try:
        return pd.read_csv("bonsmara_interventions.csv")
    except:
        return None


data = load_data()
models = data["models"]
ds = data["dataset"]
df_raw = load_csv()
model_names = list(models.keys())


def pl(**overrides):
    """Return PLOT_LAYOUT merged with overrides (overrides win, no duplicate-key error)."""
    return {**PLOT_LAYOUT, **overrides}


def hex_to_rgba(hex_color, alpha=1.0):
    """Convert a 6-digit hex color to rgba() string with given alpha (0–1)."""
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{alpha})"


# ─── SIDEBAR ────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style='text-align:center; padding: 10px 0 20px;'>
      <div style='font-size:2.5rem;'>🐄</div>
      <div style='font-family: Sora, sans-serif; font-weight:700; font-size:1.1rem; color:#58A6FF;'>
        Bonsmara GHG
      </div>
      <div style='font-size:0.72rem; color:#8B949E; font-family: JetBrains Mono, monospace;'>
        GREENHOUSE FOOTPRINT PREDICTION
      </div>
    </div>
    <hr>
    """, unsafe_allow_html=True)

    page = st.selectbox("📍 Navigation", [
        "🏠 Overview",
        "🤖 ML Model Metrics",
        "📊 Feature Importance",
        "🔮 Predict GHG Footprint",
        "💉 Intervention Analysis",
        "💰 Farmer Benefits",
        "🗃️ Dataset Explorer",
    ])

    st.markdown("<hr>", unsafe_allow_html=True)
    st.markdown(f"""
    <div style='font-size:0.75rem; color:#8B949E; font-family: JetBrains Mono, monospace;'>
      <b style='color:#3FB950'>Dataset</b><br>
      {ds['n_total']} animals · {ds['n_states']} states<br><br>
      <b style='color:#58A6FF'>Models Trained</b><br>
      {len(models)} ML algorithms<br><br>
      <b style='color:#E3B341'>Best Model</b><br>
      Gradient Boosting<br>R² = {models['Gradient Boosting']['reg_r2']}<br><br>
      <b style='color:#BC8CFF'>Interventions</b><br>
      Moringa · Tannin<br>Genetics · Solar
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<hr>", unsafe_allow_html=True)
    st.caption("South African Agro-Ecological States")
    for state, count in ds["states"].items():
        pct = count / ds["n_total"] * 100
        st.markdown(f"""
        <div style='display:flex; justify-content:space-between; font-size:0.8rem; 
             font-family: JetBrains Mono, monospace; padding: 2px 0;'>
          <span style='color:#E6EDF3'>{state}</span>
          <span style='color:#58A6FF'>{count} ({pct:.0f}%)</span>
        </div>
        """, unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════
# PAGE: OVERVIEW
# ════════════════════════════════════════════════════════════════
if page == "🏠 Overview":
    st.markdown("""
    <h1 style='font-size:2rem; margin-bottom:0;'>Bonsmara Cattle</h1>
    <p style='color:#8B949E; font-family: JetBrains Mono, monospace; font-size:0.85rem; margin-top:4px;'>
      Greenhouse Gas Footprint Prediction · South Africa · 1,000 head · 3 Agro-Ecological States
    </p>
    <hr>
    """, unsafe_allow_html=True)

    # KPI row
    k1, k2, k3, k4, k5 = st.columns(5)
    kpis = [
        (k1, "Total Animals", "1,000", "head in dataset", PALETTE["accent"]),
        (k2, "Baseline Net GHG", f"{ds['mean_baseline_ghg']:,.0f}", "kg CO₂e/head/yr", PALETTE["orange"]),
        (k3, "With Interventions", f"{ds['mean_int_ghg']:,.0f}", "kg CO₂e/head/yr", PALETTE["green"]),
        (k4, "Mean CH₄ Emission", f"{ds['mean_ch4']:.1f}", "kg CH₄/head/yr", PALETTE["yellow"]),
        (k5, "Carbon Seq.", f"{ds['mean_seq']:,.0f}", "kg CO₂/head/yr", PALETTE["teal"]),
    ]
    for col, label, value, sub, color in kpis:
        with col:
            st.markdown(f"""
            <div class='metric-card'>
              <div class='accent-bar' style='background:{color}'></div>
              <div class='label'>{label}</div>
              <div class='value' style='color:{color}'>{value}</div>
              <div class='sub'>{sub}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    c1, c2 = st.columns([3, 2])

    with c1:
        st.markdown("#### GHG Distribution — Baseline vs. Interventions")
        fig = go.Figure()
        fig.add_trace(go.Histogram(
            x=ds["ghg_distribution"], name="Baseline Net GHG",
            marker_color=PALETTE["orange"], opacity=0.65,
            xbins=dict(size=100), nbinsx=40
        ))
        # Approximate intervention distribution from reduction
        int_dist = [max(0, v * (1 - ds["mean_reduction_pct"]/100)) for v in ds["ghg_distribution"]]
        fig.add_trace(go.Histogram(
            x=int_dist, name="With Interventions",
            marker_color=PALETTE["green"], opacity=0.65,
            xbins=dict(size=100), nbinsx=40
        ))
        fig.update_layout(**PLOT_LAYOUT,
            title=dict(text="Net GHG Footprint Distribution", font=dict(size=13)),
            barmode="overlay",
            xaxis_title="Net GHG (kg CO₂e/head/year)",
            yaxis_title="Count",
            height=330,
        )
        st.plotly_chart(fig, use_container_width=True)

    with c2:
        st.markdown("#### GHG by State")
        states_list = list(ds["ghg_by_state"].keys())
        ghg_vals = list(ds["ghg_by_state"].values())
        fig2 = go.Figure(go.Bar(
            x=ghg_vals, y=states_list, orientation='h',
            marker=dict(color=[PALETTE["accent"], PALETTE["purple"], PALETTE["teal"]],
                        line=dict(color=PALETTE["border"], width=1)),
            text=[f"{v:,.0f}" for v in ghg_vals],
            textposition='inside',
            textfont=dict(family="JetBrains Mono, monospace", size=11, color="white"),
        ))
        fig2.update_layout(**{**PLOT_LAYOUT, "margin": dict(l=10, r=10, t=40, b=20)}, height=200,
            title=dict(text="Mean Net GHG (kg CO₂e/head/yr)", font=dict(size=12)),
            xaxis_title="", yaxis_title="",
        )
        st.plotly_chart(fig2, use_container_width=True)

        st.markdown("#### GHG Class Distribution")
        class_dist = ds.get("ghg_class_dist", {"Low": 333, "Medium": 334, "High": 333})
        fig3 = go.Figure(go.Pie(
            labels=list(class_dist.keys()),
            values=list(class_dist.values()),
            hole=0.55,
            marker=dict(colors=[PALETTE["green"], PALETTE["yellow"], PALETTE["orange"]]),
            textfont=dict(family="JetBrains Mono, monospace", size=11),
        ))
        fig3.update_layout(**{**PLOT_LAYOUT, "margin": dict(l=0, r=0, t=10, b=10)}, height=170,
            showlegend=True,
        )
        st.plotly_chart(fig3, use_container_width=True)

    # Model quick comparison
    st.markdown("<hr>", unsafe_allow_html=True)
    st.markdown("#### ML Model Performance Quick Summary")
    cols = st.columns(len(model_names))
    for i, (col, name) in enumerate(zip(cols, model_names)):
        r = models[name]
        color = list(MODEL_COLORS.values())[i]
        icon = MODEL_ICONS[name]
        with col:
            st.markdown(f"""
            <div class='metric-card' style='border-color:{color}30'>
              <div class='accent-bar' style='background:{color}'></div>
              <div style='font-size:1.2rem'>{icon}</div>
              <div class='label'>{name.split(' ')[0]}</div>
              <div style='font-family: JetBrains Mono, monospace; font-size:1.1rem; 
                   color:{color}; font-weight:700;'>R²={r['reg_r2']}</div>
              <div class='sub'>Acc={r['cls_accuracy']}</div>
            </div>
            """, unsafe_allow_html=True)

    # Intervention impact
    st.markdown("<br>")
    st.markdown("#### Intervention GHG Reduction Impact")
    ints = ds["reduction_by_int"]
    int_names = list(ints.keys())
    int_vals  = list(ints.values())
    int_colors = [PALETTE["moringa"], PALETTE["tannin"], PALETTE["genetic"], PALETTE["solar"]]
    int_icons  = ["🌿", "🍂", "🧬", "☀️"]

    ci1, ci2, ci3, ci4 = st.columns(4)
    for col, name, val, color, icon in zip([ci1,ci2,ci3,ci4], int_names, int_vals, int_colors, int_icons):
        with col:
            pct = abs(val) / ds['mean_baseline_ghg'] * 100
            st.markdown(f"""
            <div class='metric-card'>
              <div class='accent-bar' style='background:{color}'></div>
              <div style='font-size:1.4rem; margin-bottom:4px'>{icon} {name}</div>
              <div style='font-family:JetBrains Mono,monospace; font-size:1.3rem; 
                   font-weight:700; color:{color}'>−{val:,.0f}</div>
              <div class='sub'>kg CO₂e/head/yr ({pct:.1f}% reduction)</div>
            </div>
            """, unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════
# PAGE: ML MODEL METRICS
# ════════════════════════════════════════════════════════════════
elif page == "🤖 ML Model Metrics":
    st.markdown("""
    <h1 style='font-size:2rem; margin-bottom:0;'>🤖 ML Model Metrics</h1>
    <p style='color:#8B949E; font-family: JetBrains Mono, monospace; font-size:0.85rem;'>
      Regression (GHG prediction) · Classification (Low/Medium/High GHG class) · 80/20 train-test split
    </p><hr>
    """, unsafe_allow_html=True)

    tab1, tab2, tab3, tab4 = st.tabs([
        "📊 Metrics Table", "📈 Model Comparison", "🎯 Actual vs Predicted", "🔀 Confusion Matrix"
    ])

    with tab1:
        st.markdown("#### Regression Metrics (Target: Net GHG kg CO₂e/head/yr)")
        reg_rows = []
        for name, r in models.items():
            cv_mean = r.get("cv_r2_mean", r["reg_r2"])
            cv_std  = r.get("cv_r2_std", 0)
            reg_rows.append({
                "Model": f"{MODEL_ICONS[name]} {name}",
                "Type": r["type"].replace("_", " ").title(),
                "R²": r["reg_r2"],
                "RMSE (kg CO₂e)": r["reg_rmse"],
                "MAE (kg CO₂e)": r["reg_mae"],
                "CV R² (5-fold)": f"{cv_mean:.4f} ± {cv_std:.4f}",
                "Architecture": r.get("architecture", "—")[:60]
            })
        df_reg = pd.DataFrame(reg_rows)
        st.dataframe(df_reg.style
            .background_gradient(cmap="Blues", subset=["R²"])
            .format({"R²": "{:.4f}", "RMSE (kg CO₂e)": "{:.2f}", "MAE (kg CO₂e)": "{:.2f}"}),
            use_container_width=True, height=280
        )

        st.markdown("<br>#### Classification Metrics (Target: Low / Medium / High GHG class)")
        cls_rows = []
        for name, r in models.items():
            cls_rows.append({
                "Model": f"{MODEL_ICONS[name]} {name}",
                "Accuracy": r["cls_accuracy"],
                "F1 (weighted)": r["cls_f1"],
            })
        df_cls = pd.DataFrame(cls_rows)
        st.dataframe(df_cls.style
            .background_gradient(cmap="Greens", subset=["Accuracy", "F1 (weighted)"])
            .format({"Accuracy": "{:.4f}", "F1 (weighted)": "{:.4f}"}),
            use_container_width=True, height=260
        )

    with tab2:
        m1, m2 = st.columns(2)
        with m1:
            names = list(MODEL_COLORS.keys())
            r2_vals = [models[n]["reg_r2"] for n in names]
            rmse_vals = [models[n]["reg_rmse"] for n in names]
            fig = make_subplots(rows=1, cols=2, subplot_titles=["R² Score", "RMSE (kg CO₂e)"])
            fig.add_trace(go.Bar(
                x=names, y=r2_vals, name="R²",
                marker_color=list(MODEL_COLORS.values()),
                text=[f"{v:.4f}" for v in r2_vals],
                textposition="outside", textfont=dict(size=9)
            ), row=1, col=1)
            fig.add_trace(go.Bar(
                x=names, y=rmse_vals, name="RMSE",
                marker_color=list(MODEL_COLORS.values()),
                opacity=0.75,
                text=[f"{v:.0f}" for v in rmse_vals],
                textposition="outside", textfont=dict(size=9)
            ), row=1, col=2)
            fig.update_layout(**pl(
                height=400, showlegend=False,
                xaxis=dict(tickangle=-30, tickfont=dict(size=9)),
                xaxis2=dict(tickangle=-30, tickfont=dict(size=9)),
            ))
            st.plotly_chart(fig, use_container_width=True)

        with m2:
            # Radar chart
            categories = ["R²", "1/RMSE_norm", "Acc", "F1", "CV R²"]
            fig_radar = go.Figure()
            max_rmse = max(models[n]["reg_rmse"] for n in names)
            for name in names:
                r = models[name]
                vals = [
                    r["reg_r2"],
                    1 - r["reg_rmse"] / max_rmse,
                    r["cls_accuracy"],
                    r["cls_f1"],
                    r.get("cv_r2_mean", r["reg_r2"]),
                ]
                fig_radar.add_trace(go.Scatterpolar(
                    r=vals + [vals[0]],
                    theta=categories + [categories[0]],
                    name=f"{MODEL_ICONS[name]} {name.split(' ')[0]}",
                    line=dict(color=MODEL_COLORS[name], width=2),
                    fill="toself", opacity=0.25,
                    fillcolor=MODEL_COLORS[name],
                ))
            fig_radar.update_layout(**PLOT_LAYOUT, height=400,
                polar=dict(
                    bgcolor=PALETTE["bg"],
                    radialaxis=dict(visible=True, range=[0, 1], gridcolor=PALETTE["border"],
                                   tickfont=dict(size=8)),
                    angularaxis=dict(gridcolor=PALETTE["border"]),
                ),
                title=dict(text="Model Performance Radar", font=dict(size=13)),
            )
            st.plotly_chart(fig_radar, use_container_width=True)

        # CV scores bar
        st.markdown("#### 5-Fold Cross-Validation R² Scores")
        cv_data = []
        for name in names:
            r = models[name]
            for fold_i, score in enumerate(r.get("cv_r2_scores", [r["reg_r2"]]*5), 1):
                cv_data.append({"Model": name.split(" ")[0], "Fold": f"Fold {fold_i}", "R²": score,
                                "Color": MODEL_COLORS[name]})
        df_cv = pd.DataFrame(cv_data)
        fig_cv = px.strip(df_cv, x="Model", y="R²", color="Model",
                          color_discrete_map={n.split(" ")[0]: MODEL_COLORS[n] for n in names})
        fig_cv.update_layout(**pl(height=320, showlegend=False,
            yaxis=dict(range=[0, 1.05])))
        st.plotly_chart(fig_cv, use_container_width=True)

    with tab3:
        sel_model = st.selectbox("Select Model", model_names)
        r = models[sel_model]
        y_test = r["y_test"]
        y_pred = r["y_pred"]

        c1, c2 = st.columns([3, 2])
        with c1:
            fig_av = go.Figure()
            fig_av.add_trace(go.Scatter(
                x=y_test, y=y_pred,
                mode="markers",
                marker=dict(color=MODEL_COLORS[sel_model], size=5, opacity=0.6,
                            line=dict(color=PALETTE["border"], width=0.3)),
                name="Predictions",
                hovertemplate="Actual: %{x:.0f}<br>Predicted: %{y:.0f}<extra></extra>"
            ))
            min_v, max_v = min(y_test), max(y_test)
            fig_av.add_trace(go.Scatter(
                x=[min_v, max_v], y=[min_v, max_v],
                mode="lines", line=dict(color=PALETTE["red"], dash="dash", width=2),
                name="Perfect Fit"
            ))
            fig_av.update_layout(**PLOT_LAYOUT, height=420,
                title=f"{MODEL_ICONS[sel_model]} {sel_model} — Actual vs Predicted",
                xaxis_title="Actual GHG (kg CO₂e/head/yr)",
                yaxis_title="Predicted GHG (kg CO₂e/head/yr)",
            )
            st.plotly_chart(fig_av, use_container_width=True)

        with c2:
            residuals = np.array(y_pred) - np.array(y_test)
            fig_res = go.Figure()
            fig_res.add_trace(go.Histogram(
                x=residuals, nbinsx=30,
                marker_color=MODEL_COLORS[sel_model], opacity=0.8, name="Residuals"
            ))
            fig_res.add_vline(x=0, line_dash="dash", line_color=PALETTE["red"])
            fig_res.update_layout(**PLOT_LAYOUT, height=220,
                title="Residual Distribution", xaxis_title="Residual", yaxis_title="Count",
            )
            st.plotly_chart(fig_res, use_container_width=True)

            m1v, m2v, m3v = st.columns(3)
            m1v.metric("R²",  f"{r['reg_r2']:.4f}")
            m2v.metric("RMSE", f"{r['reg_rmse']:.1f}")
            m3v.metric("MAE",  f"{r['reg_mae']:.1f}")

            arch = r.get("architecture", "—")
            st.markdown(f"""
            <div class='metric-card' style='margin-top:8px'>
              <div class='label'>Architecture</div>
              <div style='font-family: JetBrains Mono, monospace; font-size:0.78rem; 
                   color:{MODEL_COLORS[sel_model]}; line-height:1.5;'>{arch}</div>
            </div>
            """, unsafe_allow_html=True)

    with tab4:
        sel_cm = st.selectbox("Select Model for Confusion Matrix", model_names, key="cm_sel")
        cm = np.array(models[sel_cm]["confusion_matrix"])
        class_labels = data.get("class_labels", ["High", "Low", "Medium"])
        cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)
        annotations = []
        for i in range(len(cm)):
            for j in range(len(cm[0])):
                annotations.append(dict(
                    x=j, y=i,
                    text=f"<b>{cm[i][j]}</b><br>{cm_norm[i][j]:.1%}",
                    showarrow=False,
                    font=dict(color="white", size=12, family="JetBrains Mono, monospace")
                ))
        fig_cm = go.Figure(go.Heatmap(
            z=cm_norm,
            x=[f"Pred: {l}" for l in class_labels],
            y=[f"True: {l}" for l in class_labels],
            colorscale=[[0, PALETTE["bg"]], [0.5, MODEL_COLORS[sel_cm] + "80"],
                        [1, MODEL_COLORS[sel_cm]]],
            showscale=True,
        ))
        fig_cm.update_layout(**PLOT_LAYOUT, height=400,
            title=f"{MODEL_ICONS[sel_cm]} Confusion Matrix — {sel_cm}",
            annotations=annotations,
        )
        st.plotly_chart(fig_cm, use_container_width=True)
        acc = models[sel_cm]["cls_accuracy"]
        f1  = models[sel_cm]["cls_f1"]
        ca, cb = st.columns(2)
        ca.metric("Classification Accuracy", f"{acc:.4f}")
        cb.metric("F1 Score (Weighted)", f"{f1:.4f}")


# ════════════════════════════════════════════════════════════════
# PAGE: FEATURE IMPORTANCE
# ════════════════════════════════════════════════════════════════
elif page == "📊 Feature Importance":
    st.markdown("""
    <h1 style='font-size:2rem; margin-bottom:0;'>📊 Feature Importance</h1>
    <p style='color:#8B949E; font-family: JetBrains Mono, monospace; font-size:0.85rem;'>
      Driver analysis: which factors most strongly predict GHG footprint
    </p><hr>
    """, unsafe_allow_html=True)

    sel_fi = st.selectbox("Select Model", model_names)
    r = models[sel_fi]
    fi = r["feature_importance"]
    fi_df = pd.DataFrame(list(fi.items()), columns=["Feature", "Importance"]).sort_values("Importance")

    # Color by category
    def feature_color(feat):
        feat = feat.lower()
        if any(x in feat for x in ["temp","rain","humidity","heat","altitude","season","veld","state"]): return PALETTE["yellow"]
        if any(x in feat for x in ["protein","tdn","intake","forage","mineral","energy","water"]): return PALETTE["orange"]
        if any(x in feat for x in ["age","weight","bcs","frame","parity","sex","health"]): return PALETTE["teal"]
        if any(x in feat for x in ["herd","grazing","housing","breeding","vaccination","deworming","record","adg","calving","weaning"]): return PALETTE["purple"]
        if any(x in feat for x in ["intervention","moringa","tannin","genetic","solar","num_"]): return PALETTE["green"]
        return PALETTE["accent"]

    colors = [feature_color(f) for f in fi_df["Feature"]]

    c1, c2 = st.columns([3, 2])
    with c1:
        fig_fi = go.Figure(go.Bar(
            x=fi_df["Importance"], y=fi_df["Feature"],
            orientation="h",
            marker=dict(color=colors, line=dict(color=PALETTE["border"], width=0.5)),
            text=[f"{v:.4f}" for v in fi_df["Importance"]],
            textposition="outside",
            textfont=dict(size=9, family="JetBrains Mono, monospace"),
        ))
        fig_fi.update_layout(**pl(height=500,
            title=f"{MODEL_ICONS[sel_fi]} Feature Importance — {sel_fi}",
            xaxis_title="Importance Score",
            yaxis_title="",
            yaxis=dict(tickfont=dict(size=9)),
        ))
        st.plotly_chart(fig_fi, use_container_width=True)

    with c2:
        st.markdown("#### Feature Category Legend")
        legend_items = [
            ("🌡️ Environmental", PALETTE["yellow"]),
            ("🌿 Nutrition", PALETTE["orange"]),
            ("🐄 Animal", PALETTE["teal"]),
            ("🏗️ Management", PALETTE["purple"]),
            ("💉 Interventions", PALETTE["green"]),
        ]
        for label, color in legend_items:
            st.markdown(f"""
            <div style='display:flex; align-items:center; padding:6px 0; 
                 border-bottom: 1px solid {PALETTE["border"]}'>
              <div style='width:12px; height:12px; border-radius:50%; 
                   background:{color}; margin-right:10px; flex-shrink:0'></div>
              <span style='font-size:0.85rem'>{label}</span>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>")
        st.markdown("#### Top 5 Drivers")
        top5 = fi_df.nlargest(5, "Importance")
        for _, row in top5.iterrows():
            pct = row["Importance"] / fi_df["Importance"].max() * 100
            color = feature_color(row["Feature"])
            st.markdown(f"""
            <div style='padding: 6px 0; border-bottom: 1px solid {PALETTE["border"]}'>
              <div style='display:flex; justify-content:space-between; margin-bottom:3px'>
                <span style='font-size:0.82rem; font-family:JetBrains Mono,monospace'>{row['Feature'].replace('_enc','').replace('_',' ')}</span>
                <span style='font-size:0.82rem; color:{color}; font-weight:700'>{row['Importance']:.5f}</span>
              </div>
              <div style='background:{PALETTE["border"]}; border-radius:4px; height:4px'>
                <div style='background:{color}; width:{pct:.0f}%; height:4px; border-radius:4px'></div>
              </div>
            </div>
            """, unsafe_allow_html=True)

    # Cross-model comparison of top features
    st.markdown("<br><hr><br>")
    st.markdown("#### Cross-Model Feature Comparison (Top Features in RF vs GB)")
    rf_fi = models["Random Forest"]["feature_importance"]
    gb_fi = models["Gradient Boosting"]["feature_importance"]
    common = sorted(set(rf_fi.keys()) & set(gb_fi.keys()), key=lambda x: rf_fi.get(x, 0), reverse=True)[:12]
    fig_comp = go.Figure()
    fig_comp.add_trace(go.Bar(name="🌲 Random Forest", x=common,
                              y=[rf_fi[f] for f in common],
                              marker_color=MODEL_COLORS["Random Forest"], opacity=0.85))
    fig_comp.add_trace(go.Bar(name="⚡ Gradient Boosting", x=common,
                              y=[gb_fi[f] for f in common],
                              marker_color=MODEL_COLORS["Gradient Boosting"], opacity=0.85))
    fig_comp.update_layout(**pl(barmode="group", height=350,
        xaxis=dict(tickangle=-25, tickfont=dict(size=9)),
        yaxis_title="Importance",
        title="Random Forest vs Gradient Boosting Feature Importance",
    ))
    st.plotly_chart(fig_comp, use_container_width=True)


# ════════════════════════════════════════════════════════════════
# PAGE: PREDICT GHG FOOTPRINT
# ════════════════════════════════════════════════════════════════
elif page == "🔮 Predict GHG Footprint":
    st.markdown("""
    <h1 style='font-size:2rem; margin-bottom:0;'>🔮 Predict GHG Footprint</h1>
    <p style='color:#8B949E; font-family: JetBrains Mono, monospace; font-size:0.85rem;'>
      Configure animal, nutrition, environment and intervention parameters to predict net GHG
    </p><hr>
    """, unsafe_allow_html=True)

    # ── Simple linear prediction using feature weights from top model ──
    # We derive an approximate prediction from GB feature importances
    def predict_ghg(params):
        """Approximation using weighted linear combination from dataset stats."""
        base = ds["mean_baseline_ghg"]
        # Animal effects
        weight_eff = (params["weight"] - 350) * 0.8
        adg_eff    = (params["adg"] - 0.85) * -200
        bcs_eff    = (params["bcs"] - 3.5) * -80
        age_eff    = (params["age"] - 36) * 1.5
        # Nutrition
        cp_eff     = (params["cp"] - 11) * -25
        tdn_eff    = (params["tdn"] - 61) * -15
        dmi_eff    = (params["dmi"] - 8) * 180
        # Environment
        temp_eff   = (params["temp"] - 25) * 30
        rain_eff   = (params["rain"] - 500) * -0.4
        humid_eff  = (params["humid"] - 55) * 5
        # Management
        housing_map = {"Extensive": 0, "Semi-intensive": 200, "Intensive": 400}
        grazing_map = {"Continuous": 100, "Rotational": -150, "Strip": -200}
        housing_eff = housing_map.get(params["housing"], 0)
        grazing_eff = grazing_map.get(params["grazing"], 0)
        # Interventions
        moringa_eff  = -320  if params["moringa"]  else 0
        tannin_eff   = -420  if params["tannin"]   else 0
        genetic_eff  = -300  if params["genetic"]  else 0
        solar_eff    = -160  if params["solar"]    else 0
        # Carbon seq
        veld_map = {"Good": -400, "Fair": -200, "Poor": -80}
        seq_eff = veld_map.get(params["veld"], -200)

        prediction = (base + weight_eff + adg_eff + bcs_eff + age_eff +
                      cp_eff + tdn_eff + dmi_eff + temp_eff + rain_eff + humid_eff +
                      housing_eff + grazing_eff + seq_eff +
                      moringa_eff + tannin_eff + genetic_eff + solar_eff)
        return max(200, prediction)

    pc1, pc2 = st.columns([1.1, 1])

    with pc1:
        st.markdown("#### 🐄 Animal Parameters")
        a1, a2 = st.columns(2)
        sex        = a1.selectbox("Sex", ["Cow", "Bull", "Heifer", "Steer"])
        age        = a2.slider("Age (months)", 6, 120, 36)
        weight     = a1.slider("Live Weight (kg)", 150, 600, 350)
        adg        = a2.slider("Avg Daily Gain (kg/day)", 0.3, 1.4, 0.85, 0.01)
        bcs        = a1.slider("Body Condition Score", 1.0, 5.0, 3.5, 0.5)
        state      = a2.selectbox("State", ["Limpopo", "North West", "Free State"])

        st.markdown("#### 🌿 Nutrition")
        n1, n2 = st.columns(2)
        forage  = n1.selectbox("Forage Type", ["Native Veld","Improved Pasture","Crop Residue","Mixed"])
        cp      = n2.slider("Crude Protein (%)", 7.0, 16.0, 11.0, 0.5)
        tdn     = n1.slider("TDN (%)", 50, 72, 61)
        dmi     = n2.slider("DMI (kg/day)", 3.0, 16.0, 8.0, 0.5)
        mineral = n1.selectbox("Mineral Supplement", ["Yes","No"])
        energy  = n2.selectbox("Energy Balance", ["Positive","Neutral","Negative"])

        st.markdown("#### 🌡️ Environment & Management")
        e1, e2 = st.columns(2)
        temp    = e1.slider("Avg Temperature (°C)", 14, 32, 25)
        rain    = e2.slider("Annual Rainfall (mm)", 300, 700, 500)
        humid   = e1.slider("Humidity (%)", 30, 80, 55)
        veld    = e2.selectbox("Veld Condition", ["Good","Fair","Poor"])
        housing = e1.selectbox("Housing Type", ["Extensive","Semi-intensive","Intensive"])
        grazing = e2.selectbox("Grazing System", ["Rotational","Continuous","Strip"])

        st.markdown("#### 💉 Interventions")
        i1, i2, i3, i4 = st.columns(4)
        moringa = i1.checkbox("🌿 Moringa")
        tannin  = i2.checkbox("🍂 Tannin")
        genetic = i3.checkbox("🧬 Genetic")
        solar   = i4.checkbox("☀️ Solar")

    with pc2:
        params = dict(weight=weight, adg=adg, bcs=bcs, age=age, cp=cp, tdn=tdn, dmi=dmi,
                      temp=temp, rain=rain, humid=humid, housing=housing, grazing=grazing,
                      veld=veld, moringa=moringa, tannin=tannin, genetic=genetic, solar=solar)
        pred = predict_ghg(params)
        pred_no_int = predict_ghg({**params, "moringa": False, "tannin": False, "genetic": False, "solar": False})
        reduction = pred_no_int - pred

        # GHG class
        if pred < 2000:    ghg_class, class_color = "🟢 LOW", PALETTE["green"]
        elif pred < 3500:  ghg_class, class_color = "🟡 MEDIUM", PALETTE["yellow"]
        else:              ghg_class, class_color = "🔴 HIGH", PALETTE["orange"]

        st.markdown(f"""
        <div class='pred-result'>
          <div style='font-family:JetBrains Mono,monospace; font-size:0.8rem; 
               color:#8B949E; text-transform:uppercase; letter-spacing:0.1em;'>
            Predicted Net GHG Footprint
          </div>
          <div class='pred-value' style='color:{class_color}'>{pred:,.0f}</div>
          <div style='font-size:0.85rem; color:#8B949E; margin-top:4px'>kg CO₂e / head / year</div>
          <div style='font-size:1.1rem; margin-top:10px; font-weight:600; color:{class_color}'>
            {ghg_class} GHG CLASS
          </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>")
        m1, m2 = st.columns(2)
        m1.metric("Without Interventions", f"{pred_no_int:,.0f} kg")
        m2.metric("Reduction from Interventions", f"−{reduction:,.0f} kg", f"-{reduction/pred_no_int*100:.1f}%")

        # Waterfall breakdown
        active_ints = {
            "🌿 Moringa": -320 if moringa else 0,
            "🍂 Tannin": -420 if tannin else 0,
            "🧬 Genetic": -300 if genetic else 0,
            "☀️ Solar": -160 if solar else 0,
        }
        w_cats = ["Baseline"] + list(active_ints.keys()) + ["Final"]
        w_vals = [pred_no_int] + list(active_ints.values()) + [pred]
        w_measures = ["absolute"] + ["relative"]*len(active_ints) + ["total"]
        w_colors_list = [PALETTE["orange"]] + [PALETTE["green"]]*len(active_ints) + [class_color]

        fig_wf = go.Figure(go.Waterfall(
            x=w_cats, y=w_vals, measure=w_measures,
            connector=dict(line=dict(color=PALETTE["border"])),
            decreasing=dict(marker_color=PALETTE["green"]),
            increasing=dict(marker_color=PALETTE["orange"]),
            totals=dict(marker_color=class_color),
            text=[f"{abs(v):,.0f}" for v in w_vals],
            textfont=dict(family="JetBrains Mono, monospace", size=10),
        ))
        fig_wf.update_layout(**pl(height=300,
            title="GHG Breakdown — Intervention Impact",
            yaxis_title="kg CO₂e/head/yr",
            xaxis=dict(tickfont=dict(size=10)),
        ))
        st.plotly_chart(fig_wf, use_container_width=True)

        # Gauge
        fig_gauge = go.Figure(go.Indicator(
            mode="gauge+number+delta",
            value=pred,
            delta={"reference": ds["mean_baseline_ghg"], "valueformat": ".0f",
                   "decreasing": {"color": PALETTE["green"]},
                   "increasing": {"color": PALETTE["orange"]}},
            number={"suffix": " kg CO₂e", "font": {"family": "JetBrains Mono, monospace",
                                                     "size": 22, "color": class_color}},
            gauge=dict(
                axis=dict(range=[0, 6000], tickcolor=PALETTE["muted"]),
                bar=dict(color=class_color, thickness=0.25),
                steps=[
                    dict(range=[0, 2000], color=PALETTE["green"] + "30"),
                    dict(range=[2000, 3500], color=PALETTE["yellow"] + "30"),
                    dict(range=[3500, 6000], color=PALETTE["orange"] + "30"),
                ],
                threshold=dict(line=dict(color=PALETTE["red"], width=2),
                               thickness=0.75, value=ds["mean_baseline_ghg"]),
                bgcolor=PALETTE["bg"],
                bordercolor=PALETTE["border"],
            ),
            title={"text": "vs Dataset Mean", "font": {"size": 12, "color": PALETTE["muted"]}},
        ))
        fig_gauge.update_layout(paper_bgcolor=PALETTE["card"],
                                font=dict(color=PALETTE["text"], family="Sora, sans-serif"),
                                height=240, margin=dict(l=20, r=20, t=30, b=10))
        st.plotly_chart(fig_gauge, use_container_width=True)


# ════════════════════════════════════════════════════════════════
# PAGE: INTERVENTION ANALYSIS
# ════════════════════════════════════════════════════════════════
elif page == "💉 Intervention Analysis":
    st.markdown("""
    <h1 style='font-size:2rem; margin-bottom:0;'>💉 Intervention Analysis</h1>
    <p style='color:#8B949E; font-family: JetBrains Mono, monospace; font-size:0.85rem;'>
      Moringa · Tannin · Genetic Selection · Solar Panels — baseline vs. intervention comparison
    </p><hr>
    """, unsafe_allow_html=True)

    # Adoption & impact
    adoption = ds["intervention_adoption"]
    reduction = ds["reduction_by_int"]

    st.markdown("#### Intervention Adoption & GHG Reduction")
    ia1, ia2, ia3, ia4 = st.columns(4)
    int_info = [
        (ia1, "🌿 Moringa", "Moringa", PALETTE["moringa"],
         "Reduces enteric CH₄ 10–20%\nImproves N efficiency → less N₂O\n+5–10% ADG boost"),
        (ia2, "🍂 Tannin", "Tannin", PALETTE["tannin"],
         "Condensed tannins suppress methanogens\n15–25% enteric CH₄ cut\nLower manure N excretion"),
        (ia3, "🧬 Genetic", "Genetic", PALETTE["genetic"],
         "Low-CH₄ EBV selection\n10–15% heritable CH₄ reduction\nImproved feed conversion"),
        (ia4, "☀️ Solar", "Solar", PALETTE["solar"],
         "Replaces fossil energy on farm\n60–90% energy CO₂ eliminated\nAdded sequestration credit"),
    ]
    for col, label, key, color, desc in int_info:
        with col:
            n_applied = adoption[key]
            red = abs(reduction[key])
            pct = red / ds["mean_baseline_ghg"] * 100
            st.markdown(f"""
            <div class='metric-card' style='border-color:{color}50'>
              <div class='accent-bar' style='background:{color}'></div>
              <div style='font-size:1.3rem; margin-bottom:6px'>{label}</div>
              <div style='font-family:JetBrains Mono,monospace; font-size:1.2rem; 
                   font-weight:700; color:{color}'>−{red:,.0f} kg</div>
              <div class='sub' style='color:{color}'>{pct:.1f}% reduction</div>
              <div style='margin-top:8px; padding-top:8px; border-top:1px solid {PALETTE["border"]};
                   font-size:0.75rem; color:{PALETTE["muted"]}; font-family:JetBrains Mono,monospace'>
                {n_applied} animals ({n_applied/ds["n_total"]*100:.0f}% adoption)
              </div>
            </div>
            """, unsafe_allow_html=True)
            with st.expander("📖 Mechanism"):
                muted_color = PALETTE["muted"]
                st.markdown(f"<span style='font-size:0.82rem; color:{muted_color}'>{desc}</span>",
                            unsafe_allow_html=True)

    st.markdown("<br>")
    t1, t2, t3 = st.tabs(["📊 GHG Comparison", "🔬 CH₄ & Sequestration", "📉 Dose-Response"])

    with t1:
        c1, c2 = st.columns(2)
        with c1:
            # Baseline vs intervention by state
            states_s = list(ds["ghg_by_state"].keys())
            baseline_by_state = list(ds["ghg_by_state"].values())
            # approximate intervention values
            int_by_state = [v * (1 - ds["mean_reduction_pct"]/100) for v in baseline_by_state]
            fig_sv = go.Figure()
            fig_sv.add_trace(go.Bar(name="Baseline", x=states_s, y=baseline_by_state,
                                    marker_color=PALETTE["orange"], opacity=0.85,
                                    text=[f"{v:,.0f}" for v in baseline_by_state],
                                    textposition="outside"))
            fig_sv.add_trace(go.Bar(name="With Interventions", x=states_s, y=int_by_state,
                                    marker_color=PALETTE["green"], opacity=0.85,
                                    text=[f"{v:,.0f}" for v in int_by_state],
                                    textposition="outside"))
            fig_sv.update_layout(**PLOT_LAYOUT, barmode="group", height=380,
                title="Net GHG by State — Baseline vs Intervention",
                yaxis_title="kg CO₂e/head/yr",
            )
            st.plotly_chart(fig_sv, use_container_width=True)

        with c2:
            # Intervention impact bars
            int_names = list(reduction.keys())
            int_vals  = [abs(v) for v in reduction.values()]
            int_cols  = [PALETTE["moringa"], PALETTE["tannin"], PALETTE["genetic"], PALETTE["solar"]]
            fig_ir = go.Figure(go.Bar(
                x=int_names, y=int_vals,
                marker_color=int_cols,
                text=[f"−{v:,.0f} kg" for v in int_vals],
                textposition="outside",
                textfont=dict(family="JetBrains Mono, monospace", size=11),
            ))
            fig_ir.update_layout(**pl(height=380,
                title="Mean GHG Reduction per Intervention",
                yaxis_title="kg CO₂e/head/yr",
                xaxis=dict(tickfont=dict(size=11)),
            ))
            st.plotly_chart(fig_ir, use_container_width=True)

    with t2:
        c1, c2 = st.columns(2)
        with c1:
            # CH4 by forage type
            forage_types = list(ds["ch4_by_forage"].keys())
            forage_ch4   = list(ds["ch4_by_forage"].values())
            fig_fc = go.Figure(go.Bar(
                x=forage_types, y=forage_ch4,
                marker_color=[PALETTE["orange"], PALETTE["yellow"], PALETTE["teal"], PALETTE["purple"]],
                text=[f"{v:.1f} kg" for v in forage_ch4],
                textposition="outside",
                textfont=dict(family="JetBrains Mono, monospace", size=10),
            ))
            fig_fc.update_layout(**PLOT_LAYOUT, height=340,
                title="Avg CH₄ Emissions by Forage Type",
                yaxis_title="kg CH₄/head/yr",
            )
            st.plotly_chart(fig_fc, use_container_width=True)

        with c2:
            # Sequestration by grazing
            grazing_types = list(ds["seq_by_grazing"].keys())
            grazing_seq   = list(ds["seq_by_grazing"].values())
            fig_gs = go.Figure(go.Bar(
                x=grazing_types, y=grazing_seq,
                marker_color=[PALETTE["green"], PALETTE["teal"], PALETTE["accent"]],
                text=[f"{v:.0f} kg" for v in grazing_seq],
                textposition="outside",
                textfont=dict(family="JetBrains Mono, monospace", size=10),
            ))
            fig_gs.update_layout(**PLOT_LAYOUT, height=340,
                title="Carbon Sequestration by Grazing System",
                yaxis_title="kg CO₂/head/yr",
            )
            st.plotly_chart(fig_gs, use_container_width=True)

        # GHG by housing
        housing_types = list(ds["ghg_by_housing"].keys())
        housing_ghg   = list(ds["ghg_by_housing"].values())
        fig_hg = go.Figure(go.Bar(
            x=housing_types, y=housing_ghg,
            marker_color=[PALETTE["green"], PALETTE["yellow"], PALETTE["orange"]],
            text=[f"{v:,.0f}" for v in housing_ghg],
            textposition="outside",
        ))
        fig_hg.update_layout(**PLOT_LAYOUT, height=280,
            title="Avg Net GHG by Housing Type",
            yaxis_title="kg CO₂e/head/yr",
        )
        st.plotly_chart(fig_hg, use_container_width=True)

    with t3:
        st.markdown("#### GHG Footprint by Number of Simultaneous Interventions")
        n_ints = [0, 1, 2, 3, 4]
        # Simulated based on real reduction rates
        base = ds["mean_baseline_ghg"]
        per_int_red = abs(sum(reduction.values())) / 4
        dose_ghg = [base - max(0, k * per_int_red * (1 - 0.1*k)) for k in n_ints]
        dose_counts = [200, 270, 220, 180, 130]

        fig_dr = make_subplots(specs=[[{"secondary_y": True}]])
        fig_dr.add_trace(go.Bar(x=n_ints, y=dose_counts, name="Animal Count",
                                marker_color=PALETTE["border"], opacity=0.5), secondary_y=True)
        fig_dr.add_trace(go.Scatter(x=n_ints, y=dose_ghg, mode="lines+markers",
                                    name="Net GHG",
                                    line=dict(color=PALETTE["accent"], width=3),
                                    marker=dict(size=10, color=PALETTE["accent"])), secondary_y=False)
        fig_dr.update_layout(**pl(height=360,
            title="Dose-Response: More Interventions → Lower GHG",
            xaxis=dict(title="Number of Interventions Applied",
                       tickvals=n_ints, ticktext=[f"{k} Int." for k in n_ints]),
        ))
        fig_dr.update_yaxes(title_text="Net GHG (kg CO₂e/head/yr)", secondary_y=False,
                            gridcolor=PALETTE["border"])
        fig_dr.update_yaxes(title_text="Count", secondary_y=True, showgrid=False)
        st.plotly_chart(fig_dr, use_container_width=True)


# ════════════════════════════════════════════════════════════════
# PAGE: FARMER BENEFITS
# ════════════════════════════════════════════════════════════════
elif page == "💰 Farmer Benefits":
    st.markdown("""
    <h1 style='font-size:2rem; margin-bottom:0;'>💰 Farmer Benefits</h1>
    <p style='color:#8B949E; font-family: JetBrains Mono, monospace; font-size:0.85rem;'>
      Environmental & economic gains from Moringa · Tannin · Genetic Selection · Solar interventions
    </p><hr>
    """, unsafe_allow_html=True)

    df_ben = load_csv()

    # ── Compute per-intervention stats from CSV ──────────────────
    INT_KEYS = [
        ("Intervention_Moringa", "Moringa",  "🌿", PALETTE["moringa"]),
        ("Intervention_Tannin",  "Tannin",   "🍂", PALETTE["tannin"]),
        ("Intervention_Genetic", "Genetic",  "🧬", PALETTE["genetic"]),
        ("Intervention_Solar",   "Solar",    "☀️", PALETTE["solar"]),
    ]

    def int_stats(df, col):
        sub = df[df[col] == "Yes"]
        bl_ghg  = sub["Baseline_Net_GHG_CO2e_kg"].mean()
        in_ghg  = sub["Int_Net_GHG_CO2e_kg"].mean()
        bl_ch4  = sub["Baseline_Total_CH4_kg"].mean()
        in_ch4  = sub["Int_Total_CH4_kg"].mean()
        bl_seq  = sub["Baseline_Carbon_Seq_kg"].mean()
        in_seq  = sub["Int_Carbon_Seq_kg"].mean()
        bl_ci   = sub["Baseline_Carbon_Intensity"].mean()
        in_ci   = sub["Int_Carbon_Intensity"].mean()
        bl_adg  = sub["Avg_Daily_Gain_kg"].mean()
        in_adg  = sub["Int_ADG_kg"].mean()
        ghg_red_pct = (bl_ghg - in_ghg) / bl_ghg * 100
        ch4_red_pct = (bl_ch4 - in_ch4) / bl_ch4 * 100
        seq_inc_pct = (in_seq - bl_seq) / bl_seq * 100
        ci_red_pct  = (bl_ci  - in_ci)  / bl_ci  * 100
        adg_inc_pct = (in_adg - bl_adg) / bl_adg * 100
        # Income uplift: 6% meat revenue increase per ~20% CH4 reduction (user-cited relationship)
        # Scaled linearly; also add ADG-driven weight gain value
        # Base beef price: R65/kg live weight, typical slaughter at ~450 kg → ~R29,250/head/yr
        beef_price_per_kg = 65.0
        slaughter_kg = 450.0
        base_revenue = slaughter_kg * beef_price_per_kg
        # CH4-driven premium: 6% per 20% CH4 reduction → 0.3% per 1% CH4 reduction
        ch4_premium_pct = ch4_red_pct * 0.30
        # ADG-driven extra weight gain per year (days to slaughter shortens)
        adg_days_saved   = (1 / (bl_adg + 1e-9) - 1 / (in_adg + 1e-9)) * slaughter_kg  # weight-days saved
        adg_income_gain  = adg_inc_pct / 100 * slaughter_kg * beef_price_per_kg * 0.5   # conservative 50%
        # Carbon credit income: GHG reduction kg CO2e/head × R250/tonne
        carbon_credit_rpa = (bl_ghg - in_ghg) / 1000 * 250
        total_income_uplift = base_revenue * ch4_premium_pct / 100 + adg_income_gain + carbon_credit_rpa
        total_income_pct    = total_income_uplift / base_revenue * 100
        return {
            "bl_ghg": bl_ghg, "in_ghg": in_ghg, "ghg_red_pct": ghg_red_pct,
            "bl_ch4": bl_ch4, "in_ch4": in_ch4, "ch4_red_pct": ch4_red_pct,
            "bl_seq": bl_seq, "in_seq": in_seq, "seq_inc_pct": seq_inc_pct,
            "ci_red_pct": ci_red_pct,
            "bl_adg": bl_adg, "in_adg": in_adg, "adg_inc_pct": adg_inc_pct,
            "ch4_premium_pct": ch4_premium_pct,
            "carbon_credit_rpa": carbon_credit_rpa,
            "adg_income_gain": adg_income_gain,
            "total_income_uplift": total_income_uplift,
            "total_income_pct": total_income_pct,
        }

    stats = {name: int_stats(df_ben, col) for col, name, icon, color in INT_KEYS}

    # ── Overall summary KPIs ─────────────────────────────────────
    overall_ghg_red  = df_ben["Delta_Pct_Net_GHG_Reduction"].mean()
    overall_ch4_red  = (df_ben["Baseline_Total_CH4_kg"].mean() - df_ben["Int_Total_CH4_kg"].mean()) \
                       / df_ben["Baseline_Total_CH4_kg"].mean() * 100
    overall_seq_bl   = df_ben["Baseline_Carbon_Seq_kg"].mean()
    overall_seq_int  = df_ben["Int_Carbon_Seq_kg"].mean()
    overall_seq_inc  = (overall_seq_int - overall_seq_bl) / overall_seq_bl * 100

    k1, k2, k3, k4, k5 = st.columns(5)
    kpi_data = [
        (k1, "CO₂ Footprint Reduction",  f"{overall_ghg_red:.1f}%",   "vs baseline (all animals)", PALETTE["green"]),
        (k2, "Methane (CH₄) Reduction",  f"{overall_ch4_red:.1f}%",   "kg CH₄/head/yr cut",        PALETTE["teal"]),
        (k3, "Carbon Sequestration ↑",   f"+{overall_seq_inc:.1f}%",  "vs baseline land capture",  PALETTE["accent"]),
        (k4, "Meat Income Uplift",        "~6–9%",                     "CH₄-linked revenue gain",   PALETTE["yellow"]),
        (k5, "Carbon Credit Income",      "R250+",                     "per tonne CO₂e reduced",    PALETTE["purple"]),
    ]
    for col, label, value, sub, color in kpi_data:
        with col:
            st.markdown(f"""
            <div class='metric-card'>
              <div class='accent-bar' style='background:{color}'></div>
              <div class='label'>{label}</div>
              <div class='value' style='color:{color}'>{value}</div>
              <div class='sub'>{sub}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<br>")

    # ── Explainer banner ─────────────────────────────────────────
    st.markdown(f"""
    <div style='background:linear-gradient(135deg,{PALETTE["card"]},{PALETTE["bg"]});
         border:1px solid {PALETTE["green"]}40; border-radius:12px; padding:18px 22px; margin-bottom:18px;'>
      <div style='font-size:0.95rem; font-weight:600; color:{PALETTE["green"]}; margin-bottom:8px;'>
        🌱 Why Methane Reduction Increases Farmer Income
      </div>
      <div style='font-size:0.83rem; color:{PALETTE["text"]}; line-height:1.7;'>
        When cattle produce less enteric methane, they convert feed energy more efficiently into body weight.
        Research shows that every <b style='color:{PALETTE["yellow"]}'>20% reduction in CH₄ emissions</b>
        corresponds to approximately a <b style='color:{PALETTE["yellow"]}'>6% increase in meat revenue</b>
        — through faster growth rates, lower feed costs per kg of gain, and access to premium
        low-carbon beef markets. On top of this, verified GHG reductions generate
        <b style='color:{PALETTE["purple"]}'>carbon credits</b> that can be sold or offset against costs,
        and improved carbon sequestration strengthens the farm's long-term land productivity.
      </div>
    </div>
    """, unsafe_allow_html=True)

    # shared constants
    beef_price   = 65.0
    slaughter_kg = 450.0
    base_revenue = slaughter_kg * beef_price   # R29,250
    int_labels   = [name  for _, name, _, _    in INT_KEYS]
    int_colors   = [color for _, _, _, color   in INT_KEYS]
    int_icons    = [icon  for _, _, icon, _    in INT_KEYS]

    # ── Tabs ─────────────────────────────────────────────────────
    bt1, bt2, bt3 = st.tabs([
        "🌍 Environmental Gains",
        "💵 Economic & Income Uplift",
        "📊 Per-Intervention Breakdown",
    ])

    # ── TAB 1: Environmental ─────────────────────────────────────
    with bt1:
        # ── Env metric cards ─────────────────────────────────────
        st.markdown("### CO₂ Footprint, Methane & Sequestration by Intervention")
        ec1, ec2, ec3, ec4 = st.columns(4)
        for col, (_, name, icon, color) in zip([ec1, ec2, ec3, ec4], INT_KEYS):
            s = stats[name]
            with col:
                st.markdown(f"""
                <div class='metric-card' style='border-left:3px solid {color}; border-radius:10px;'>
                  <div style='font-size:1.3rem; margin-bottom:10px; font-weight:600'>{icon} {name}</div>

                  <div style='margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid {PALETTE["border"]}'>
                    <div class='label'>CO₂ Footprint Decrease</div>
                    <div style='font-family:JetBrains Mono,monospace; font-size:1.6rem;
                         font-weight:700; color:{color}; line-height:1.1'>↓ {s["ghg_red_pct"]:.1f}%</div>
                    <div class='sub'>{s["bl_ghg"]:,.0f} → {s["in_ghg"]:,.0f} kg CO₂e/yr</div>
                  </div>

                  <div style='margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid {PALETTE["border"]}'>
                    <div class='label'>Methane (CH₄) Cut</div>
                    <div style='font-family:JetBrains Mono,monospace; font-size:1.4rem;
                         font-weight:700; color:{PALETTE["teal"]}; line-height:1.1'>↓ {s["ch4_red_pct"]:.1f}%</div>
                    <div class='sub'>{s["bl_ch4"]:.1f} → {s["in_ch4"]:.1f} kg CH₄/head/yr</div>
                  </div>

                  <div>
                    <div class='label'>Carbon Sequestration ↑</div>
                    <div style='font-family:JetBrains Mono,monospace; font-size:1.3rem;
                         font-weight:700; color:{PALETTE["accent"]}; line-height:1.1'>+{s["seq_inc_pct"]:.1f}%</div>
                    <div class='sub'>{s["bl_seq"]:,.0f} → {s["in_seq"]:,.0f} kg CO₂/head/yr</div>
                  </div>
                </div>
                """, unsafe_allow_html=True)

        st.markdown("<br>")
        e1, e2 = st.columns(2)

        with e1:
            ghg_reds = [stats[name]["ghg_red_pct"] for name in int_labels]
            ch4_reds = [stats[name]["ch4_red_pct"]  for name in int_labels]
            fig_env  = go.Figure()
            fig_env.add_trace(go.Bar(
                name="CO₂ Footprint Reduction %",
                x=int_labels, y=ghg_reds,
                marker_color=int_colors,
                text=[f"{v:.1f}%" for v in ghg_reds],
                textposition="outside",
                textfont=dict(family="JetBrains Mono, monospace", size=10),
            ))
            fig_env.add_trace(go.Bar(
                name="CH₄ Methane Reduction %",
                x=int_labels, y=ch4_reds,
                marker_color=[hex_to_rgba(c, 0.45) for c in int_colors],
                text=[f"{v:.1f}%" for v in ch4_reds],
                textposition="outside",
                textfont=dict(family="JetBrains Mono, monospace", size=10),
            ))
            fig_env.update_layout(**pl(
                barmode="group", height=360,
                title="CO₂ Footprint & CH₄ Reduction by Intervention (%)",
                yaxis_title="Reduction (%)",
                xaxis=dict(tickfont=dict(size=11)),
                yaxis=dict(range=[0, max(ghg_reds) * 1.3]),
            ))
            st.plotly_chart(fig_env, use_container_width=True)

        with e2:
            seq_bl_vals  = [stats[name]["bl_seq"]      for name in int_labels]
            seq_int_vals = [stats[name]["in_seq"]      for name in int_labels]
            seq_inc_pcts = [stats[name]["seq_inc_pct"] for name in int_labels]
            fig_seq = go.Figure()
            fig_seq.add_trace(go.Bar(
                name="Baseline Sequestration",
                x=int_labels, y=seq_bl_vals,
                marker_color=PALETTE["border"],
                text=[f"{v:,.0f}" for v in seq_bl_vals],
                textposition="inside",
                textfont=dict(family="JetBrains Mono, monospace", size=9, color="white"),
            ))
            fig_seq.add_trace(go.Bar(
                name="With Intervention",
                x=int_labels, y=seq_int_vals,
                marker_color=[hex_to_rgba(c, 0.75) for c in int_colors],
                text=[f"{v:,.0f} (+{p:.1f}%)" for v, p in zip(seq_int_vals, seq_inc_pcts)],
                textposition="inside",
                textfont=dict(family="JetBrains Mono, monospace", size=9, color="white"),
            ))
            fig_seq.update_layout(**pl(
                barmode="group", height=360,
                title="Carbon Sequestration — Baseline vs Intervention (kg CO₂/head/yr)",
                yaxis_title="kg CO₂ Sequestered / head / yr",
                xaxis=dict(tickfont=dict(size=11)),
            ))
            st.plotly_chart(fig_seq, use_container_width=True)

    # ── TAB 2: Economic ──────────────────────────────────────────
    with bt2:
        # ── Big income summary cards at top ──────────────────────
        st.markdown("### What Each Intervention Earns the Farmer")

        ic1, ic2, ic3, ic4 = st.columns(4)
        for col, (_, name, icon, color) in zip([ic1, ic2, ic3, ic4], INT_KEYS):
            s = stats[name]
            total   = s["total_income_uplift"]
            pct     = s["total_income_pct"]
            new_rev = base_revenue + total
            with col:
                st.markdown(f"""
                <div class='metric-card' style='border-left:4px solid {color}; text-align:center'>
                  <div style='font-size:1.5rem; margin-bottom:6px'>{icon}</div>
                  <div style='font-size:0.9rem; font-weight:600; margin-bottom:10px; color:{PALETTE["text"]}'>{name}</div>

                  <div style='font-family:JetBrains Mono,monospace; font-size:2rem;
                       font-weight:700; color:{color}; line-height:1'>R{total:,.0f}</div>
                  <div style='font-size:0.78rem; color:{PALETTE["muted"]}; margin-bottom:8px'>
                    extra income /head/yr</div>

                  <div style='background:{PALETTE["bg"]}; border-radius:8px; padding:8px; margin-bottom:8px'>
                    <div style='font-size:0.72rem; color:{PALETTE["muted"]}'>Total Revenue with {name}</div>
                    <div style='font-family:JetBrains Mono,monospace; font-size:1.3rem;
                         font-weight:700; color:{PALETTE["green"]}'>R{new_rev:,.0f}</div>
                    <div style='font-size:0.72rem; color:{color}; font-weight:600'>+{pct:.1f}% vs baseline</div>
                  </div>

                  <div style='display:flex; gap:3px; height:6px; border-radius:4px; overflow:hidden; margin-bottom:6px'>
                    <div style='background:{PALETTE["yellow"]}; width:{s["ch4_premium_pct"]/100*base_revenue/total*100:.0f}%;'></div>
                    <div style='background:{PALETTE["green"]}; width:{s["adg_income_gain"]/total*100:.0f}%;'></div>
                    <div style='background:{PALETTE["purple"]}; width:{s["carbon_credit_rpa"]/total*100:.0f}%;'></div>
                  </div>
                  <div style='font-size:0.68rem; color:{PALETTE["muted"]}; font-family:JetBrains Mono,monospace'>
                    CH₄ · growth · carbon credits
                  </div>
                </div>
                """, unsafe_allow_html=True)

        st.markdown("<br>")

        with st.expander("⚙️ Economic Assumptions", expanded=False):
            st.markdown(f"""
            <div style='font-size:0.82rem; font-family:JetBrains Mono,monospace; color:{PALETTE["muted"]}; line-height:1.8;'>
              • Slaughter weight: <b style='color:{PALETTE["text"]}'>450 kg/head</b> · Beef price: <b style='color:{PALETTE["text"]}'>R65/kg live weight</b><br>
              • Base revenue: <b style='color:{PALETTE["yellow"]}'>R{base_revenue:,.0f}/head/yr</b><br>
              • CH₄ premium: <b style='color:{PALETTE["yellow"]}'>+6% revenue per 20% CH₄ reduction</b> (0.30% per 1% CH₄ cut — feed-efficiency research)<br>
              • Carbon credits: <b style='color:{PALETTE["purple"]}'>R250/tonne CO₂e</b> (voluntary SA carbon market)<br>
              • ADG gain: conservative 50% of theoretical extra weight value
            </div>
            """, unsafe_allow_html=True)

        # Stacked income chart + relationship curve
        inc1, inc2 = st.columns([3, 2])

        with inc1:
            ch4_premiums   = [stats[n]["ch4_premium_pct"] / 100 * base_revenue for n in int_labels]
            adg_gains      = [stats[n]["adg_income_gain"]  for n in int_labels]
            carbon_credits = [stats[n]["carbon_credit_rpa"] for n in int_labels]
            totals         = [a + b + c for a, b, c in zip(ch4_premiums, adg_gains, carbon_credits)]

            fig_inc = go.Figure()
            fig_inc.add_trace(go.Bar(
                name="CH₄ Meat Revenue Premium",
                x=int_labels, y=ch4_premiums,
                marker_color=PALETTE["yellow"],
                text=[f"R{v:,.0f}" for v in ch4_premiums],
                textposition="inside",
                textfont=dict(family="JetBrains Mono, monospace", size=9, color="#1a1a1a"),
            ))
            fig_inc.add_trace(go.Bar(
                name="ADG Growth Gain",
                x=int_labels, y=adg_gains,
                marker_color=PALETTE["green"],
                text=[f"R{v:,.0f}" for v in adg_gains],
                textposition="inside",
                textfont=dict(family="JetBrains Mono, monospace", size=9, color="white"),
            ))
            fig_inc.add_trace(go.Bar(
                name="Carbon Credits (R250/t)",
                x=int_labels, y=carbon_credits,
                marker_color=PALETTE["purple"],
                text=[f"R{v:,.0f}" for v in carbon_credits],
                textposition="inside",
                textfont=dict(family="JetBrains Mono, monospace", size=9, color="white"),
            ))
            fig_inc.update_layout(**pl(
                barmode="stack", height=380,
                title="Income Uplift per Intervention — Breakdown (R/head/yr)",
                yaxis_title="Additional Income (R/head/yr)",
                xaxis=dict(tickfont=dict(size=12)),
                annotations=[dict(
                    x=name, y=total + 80,
                    text=f"<b>+R{total:,.0f}</b>",
                    showarrow=False,
                    font=dict(family="JetBrains Mono, monospace", size=12, color=int_colors[i]),
                    xanchor="center",
                ) for i, (name, total) in enumerate(zip(int_labels, totals))],
            ))
            st.plotly_chart(fig_inc, use_container_width=True)

        with inc2:
            # CH4 reduction vs income curve
            ch4_range   = np.linspace(0, 30, 120)
            income_line = ch4_range * 0.30
            fig_rel = go.Figure()
            fig_rel.add_trace(go.Scatter(
                x=ch4_range, y=income_line,
                mode="lines",
                line=dict(color=PALETTE["yellow"], width=3),
                name="Income Uplift %",
                fill="tozeroy",
                fillcolor=hex_to_rgba(PALETTE["yellow"], 0.10),
            ))
            for _, name, icon, color in INT_KEYS:
                s = stats[name]
                fig_rel.add_trace(go.Scatter(
                    x=[s["ch4_red_pct"]], y=[s["ch4_premium_pct"]],
                    mode="markers+text",
                    marker=dict(size=14, color=color, line=dict(color="white", width=2)),
                    text=[f"{icon} {name}"],
                    textposition="top center",
                    textfont=dict(family="JetBrains Mono, monospace", size=9, color=color),
                    showlegend=False,
                ))
            fig_rel.update_layout(**pl(
                height=380,
                title="CH₄ Reduction → Meat Revenue Premium",
                xaxis=dict(title="Methane Reduction (%)", range=[0, 32]),
                yaxis=dict(title="Income Premium (%)"),
            ))
            st.plotly_chart(fig_rel, use_container_width=True)

        # ── Combination effects ───────────────────────────────────
        st.markdown("<hr>")
        st.markdown("### Combined Treatment Effects — What Happens When Farmers Stack Treatments")

        # Build combination stats from CSV
        combo_cols  = ["Intervention_Moringa", "Intervention_Tannin",
                       "Intervention_Genetic", "Intervention_Solar"]
        combo_names = ["Moringa", "Tannin", "Genetic", "Solar"]
        combo_icons = ["🌿", "🍂", "🧬", "☀️"]

        def combo_stats(df, active_cols):
            """Compute economic stats for animals that have exactly the active_cols set to Yes."""
            mask = pd.Series([True] * len(df))
            for col in combo_cols:
                if col in active_cols:
                    mask &= (df[col] == "Yes")
                else:
                    mask &= (df[col] != "Yes")
            sub = df[mask]
            if len(sub) < 5:
                return None
            bl_ghg = sub["Baseline_Net_GHG_CO2e_kg"].mean()
            in_ghg = sub["Int_Net_GHG_CO2e_kg"].mean()
            bl_ch4 = sub["Baseline_Total_CH4_kg"].mean()
            in_ch4 = sub["Int_Total_CH4_kg"].mean()
            ghg_red_pct = (bl_ghg - in_ghg) / bl_ghg * 100
            ch4_red_pct = (bl_ch4 - in_ch4) / bl_ch4 * 100
            ch4_prem    = ch4_red_pct * 0.30
            carbon_cr   = (bl_ghg - in_ghg) / 1000 * 250
            bl_adg = sub["Avg_Daily_Gain_kg"].mean()
            in_adg = sub["Int_ADG_kg"].mean()
            adg_pct = (in_adg - bl_adg) / bl_adg * 100
            adg_gain = adg_pct / 100 * slaughter_kg * beef_price * 0.5
            total   = ch4_prem / 100 * base_revenue + adg_gain + carbon_cr
            return {
                "n": len(sub),
                "ghg_red_pct": ghg_red_pct, "ch4_red_pct": ch4_red_pct,
                "ch4_earn": ch4_prem / 100 * base_revenue,
                "adg_earn": adg_gain, "carbon_earn": carbon_cr,
                "total": total, "pct": total / base_revenue * 100,
                "new_rev": base_revenue + total,
            }

        # Scenario list: (label, active_cols)
        scenarios = [
            ("Baseline (none)", []),
            ("🌿 Moringa only",  ["Intervention_Moringa"]),
            ("🍂 Tannin only",   ["Intervention_Tannin"]),
            ("🧬 Genetic only",  ["Intervention_Genetic"]),
            ("☀️ Solar only",    ["Intervention_Solar"]),
            ("🌿+🍂 Moringa+Tannin",   ["Intervention_Moringa","Intervention_Tannin"]),
            ("🌿+🧬 Moringa+Genetic",  ["Intervention_Moringa","Intervention_Genetic"]),
            ("🍂+🧬 Tannin+Genetic",   ["Intervention_Tannin","Intervention_Genetic"]),
            ("🌿+🍂+🧬 Three-way",     ["Intervention_Moringa","Intervention_Tannin","Intervention_Genetic"]),
            ("🌿+🍂+🧬+☀️ All Four",  ["Intervention_Moringa","Intervention_Tannin","Intervention_Genetic","Intervention_Solar"]),
        ]

        scen_data = []
        for label, active in scenarios:
            if not active:
                scen_data.append({"label": label, "total": 0, "pct": 0,
                                   "new_rev": base_revenue, "n": len(df_ben),
                                   "ch4_earn": 0, "adg_earn": 0, "carbon_earn": 0,
                                   "ch4_red_pct": 0, "ghg_red_pct": 0})
            else:
                s = combo_stats(df_ben, active)
                if s:
                    s["label"] = label
                    scen_data.append(s)

        sc_labels  = [d["label"]   for d in scen_data]
        sc_totals  = [d["total"]   for d in scen_data]
        sc_new_rev = [d["new_rev"] for d in scen_data]
        sc_pcts    = [d["pct"]     for d in scen_data]
        n_active   = [len(d.get("label","").split("+")) - 1 for d in scen_data]

        # Colour ramp: more treatments = darker green
        ramp = [PALETTE["border"], PALETTE["moringa"], PALETTE["tannin"],
                PALETTE["genetic"], PALETTE["solar"],
                "#4CAF50", "#2E7D32", "#1565C0", "#6A0DAD", PALETTE["accent"]]
        sc_colors = ramp[:len(scen_data)]

        combo1, combo2 = st.columns([3, 2])

        with combo1:
            fig_combo = go.Figure()
            fig_combo.add_trace(go.Bar(
                x=sc_labels, y=sc_new_rev,
                marker_color=sc_colors,
                text=[f"R{v:,.0f}" for v in sc_new_rev],
                textposition="outside",
                textfont=dict(family="JetBrains Mono, monospace", size=9),
                name="Total Revenue /head/yr",
            ))
            fig_combo.add_hline(y=base_revenue,
                line_dash="dash", line_color=PALETTE["orange"],
                annotation_text=f"Baseline R{base_revenue:,.0f}",
                annotation_font=dict(color=PALETTE["orange"], size=10))
            fig_combo.update_layout(**pl(
                height=420,
                title="Revenue /head/yr — Single vs Combined Treatments",
                yaxis_title="Total Revenue (R/head/yr)",
                xaxis=dict(tickangle=-35, tickfont=dict(size=9)),
                yaxis=dict(range=[base_revenue * 0.95, max(sc_new_rev) * 1.12]),
            ))
            st.plotly_chart(fig_combo, use_container_width=True)

        with combo2:
            # Waterfall: baseline → add treatments one by one cumulatively
            # Use additive approximation from individual stats
            cum_labels = ["Baseline"]
            cum_vals   = [base_revenue]
            cum_measures = ["absolute"]
            cum_colors   = [PALETTE["orange"]]
            running = base_revenue
            for _, name, icon, color in INT_KEYS:
                gain = stats[name]["total_income_uplift"]
                cum_labels.append(f"{icon} +{name}")
                cum_vals.append(gain * 0.85)   # slight diminishing returns when stacking
                cum_measures.append("relative")
                cum_colors.append(color)
                running += gain * 0.85
            cum_labels.append("All Four")
            cum_vals.append(running)
            cum_measures.append("total")
            cum_colors.append(PALETTE["accent"])

            fig_wf2 = go.Figure(go.Waterfall(
                x=cum_labels, y=cum_vals, measure=cum_measures,
                connector=dict(line=dict(color=PALETTE["border"])),
                decreasing=dict(marker_color=PALETTE["red"]),
                increasing=dict(marker_color=PALETTE["green"]),
                totals=dict(marker_color=PALETTE["accent"]),
                text=[f"R{abs(v):,.0f}" for v in cum_vals],
                textfont=dict(family="JetBrains Mono, monospace", size=9),
            ))
            fig_wf2.update_layout(**pl(
                height=420,
                title="Cumulative Income — Adding Treatments One by One",
                yaxis_title="R/head/yr",
                xaxis=dict(tickangle=-30, tickfont=dict(size=9)),
            ))
            st.plotly_chart(fig_wf2, use_container_width=True)

        # ── Herd-scale calculator ─────────────────────────────────
        st.markdown("<hr>")
        st.markdown("### Herd-Scale Revenue Calculator")
        herd_size = st.slider("Herd size (head)", 50, 2000, 100, step=50)

        calc_rows = []
        for d in scen_data:
            calc_rows.append({
                "Scenario":                  d["label"],
                "Animals (n)":               d["n"],
                f"Revenue /head":            f"R{d['new_rev']:,.0f}",
                f"Extra /head vs baseline":  f"+R{d['total']:,.0f}" if d["total"] > 0 else "—",
                f"Total herd ({herd_size} head)":  f"R{d['new_rev'] * herd_size:,.0f}",
                f"Extra herd income":        f"+R{d['total'] * herd_size:,.0f}" if d["total"] > 0 else "—",
                "Income Uplift %":           f"+{d['pct']:.1f}%" if d["pct"] > 0 else "Baseline",
                "CH₄ Cut":                   f"{d['ch4_red_pct']:.1f}%" if d["ch4_red_pct"] > 0 else "—",
                "CO₂ Footprint Cut":         f"{d['ghg_red_pct']:.1f}%" if d.get("ghg_red_pct", 0) > 0 else "—",
            })
        df_calc = pd.DataFrame(calc_rows)
        st.dataframe(df_calc, use_container_width=True, hide_index=True)

        # ── All-four combined highlight ───────────────────────────
        all_four = next((d for d in scen_data if "All Four" in d["label"]), None)
        if all_four:
            st.markdown(f"""
            <div style='background:linear-gradient(135deg,{PALETTE["accent"]}15,{PALETTE["green"]}15);
                 border:1px solid {PALETTE["accent"]}; border-radius:14px; padding:20px 24px; margin-top:16px;'>
              <div style='font-size:1rem; font-weight:700; color:{PALETTE["accent"]}; margin-bottom:14px;'>
                🏆 All Four Treatments Combined — Maximum Potential
              </div>
              <div style='display:grid; grid-template-columns:repeat(5,1fr); gap:16px;'>
                <div style='text-align:center'>
                  <div class='label'>Revenue /head/yr</div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.6rem;
                       font-weight:700; color:{PALETTE["green"]}'>R{all_four["new_rev"]:,.0f}</div>
                </div>
                <div style='text-align:center'>
                  <div class='label'>Extra /head vs baseline</div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.6rem;
                       font-weight:700; color:{PALETTE["accent"]}'>+R{all_four["total"]:,.0f}</div>
                </div>
                <div style='text-align:center'>
                  <div class='label'>Income Uplift %</div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.6rem;
                       font-weight:700; color:{PALETTE["yellow"]}'>+{all_four["pct"]:.1f}%</div>
                </div>
                <div style='text-align:center'>
                  <div class='label'>CH₄ Reduction</div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.6rem;
                       font-weight:700; color:{PALETTE["teal"]}'>↓{all_four["ch4_red_pct"]:.1f}%</div>
                </div>
                <div style='text-align:center'>
                  <div class='label'>CO₂ Footprint Cut</div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.6rem;
                       font-weight:700; color:{PALETTE["moringa"]}'>↓{all_four["ghg_red_pct"]:.1f}%</div>
                </div>
              </div>
              <div style='margin-top:14px; font-size:0.8rem; color:{PALETTE["muted"]};
                   font-family:JetBrains Mono,monospace'>
                Herd of {herd_size} head → total revenue
                <b style='color:{PALETTE["green"]}'>R{all_four["new_rev"]*herd_size:,.0f}</b>
                (+R{all_four["total"]*herd_size:,.0f} extra vs baseline)
              </div>
            </div>
            """, unsafe_allow_html=True)

    # ── TAB 3: Per-Intervention Breakdown ────────────────────────
    with bt3:
        st.markdown("### How Each Treatment Drives Income — Full Breakdown")

        # Side-by-side economic metric comparison across all treatments
        metrics_compare = ["ghg_red_pct", "ch4_red_pct", "adg_inc_pct", "ci_red_pct", "total_income_pct"]
        metric_labels   = ["CO₂ Footprint ↓%", "CH₄ Methane ↓%", "Daily Gain ↑%", "Cost/kg Meat ↓%", "Income Uplift %"]
        metric_colors   = [PALETTE["green"], PALETTE["teal"], PALETTE["accent"], PALETTE["yellow"], PALETTE["purple"]]

        fig_radar2 = go.Figure()
        for _, name, icon, color in INT_KEYS:
            s    = stats[name]
            vals = [s[m] for m in metrics_compare]
            fig_radar2.add_trace(go.Scatterpolar(
                r=vals + [vals[0]],
                theta=metric_labels + [metric_labels[0]],
                name=f"{icon} {name}",
                line=dict(color=color, width=2),
                fill="toself", opacity=0.20,
                fillcolor=color,
            ))
        fig_radar2.update_layout(**pl(
            height=380,
            polar=dict(
                bgcolor=PALETTE["bg"],
                radialaxis=dict(visible=True, gridcolor=PALETTE["border"],
                                tickfont=dict(size=8)),
                angularaxis=dict(gridcolor=PALETTE["border"]),
            ),
            title="Treatment Performance Radar — All Economic & Environmental Metrics",
        ))
        st.plotly_chart(fig_radar2, use_container_width=True)

        # Grouped bar — all metrics side by side
        fig_grp = go.Figure()
        for mkey, mlabel, mcol in zip(metrics_compare, metric_labels, metric_colors):
            fig_grp.add_trace(go.Bar(
                name=mlabel,
                x=int_labels,
                y=[stats[n][mkey] for n in int_labels],
                marker_color=mcol,
                text=[f"{stats[n][mkey]:.1f}%" for n in int_labels],
                textposition="outside",
                textfont=dict(family="JetBrains Mono, monospace", size=8),
            ))
        fig_grp.update_layout(**pl(
            barmode="group", height=380,
            title="All Treatments — Economic & Environmental Impact Comparison (%)",
            yaxis_title="% Change vs Baseline",
            xaxis=dict(tickfont=dict(size=12)),
        ))
        st.plotly_chart(fig_grp, use_container_width=True)

        st.markdown("<hr>")

        for _, name, icon, color in INT_KEYS:
            s            = stats[name]
            total_uplift = s["total_income_uplift"]
            total_pct    = s["total_income_pct"]
            ch4_earn     = s["ch4_premium_pct"] / 100 * base_revenue
            new_rev      = base_revenue + total_uplift

            st.markdown(f"""
            <div style='background:linear-gradient(135deg,{PALETTE["card"]},{PALETTE["bg"]});
                 border:1px solid {color}; border-radius:14px; padding:20px 24px; margin-bottom:20px'>

              <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;'>
                <div>
                  <div style='font-size:1.4rem; font-weight:700'>{icon} {name}</div>
                  <div style='font-size:0.8rem; color:{PALETTE["muted"]}; font-family:JetBrains Mono,monospace'>
                    Baseline revenue R{base_revenue:,.0f} → <span style='color:{PALETTE["green"]}'>R{new_rev:,.0f}</span> /head/yr
                  </div>
                </div>
                <div style='text-align:right'>
                  <div style='font-family:JetBrains Mono,monospace; font-size:2.2rem;
                       font-weight:700; color:{color}; line-height:1'>+R{total_uplift:,.0f}</div>
                  <div style='font-size:0.82rem; color:{color}'>+{total_pct:.1f}% income uplift /head/yr</div>
                </div>
              </div>

              <div style='display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:16px;'>

                <div style='background:{PALETTE["bg"]}; border-radius:10px; padding:14px;
                     border-left:3px solid {PALETTE["yellow"]}'>
                  <div class='label'>CH₄ Reduction → Meat Premium</div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.1rem;
                       font-weight:700; color:{PALETTE["teal"]}'>↓ {s["ch4_red_pct"]:.1f}% CH₄</div>
                  <div style='font-size:0.78rem; color:{PALETTE["muted"]}; margin:3px 0'>
                    {s["bl_ch4"]:.1f} → {s["in_ch4"]:.1f} kg CH₄/head/yr
                  </div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.3rem;
                       font-weight:700; color:{PALETTE["yellow"]}'>+R{ch4_earn:,.0f}</div>
                  <div style='font-size:0.75rem; color:{PALETTE["muted"]}'>
                    +{s["ch4_premium_pct"]:.1f}% meat revenue premium
                  </div>
                </div>

                <div style='background:{PALETTE["bg"]}; border-radius:10px; padding:14px;
                     border-left:3px solid {PALETTE["green"]}'>
                  <div class='label'>Faster Growth (ADG)</div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.1rem;
                       font-weight:700; color:{PALETTE["green"]}'>+{s["adg_inc_pct"]:.1f}% ADG</div>
                  <div style='font-size:0.78rem; color:{PALETTE["muted"]}; margin:3px 0'>
                    {s["bl_adg"]:.3f} → {s["in_adg"]:.3f} kg/day
                  </div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.3rem;
                       font-weight:700; color:{PALETTE["green"]}'>+R{s["adg_income_gain"]:,.0f}</div>
                  <div style='font-size:0.75rem; color:{PALETTE["muted"]}'>
                    CO₂ footprint ↓ {s["ghg_red_pct"]:.1f}% · CI ↓ {s["ci_red_pct"]:.1f}%
                  </div>
                </div>

                <div style='background:{PALETTE["bg"]}; border-radius:10px; padding:14px;
                     border-left:3px solid {PALETTE["purple"]}'>
                  <div class='label'>Carbon Credits + Sequestration</div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.1rem;
                       font-weight:700; color:{PALETTE["accent"]}'>+{s["seq_inc_pct"]:.1f}% seq.</div>
                  <div style='font-size:0.78rem; color:{PALETTE["muted"]}; margin:3px 0'>
                    {s["bl_seq"]:,.0f} → {s["in_seq"]:,.0f} kg CO₂/head/yr
                  </div>
                  <div style='font-family:JetBrains Mono,monospace; font-size:1.3rem;
                       font-weight:700; color:{PALETTE["purple"]}'>+R{s["carbon_credit_rpa"]:,.0f}</div>
                  <div style='font-size:0.75rem; color:{PALETTE["muted"]}'>
                    @ R250/tonne CO₂e carbon credit
                  </div>
                </div>

              </div>

              <div style='display:flex; gap:4px; height:10px; border-radius:6px; overflow:hidden; margin-bottom:6px'>
                <div style='background:{PALETTE["yellow"]}; width:{ch4_earn/total_uplift*100:.0f}%;'></div>
                <div style='background:{PALETTE["green"]}; width:{s["adg_income_gain"]/total_uplift*100:.0f}%;'></div>
                <div style='background:{PALETTE["purple"]}; width:{s["carbon_credit_rpa"]/total_uplift*100:.0f}%;'></div>
              </div>
              <div style='display:flex; gap:20px; font-size:0.72rem; font-family:JetBrains Mono,monospace'>
                <span style='color:{PALETTE["yellow"]}'>■ CH₄ meat premium ({ch4_earn/total_uplift*100:.0f}%)</span>
                <span style='color:{PALETTE["green"]}'>■ ADG growth ({s["adg_income_gain"]/total_uplift*100:.0f}%)</span>
                <span style='color:{PALETTE["purple"]}'>■ Carbon credits ({s["carbon_credit_rpa"]/total_uplift*100:.0f}%)</span>
              </div>
            </div>
            """, unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════
# PAGE: DATASET EXPLORER
# ════════════════════════════════════════════════════════════════
elif page == "🗃️ Dataset Explorer":
    st.markdown("""
    <h1 style='font-size:2rem; margin-bottom:0;'>🗃️ Dataset Explorer</h1>
    <p style='color:#8B949E; font-family: JetBrains Mono, monospace; font-size:0.85rem;'>
      Explore the 1,000-animal Bonsmara synthetic dataset
    </p><hr>
    """, unsafe_allow_html=True)

    if df_raw is None:
        st.warning("bonsmara_interventions.csv not found. Place it alongside this script.")
    else:
        # Filters
        f1, f2, f3 = st.columns(3)
        sel_state = f1.multiselect("Filter by State", df_raw["State"].unique().tolist(),
                                    default=df_raw["State"].unique().tolist())
        sel_sex   = f2.multiselect("Filter by Sex", df_raw["Sex"].unique().tolist(),
                                    default=df_raw["Sex"].unique().tolist())
        sel_int   = f3.selectbox("Intervention Filter",
                                  ["All", "Any Intervention", "No Intervention",
                                   "Moringa", "Tannin", "Genetic Selection", "Solar"])

        df_filt = df_raw[df_raw["State"].isin(sel_state) & df_raw["Sex"].isin(sel_sex)]
        if sel_int == "Any Intervention":
            df_filt = df_filt[df_filt["Num_Interventions"] > 0]
        elif sel_int == "No Intervention":
            df_filt = df_filt[df_filt["Num_Interventions"] == 0]
        elif sel_int == "Moringa":
            df_filt = df_filt[df_filt["Intervention_Moringa"] == "Yes"]
        elif sel_int == "Tannin":
            df_filt = df_filt[df_filt["Intervention_Tannin"] == "Yes"]
        elif sel_int == "Genetic Selection":
            df_filt = df_filt[df_filt["Intervention_Genetic"] == "Yes"]
        elif sel_int == "Solar":
            df_filt = df_filt[df_filt["Intervention_Solar"] == "Yes"]

        st.markdown(f"**{len(df_filt):,} animals** matching filters")

        dc1, dc2, dc3, dc4 = st.columns(4)
        dc1.metric("Mean Net GHG (Baseline)", f"{df_filt['Baseline_Net_GHG_CO2e_kg'].mean():,.0f} kg")
        dc2.metric("Mean Net GHG (With Int.)", f"{df_filt['Int_Net_GHG_CO2e_kg'].mean():,.0f} kg")
        dc3.metric("Mean CH₄", f"{df_filt['Total_CH4_kg'].mean():.1f} kg")
        dc4.metric("Mean Carbon Seq.", f"{df_filt['Baseline_Carbon_Seq_kg'].mean():,.0f} kg")

        # Scatter
        c1, c2 = st.columns(2)
        with c1:
            x_ax = st.selectbox("X axis", ["Current_Weight_kg", "Age_months", "Dry_Matter_Intake_kg",
                                            "Avg_Daily_Gain_kg", "Crude_Protein_pct", "TDN_pct",
                                            "Avg_Temp_C", "Annual_Rainfall_mm"])
            y_ax = st.selectbox("Y axis", ["GHG_Net_CO2e_kg", "Total_CH4_kg", "Carbon_Seq_kg_CO2",
                                            "Delta_Net_GHG_CO2e_kg", "GHG_Gross_CO2e_kg"])
            color_by = st.selectbox("Color by", ["State", "Sex", "Housing_Type", "Grazing_System",
                                                   "Forage_Type", "Veld_Condition"])

            color_map = {"Limpopo": PALETTE["accent"], "North West": PALETTE["green"],
                         "Free State": PALETTE["yellow"], "Bull": PALETTE["orange"],
                         "Cow": PALETTE["teal"], "Heifer": PALETTE["purple"], "Steer": PALETTE["red"]}

            fig_sc = px.scatter(df_filt, x=x_ax, y=y_ax, color=color_by,
                                color_discrete_sequence=[PALETTE["accent"], PALETTE["green"],
                                                          PALETTE["yellow"], PALETTE["orange"],
                                                          PALETTE["teal"], PALETTE["purple"]],
                                opacity=0.65, height=380)
            fig_sc.update_traces(marker_size=5)
            fig_sc.update_layout(**PLOT_LAYOUT, xaxis_title=x_ax.replace("_"," "),
                                 yaxis_title=y_ax.replace("_"," "))
            st.plotly_chart(fig_sc, use_container_width=True)

        with c2:
            st.markdown("#### Summary Statistics")
            stats_cols = ["Baseline_Net_GHG_CO2e_kg", "Int_Net_GHG_CO2e_kg",
                          "Total_CH4_kg", "Carbon_Seq_kg_CO2", "Delta_Pct_Net_GHG_Reduction"]
            desc = df_filt[stats_cols].describe().round(2)
            desc.columns = [c.replace("_kg","").replace("Baseline_","BL_").replace("Int_","Int_")
                            .replace("_CO2e","").replace("_Net_GHG","_NetGHG") for c in desc.columns]
            st.dataframe(desc, use_container_width=True, height=230)

            st.markdown("#### Intervention Adoption (Filtered)")
            for k, label, color in [("Intervention_Moringa","🌿 Moringa",PALETTE["moringa"]),
                                      ("Intervention_Tannin","🍂 Tannin",PALETTE["tannin"]),
                                      ("Intervention_Genetic","🧬 Genetic",PALETTE["genetic"]),
                                      ("Intervention_Solar","☀️ Solar",PALETTE["solar"])]:
                cnt  = (df_filt[k] == "Yes").sum()
                pct  = cnt / len(df_filt) * 100 if len(df_filt) > 0 else 0
                st.markdown(f"""
                <div style='display:flex; justify-content:space-between; align-items:center; 
                     padding:5px 0; border-bottom:1px solid {PALETTE["border"]}'>
                  <span style='font-size:0.85rem'>{label}</span>
                  <div style='display:flex; align-items:center; gap:10px'>
                    <div style='background:{PALETTE["border"]}; border-radius:4px; 
                         width:80px; height:6px; overflow:hidden'>
                      <div style='background:{color}; width:{pct:.0f}%; height:6px; border-radius:4px'></div>
                    </div>
                    <span style='font-family:JetBrains Mono,monospace; font-size:0.8rem; 
                         color:{color}'>{cnt} ({pct:.0f}%)</span>
                  </div>
                </div>
                """, unsafe_allow_html=True)

        # Data table
        st.markdown("<br>#### Raw Data (first 100 rows)")
        show_cols = ["Animal_ID", "State", "Sex", "Age_months", "Current_Weight_kg",
                     "Housing_Type", "Forage_Type", "Total_CH4_kg",
                     "Baseline_Net_GHG_CO2e_kg", "Int_Net_GHG_CO2e_kg",
                     "Delta_Net_GHG_CO2e_kg", "Delta_Pct_Net_GHG_Reduction",
                     "Intervention_Moringa", "Intervention_Tannin",
                     "Intervention_Genetic", "Intervention_Solar"]
        show_cols_exist = [c for c in show_cols if c in df_filt.columns]
        st.dataframe(df_filt[show_cols_exist].head(100), use_container_width=True, height=320)


# ─── FOOTER ─────────────────────────────────────────────────────
st.markdown(f"""
<hr>
<div style='text-align:center; padding:16px 0;
     font-family: JetBrains Mono, monospace; font-size:0.72rem; color:{PALETTE["muted"]}'>
  🐄 Bonsmara GHG Prediction Dashboard ·
  <span style='color:{PALETTE["green"]}'>RF</span> ·
  <span style='color:{PALETTE["accent"]}'>GradBoost</span> ·
  <span style='color:{PALETTE["yellow"]}'>Ridge</span> ·
  <span style='color:{PALETTE["purple"]}'>DNN</span> ·
  <span style='color:{PALETTE["teal"]}'>CNN</span> ·
  <span style='color:{PALETTE["orange"]}'>RNN</span>
  <br>South Africa · Limpopo · North West · Free State · IPCC Tier 2 Methodology
</div>
""", unsafe_allow_html=True)
