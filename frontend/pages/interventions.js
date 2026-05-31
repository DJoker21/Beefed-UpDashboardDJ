import { useState, useEffect } from 'react';
import { fetchInterventions } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, INT_COLORS, INT_ICONS, pl } from '../lib/theme';

const TABS = ['GHG Comparison', 'CH₄ & Sequestration', 'Dose-Response'];

const TOP_PERFORMERS = [
  { name: 'Asparagopsis Feed Additive', value: '-28.5', unit: '% CH₄', adoption: '1,240 Farms', icon: '🌱', color: '#2EA043' },
  { name: 'Rotational Grazing (Intensive)', value: '+15.2', unit: '% Seq.', adoption: '3,850 Farms', icon: '🔄', color: '#39D0D8' },
  { name: 'Anaerobic Digesters', value: '-42.0', unit: '% N₂O', adoption: '412 Farms', icon: '⚡', color: '#BC8CFF' },
  { name: 'Improved Forage Quality', value: '-12.4', unit: '% Total', adoption: '5,120 Farms', icon: '🌾', color: '#E3B341' },
];

export default function InterventionsPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab]     = useState(0);
  const [stateFilter, setStateFilter] = useState('All States');
  const [metricFilter, setMetricFilter] = useState('CO₂e');

  useEffect(() => {
    fetchInterventions()
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="error-box">⚠️ {error}</div>;
  if (!data)  return <div className="loading">Loading intervention data…</div>;

  const intNames  = ['Moringa', 'Tannin', 'Genetic', 'Solar'];
  const intColors = intNames.map(n => INT_COLORS[n]);

  const reductions = intNames.map(n => Math.abs(data.reduction_by_int[n] || 0));

  // Dose-response calculation
  const nInts = [0, 1, 2, 3, 4];
  const perIntRed = reductions.reduce((a, b) => a + b, 0) / 4;
  const doseGhg   = nInts.map(k => data.mean_baseline_ghg - Math.max(0, k * perIntRed * (1 - 0.1 * k)));
  const doseCounts = [200, 270, 220, 180, 130];

  const stateKeys  = Object.keys(data.ghg_by_state);
  const stateVals  = Object.values(data.ghg_by_state);
  const intByState = stateVals.map(v => v * (1 - data.mean_reduction_pct / 100));

  // Mock data for emissions by source category
  const sourceCategories = ['Enteric', 'Manure Management', 'Feed Production', 'Energy Use'];
  const baselineEmissions = [4500, 1800, 2200, 800];
  const postIntEmissions = [3200, 1200, 1900, 500];

  return (
    <>
      {/* Header */}
      <div className="intervention-header">
        <h1>Intervention Analysis</h1>
        <p>Compare the efficacy of GHG reduction strategies</p>
      </div>

      {/* Top Performer KPI Cards */}
      <div className="top-performer-grid">
        {TOP_PERFORMERS.map((perf, idx) => (
          <div key={idx} className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-icon" style={{ background: `${perf.color}15` }}>
                {perf.icon}
              </div>
              <div className="top-performer-badge">Top Performer</div>
            </div>
            <div className="top-performer-title">{perf.name}</div>
            <div>
              <span className="top-performer-value" style={{ color: perf.color }}>
                {perf.value}
              </span>
              <span className="top-performer-unit">{perf.unit}</span>
            </div>
            <div className="top-performer-metric">
              <span className="top-performer-metric-dot" style={{ background: perf.color }}></span>
              <span>Adoption: {perf.adoption}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabbed Section */}
      <div className="tabbed-section">
        <div className="tabs-with-filters">
          <div className="tabs-left">
            {TABS.map((t, i) => (
              <button
                key={i}
                className={`tab-btn${tab === i ? ' active' : ''}`}
                onClick={() => setTab(i)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="tabs-filters">
            <select
              className="filter-select"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option>Filter: All States</option>
              <option>Filter: Limpopo</option>
              <option>Filter: North West</option>
              <option>Filter: Free State</option>
            </select>
            <select
              className="filter-select"
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
            >
              <option>Metric: CO₂e</option>
              <option>Metric: CH₄</option>
              <option>Metric: N₂O</option>
            </select>
          </div>
        </div>

        <div className="tab-content">
          {/* Tab 0: GHG Comparison */}
          {tab === 0 && (
            <div className="chart-grid-2">
              <div className="chart-card-intervention">
                <div className="chart-title">Emissions by Source Category</div>
                <div className="chart-subtitle">
                  Baseline vs. Asparagopsis + Rotational Grazing
                  <svg viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <Plot
                  data={[
                    {
                      type: 'bar',
                      name: 'Baseline (tCO₂e)',
                      x: sourceCategories,
                      y: baselineEmissions,
                      marker: { color: '#E3B341' },
                    },
                    {
                      type: 'bar',
                      name: 'Post-Intervention (CO₂e)',
                      x: sourceCategories,
                      y: postIntEmissions,
                      marker: { color: '#2EA043' },
                    },
                  ]}
                  layout={pl({
                    height: 360,
                    barmode: 'group',
                    showlegend: true,
                    legend: { orientation: 'h', y: 1.15, x: 0.5, xanchor: 'center' },
                    margin: { l: 50, r: 20, t: 20, b: 80 },
                    xaxis: { ...pl().xaxis, tickangle: -20 },
                    yaxis: { ...pl().yaxis, title: '' },
                  })}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%' }}
                  useResizeHandler
                />
              </div>

              <div className="chart-card-intervention">
                <div className="chart-title">Regional Intervention Efficacy</div>
                <div className="chart-subtitle">Top 5 states by absolute reduction volume</div>
                <Plot
                  data={[
                    {
                      type: 'bar',
                      name: 'Baseline',
                      x: stateVals.slice(0, 5),
                      y: stateKeys.slice(0, 5),
                      orientation: 'h',
                      marker: { color: '#E3B341' },
                    },
                    {
                      type: 'bar',
                      name: 'Intervention',
                      x: intByState.slice(0, 5),
                      y: stateKeys.slice(0, 5),
                      orientation: 'h',
                      marker: { color: '#2EA043' },
                    },
                  ]}
                  layout={pl({
                    height: 360,
                    barmode: 'overlay',
                    showlegend: true,
                    legend: { orientation: 'h', y: 1.15, x: 0.5, xanchor: 'center' },
                    margin: { l: 80, r: 20, t: 20, b: 40 },
                    xaxis: { ...pl().xaxis, title: '' },
                    yaxis: { ...pl().yaxis, title: '' },
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
            <div className="chart-grid-2">
              <div className="chart-card-intervention">
                <div className="chart-title">Avg CH₄ Emissions by Forage Type</div>
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
                    yaxis: { ...pl().yaxis, title: 'kg CH₄/head/yr' },
                    margin: { l: 50, r: 20, t: 20, b: 80 },
                  })}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%' }}
                  useResizeHandler
                />
              </div>

              <div className="chart-card-intervention">
                <div className="chart-title">Carbon Sequestration by Grazing System</div>
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
                    yaxis: { ...pl().yaxis, title: 'kg CO₂/head/yr' },
                    margin: { l: 50, r: 20, t: 20, b: 80 },
                  })}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%' }}
                  useResizeHandler
                />
              </div>
            </div>
          )}

          {/* Tab 2: Dose-Response */}
          {tab === 2 && (
            <div className="chart-card-intervention">
              <div className="chart-title">GHG Footprint by Number of Simultaneous Interventions</div>
              <div className="chart-subtitle">Dose-Response: More Interventions → Lower GHG</div>
              <Plot
                data={[
                  {
                    type: 'bar',
                    name: 'Animal Count',
                    x: nInts,
                    y: doseCounts,
                    marker: { color: P.border, opacity: 0.5 },
                    yaxis: 'y2',
                  },
                  {
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Net GHG',
                    x: nInts,
                    y: doseGhg,
                    line: { color: P.accent, width: 3 },
                    marker: { size: 10, color: P.accent },
                    yaxis: 'y',
                  },
                ]}
                layout={pl({
                  height: 400,
                  xaxis: {
                    ...pl().xaxis,
                    title: 'Number of Interventions Applied',
                    tickvals: nInts,
                    ticktext: nInts.map(k => `${k} Int.`)
                  },
                  yaxis: { ...pl().yaxis, title: 'Net GHG (kg CO₂e/head/yr)' },
                  yaxis2: {
                    title: 'Count',
                    overlaying: 'y',
                    side: 'right',
                    showgrid: false,
                    color: P.muted
                  },
                  margin: { l: 60, r: 60, t: 20, b: 60 },
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
