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
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1>GHG Analytics Overview</h1>
          <p>
            Comprehensive snapshot of your operation's environmental footprint.
            Review high-level predictive models and dataset distributions to guide
            intervention strategies.
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="metric-grid metric-grid-5">
        <Card
          label="Total Animals Analyzed"
          value={data.n_total.toLocaleString()}
          sub={
            <span>
              <span className="trend">↑ 15.2% vs last period</span>
            </span>
          }
          color="#2EA043"
        />
        <Card
          label="Avg Baseline GHG"
          value={`${(data.mean_baseline_ghg / 1000).toFixed(1)} tCO₂e`}
          sub={
            <span>
              <span className="trend">↑ 11% vs last period</span>
            </span>
          }
          color="#F78166"
        />
        <Card
          label="Avg Net GHG"
          value={`${(data.mean_int_ghg / 1000).toFixed(1)} tCO₂e`}
          sub={
            <span>
              <span className="trend">↓ 15.4% vs last period</span>
            </span>
          }
          color="#3FB950"
        />
        <Card
          label="Carbon Sequestration"
          value={`${(data.mean_seq / 1000).toFixed(1)} tCO₂e`}
          sub={
            <span>
              <span className="trend">↑ 16.3% vs last period</span>
            </span>
          }
          color="#39D0D8"
        />
        <Card
          label="Methane Output"
          value={`${data.mean_ch4.toFixed(0)} kg/yr`}
          sub={
            <span>
              <span className="trend">↑ 10.2% vs last period</span>
            </span>
          }
          color="#E3B341"
        />
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
              title: { text: 'Net GHG Distribution', font: { size: 14, color: '#24292F' } },
              barmode: 'overlay',
              xaxis: { ...pl().xaxis, title: 'Frequency of predicted Net GHG emissions (tCO₂e) across the current dataset' },
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
                marker: { color: '#2EA043', line: { color: P.border, width: 1 } },
                text: stateVals.map(v => v.toLocaleString(undefined, { maximumFractionDigits: 0 })),
                textposition: 'inside',
                textfont: { family: 'JetBrains Mono, monospace', size: 11, color: 'white' },
              }]}
              layout={pl({
                margin: { l: 90, r: 10, t: 40, b: 20 },
                height: 200,
                title: { text: 'Mean Net GHG by State', font: { size: 13, color: '#24292F' } },
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
                marker: { colors: ['#2EA043', '#E3B341', '#F78166', '#39D0D8'] },
                textfont: { family: 'JetBrains Mono, monospace', size: 11 },
              }]}
              layout={pl({
                margin: { l: 0, r: 0, t: 30, b: 10 },
                height: 170,
                showlegend: true,
                title: { text: 'Animal Class Breakdown', font: { size: 13, color: '#24292F' } }
              })}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        </div>
      </div>

      {/* Model quick summary */}
      <h3 className="section-heading">Model Performance Indicators</h3>
      <div className="metric-grid" style={{ gridTemplateColumns: `repeat(${Math.min(modelNames.length, 3)}, 1fr)` }}>
        {modelNames.slice(0, 3).map((name, i) => {
          const color = modelColors[i];
          const m = data.models_summary[name];
          return (
            <div key={name} className="metric-card" style={{ borderColor: color + '30' }}>
              <div className="accent-bar" style={{ background: color }} />
              <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>{MODEL_ICONS[name]}</div>
              <div className="label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#24292F', marginBottom: 8 }}>{name}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#57606A', marginBottom: 2 }}>R² SCORE</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', color, fontWeight: 700 }}>
                    {m.reg_r2}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#57606A', marginBottom: 2 }}>MAE</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', color, fontWeight: 700 }}>
                    {m.cls_accuracy}
                  </div>
                </div>
              </div>
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
