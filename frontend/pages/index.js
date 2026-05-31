import { useState, useEffect } from 'react';
import { fetchOverview } from '../lib/api';
import Card from '../components/Card';
import Plot from '../components/PlotlyChart';
import { P, MODEL_COLORS, MODEL_ICONS, INT_COLORS, INT_ICONS, pl, hexToRgba } from '../lib/theme';

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverview()
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="error-box">⚠️ Failed to load overview: {error}</div>;
  if (!data)  return <div className="loading">Loading overview…</div>;

  const intDist = data.ghg_distribution.map(v => Math.max(0, v * (1 - data.mean_reduction_pct / 100)));
  const stateKeys   = Object.keys(data.ghg_by_state);
  const stateVals   = Object.values(data.ghg_by_state);
  const classDist   = data.ghg_class_dist;
  const modelNames  = Object.keys(data.models_summary);
  const modelColors = Object.values(MODEL_COLORS);

  return (
    <>
      <div className="page-header">
        <h1>Bonsmara Cattle</h1>
        <p>Greenhouse Gas Footprint Prediction · South Africa · 1,000 head · 3 Agro-Ecological States</p>
      </div>
      <hr className="page-divider" />

      {/* KPI row */}
      <div className="metric-grid metric-grid-5">
        <Card label="Total Animals"      value="1,000"                                    sub="head in dataset"          color={P.accent} />
        <Card label="Baseline Net GHG"   value={`${data.mean_baseline_ghg.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="kg CO₂e/head/yr"          color={P.orange} />
        <Card label="With Interventions" value={`${data.mean_int_ghg.toLocaleString(undefined,{maximumFractionDigits:0})}`}      sub="kg CO₂e/head/yr"          color={P.green}  />
        <Card label="Mean CH₄ Emission"  value={`${data.mean_ch4.toFixed(1)}`}            sub="kg CH₄/head/yr"           color={P.yellow} />
        <Card label="Carbon Seq."        value={`${data.mean_seq.toLocaleString(undefined,{maximumFractionDigits:0})}`}          sub="kg CO₂/head/yr"           color={P.teal}   />
      </div>

      {/* Distribution + State charts */}
      <div className="col-3-2">
        <div className="chart-card">
          <Plot
            data={[
              { type: 'histogram', x: data.ghg_distribution, name: 'Baseline Net GHG',
                marker: { color: P.orange }, opacity: 0.65, nbinsx: 40 },
              { type: 'histogram', x: intDist,               name: 'With Interventions',
                marker: { color: P.green },  opacity: 0.65, nbinsx: 40 },
            ]}
            layout={pl({
              title: { text: 'Net GHG Footprint Distribution', font: { size: 13 } },
              barmode: 'overlay',
              xaxis: { ...pl().xaxis, title: 'Net GHG (kg CO₂e/head/year)' },
              yaxis: { ...pl().yaxis, title: 'Count' },
              height: 330,
            })}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </div>

        <div>
          <div className="chart-card">
            <Plot
              data={[{
                type: 'bar', orientation: 'h',
                x: stateVals, y: stateKeys,
                marker: { color: [P.accent, P.purple, P.teal], line: { color: P.border, width: 1 } },
                text: stateVals.map(v => v.toLocaleString(undefined, { maximumFractionDigits: 0 })),
                textposition: 'inside',
                textfont: { family: 'JetBrains Mono, monospace', size: 11, color: 'white' },
              }]}
              layout={pl({
                margin: { l: 90, r: 10, t: 40, b: 20 },
                height: 200,
                title: { text: 'Mean Net GHG (kg CO₂e/head/yr)', font: { size: 12 } },
              })}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>

          <div className="chart-card">
            <Plot
              data={[{
                type: 'pie',
                labels: Object.keys(classDist),
                values: Object.values(classDist),
                hole: 0.55,
                marker: { colors: [P.green, P.yellow, P.orange] },
                textfont: { family: 'JetBrains Mono, monospace', size: 11 },
              }]}
              layout={pl({ margin: { l: 0, r: 0, t: 10, b: 10 }, height: 170, showlegend: true })}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        </div>
      </div>

      {/* Model quick summary */}
      <hr />
      <h3 style={{ marginBottom: 14, fontSize: '1rem' }}>ML Model Performance Quick Summary</h3>
      <div className="metric-grid" style={{ gridTemplateColumns: `repeat(${modelNames.length}, 1fr)` }}>
        {modelNames.map((name, i) => {
          const color = modelColors[i];
          const m = data.models_summary[name];
          return (
            <div key={name} className="metric-card" style={{ borderColor: color + '30' }}>
              <div className="accent-bar" style={{ background: color }} />
              <div style={{ fontSize: '1.2rem' }}>{MODEL_ICONS[name]}</div>
              <div className="label">{name.split(' ')[0]}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', color, fontWeight: 700 }}>
                R²={m.reg_r2}
              </div>
              <div className="sub">Acc={m.cls_accuracy}</div>
            </div>
          );
        })}
      </div>

      {/* Intervention impact */}
      <br />
      <h3 style={{ marginBottom: 14, fontSize: '1rem' }}>Intervention GHG Reduction Impact</h3>
      <div className="metric-grid metric-grid-4">
        {Object.entries(data.reduction_by_int).map(([name, val]) => {
          const color = INT_COLORS[name] || P.accent;
          const icon  = INT_ICONS[name]  || '💉';
          const pct   = (Math.abs(val) / data.mean_baseline_ghg * 100).toFixed(1);
          return (
            <div key={name} className="metric-card">
              <div className="accent-bar" style={{ background: color }} />
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon} {name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', fontWeight: 700, color }}>
                −{Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="sub">kg CO₂e/head/yr ({pct}% reduction)</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
