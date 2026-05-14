import { useState, useEffect } from 'react';
import { fetchInterventions } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, INT_COLORS, INT_ICONS, pl } from '../lib/theme';

const TABS = ['📊 GHG Comparison', '🔬 CH₄ & Sequestration', '📉 Dose-Response'];

const INT_INFO = {
  Moringa: 'Reduces enteric CH₄ 10–20% · Improves N efficiency → less N₂O · +5–10% ADG boost',
  Tannin:  'Condensed tannins suppress methanogens · 15–25% enteric CH₄ cut · Lower manure N excretion',
  Genetic: 'Low-CH₄ EBV selection · 10–15% heritable CH₄ reduction · Improved feed conversion',
  Solar:   'Replaces fossil energy on farm · 60–90% energy CO₂ eliminated · Added sequestration credit',
};

export default function InterventionsPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab]     = useState(0);

  useEffect(() => {
    fetchInterventions()
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="error-box">⚠️ {error}</div>;
  if (!data)  return <div className="loading">Loading intervention data…</div>;

  const intNames  = ['Moringa', 'Tannin', 'Genetic', 'Solar'];
  const intColors = intNames.map(n => INT_COLORS[n]);

  const adoptionPcts = intNames.map(n =>
    ((data.adoption[n] || 0) / data.n_total * 100).toFixed(1)
  );
  const reductions = intNames.map(n => Math.abs(data.reduction_by_int[n] || 0));

  // Dose-response calculation (matches Streamlit)
  const nInts = [0, 1, 2, 3, 4];
  const perIntRed = reductions.reduce((a, b) => a + b, 0) / 4;
  const doseGhg   = nInts.map(k => data.mean_baseline_ghg - Math.max(0, k * perIntRed * (1 - 0.1 * k)));
  const doseCounts = [200, 270, 220, 180, 130];

  const stateKeys  = Object.keys(data.ghg_by_state);
  const stateVals  = Object.values(data.ghg_by_state);
  const intByState = stateVals.map(v => v * (1 - data.mean_reduction_pct / 100));

  return (
    <>
      <div className="page-header">
        <h1>💉 Intervention Analysis</h1>
        <p>Moringa · Tannin · Genetic Selection · Solar Panels — baseline vs. intervention comparison</p>
      </div>
      <hr className="page-divider" />

      {/* Adoption cards */}
      <h3 style={{ marginBottom: 12, fontSize: '0.95rem' }}>Intervention Adoption & GHG Reduction</h3>
      <div className="metric-grid metric-grid-4">
        {intNames.map((name, i) => {
          const color = intColors[i];
          const icon  = INT_ICONS[name];
          const red   = reductions[i];
          const pct   = (red / data.mean_baseline_ghg * 100).toFixed(1);
          const n     = data.adoption[name] || 0;
          const adPct = (n / data.n_total * 100).toFixed(0);
          return (
            <div key={name} className="metric-card" style={{ borderColor: color + '50' }}>
              <div className="accent-bar" style={{ background: color }} />
              <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{icon} {name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', fontWeight: 700, color }}>
                −{red.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
              </div>
              <div className="sub" style={{ color }}>{pct}% reduction</div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${P.border}`, fontSize: '0.75rem', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                {n} animals ({adPct}% adoption)
              </div>
              <details style={{ marginTop: 6 }}>
                <summary style={{ fontSize: '0.78rem', color: P.muted, cursor: 'pointer' }}>📖 Mechanism</summary>
                <p style={{ fontSize: '0.78rem', color: P.muted, marginTop: 4, lineHeight: 1.5 }}>{INT_INFO[name]}</p>
              </details>
            </div>
          );
        })}
      </div>

      <br />
      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={i} className={`tab-btn${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Tab 0: GHG Comparison */}
      {tab === 0 && (
        <div className="col-2">
          <div className="chart-card">
            <Plot
              data={[
                { type: 'bar', name: 'Baseline', x: stateKeys, y: stateVals,
                  marker: { color: P.orange, opacity: 0.85 },
                  text: stateVals.map(v => v.toLocaleString(undefined, { maximumFractionDigits: 0 })),
                  textposition: 'outside' },
                { type: 'bar', name: 'With Interventions', x: stateKeys, y: intByState,
                  marker: { color: P.green, opacity: 0.85 },
                  text: intByState.map(v => v.toLocaleString(undefined, { maximumFractionDigits: 0 })),
                  textposition: 'outside' },
              ]}
              layout={pl({
                barmode: 'group', height: 380,
                title: 'Net GHG by State — Baseline vs Intervention',
                yaxis: { ...pl().yaxis, title: 'kg CO₂e/head/yr' },
              })}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>

          <div className="chart-card">
            <Plot
              data={[{
                type: 'bar',
                x: intNames, y: reductions,
                marker: { color: intColors },
                text: reductions.map(v => `−${v.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`),
                textposition: 'outside',
                textfont: { family: 'JetBrains Mono, monospace', size: 11 },
              }]}
              layout={pl({
                height: 380,
                title: 'Mean GHG Reduction per Intervention',
                yaxis: { ...pl().yaxis, title: 'kg CO₂e/head/yr' },
              })}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        </div>
      )}

      {/* Tab 1: CH₄ & Sequestration */}
      {tab === 1 && (
        <>
          <div className="col-2">
            <div className="chart-card">
              <Plot
                data={[{
                  type: 'bar',
                  x: Object.keys(data.ch4_by_forage),
                  y: Object.values(data.ch4_by_forage),
                  marker: { color: [P.orange, P.yellow, P.teal, P.purple] },
                  text: Object.values(data.ch4_by_forage).map(v => `${v.toFixed(1)} kg`),
                  textposition: 'outside',
                  textfont: { family: 'JetBrains Mono, monospace', size: 10 },
                }]}
                layout={pl({
                  height: 340,
                  title: 'Avg CH₄ Emissions by Forage Type',
                  yaxis: { ...pl().yaxis, title: 'kg CH₄/head/yr' },
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>

            <div className="chart-card">
              <Plot
                data={[{
                  type: 'bar',
                  x: Object.keys(data.seq_by_grazing),
                  y: Object.values(data.seq_by_grazing),
                  marker: { color: [P.green, P.teal, P.accent] },
                  text: Object.values(data.seq_by_grazing).map(v => `${v.toFixed(0)} kg`),
                  textposition: 'outside',
                  textfont: { family: 'JetBrains Mono, monospace', size: 10 },
                }]}
                layout={pl({
                  height: 340,
                  title: 'Carbon Sequestration by Grazing System',
                  yaxis: { ...pl().yaxis, title: 'kg CO₂/head/yr' },
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>
          </div>

          <div className="chart-card">
            <Plot
              data={[{
                type: 'bar',
                x: Object.keys(data.ghg_by_housing),
                y: Object.values(data.ghg_by_housing),
                marker: { color: [P.green, P.yellow, P.orange] },
                text: Object.values(data.ghg_by_housing).map(v => v.toLocaleString(undefined, { maximumFractionDigits: 0 })),
                textposition: 'outside',
              }]}
              layout={pl({
                height: 280,
                title: 'Avg Net GHG by Housing Type',
                yaxis: { ...pl().yaxis, title: 'kg CO₂e/head/yr' },
              })}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        </>
      )}

      {/* Tab 2: Dose-Response */}
      {tab === 2 && (
        <div className="chart-card">
          <h3 style={{ marginBottom: 10, fontSize: '0.9rem' }}>GHG Footprint by Number of Simultaneous Interventions</h3>
          <Plot
            data={[
              {
                type: 'bar', name: 'Animal Count',
                x: nInts, y: doseCounts,
                marker: { color: P.border, opacity: 0.5 },
                yaxis: 'y2',
              },
              {
                type: 'scatter', mode: 'lines+markers', name: 'Net GHG',
                x: nInts, y: doseGhg,
                line: { color: P.accent, width: 3 },
                marker: { size: 10, color: P.accent },
                yaxis: 'y',
              },
            ]}
            layout={pl({
              height: 360,
              title: 'Dose-Response: More Interventions → Lower GHG',
              xaxis: { ...pl().xaxis, title: 'Number of Interventions Applied',
                tickvals: nInts, ticktext: nInts.map(k => `${k} Int.`) },
              yaxis:  { ...pl().yaxis, title: 'Net GHG (kg CO₂e/head/yr)' },
              yaxis2: { title: 'Count', overlaying: 'y', side: 'right', showgrid: false, color: P.muted },
            })}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </div>
      )}
    </>
  );
}
