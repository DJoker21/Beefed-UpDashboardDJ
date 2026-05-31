import { useState, useEffect } from 'react';
import { fetchFarmerBenefits } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, INT_COLORS, INT_ICONS, pl, hexToRgba } from '../lib/theme';

const INT_KEYS = ['Moringa', 'Tannin', 'Genetic', 'Solar'];
const TABS = ['Environmental Gains', 'Economic Uplifts', 'Per-intervention Breakdowns'];

const BENEFIT_CARDS = [
  { name: 'Red Asparagopsis Supplement', category: 'FEED ADDITIVE', badge: 'High Impact', badgeClass: 'high-impact', ch4Reduction: '-45%', costPerHead: '$12.50', roi: '+18%' },
  { name: 'Adaptive Multi-Paddock', category: 'GRAZING MANAGEMENT', badge: 'Best ROI', badgeClass: 'best-roi', ch4Reduction: '-12%', costPerHead: '$4.20', roi: '+34%' },
  { name: 'Legume Overseeding', category: 'PASTURE IMPROVEMENT', badge: 'Steady Gain', badgeClass: 'steady-gain', ch4Reduction: '-8%', costPerHead: '$6.80', roi: '+22%' },
];

export default function BenefitsPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab]     = useState(0);

  useEffect(() => {
    fetchFarmerBenefits()
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="error-box">⚠️ {error}</div>;
  if (!data)  return <div className="loading">Loading farmer benefits…</div>;

  const { stats, overall_ghg_red, overall_ch4_red, overall_seq_inc, base_revenue } = data;
  const intColors = INT_KEYS.map(n => INT_COLORS[n]);

  // Income computations
  const ch4Premiums   = INT_KEYS.map(n => (stats[n].ch4_premium_pct / 100) * base_revenue);
  const adgGains      = INT_KEYS.map(n => stats[n].adg_income_gain);
  const carbonCredits = INT_KEYS.map(n => stats[n].carbon_credit_rpa);
  const totals        = INT_KEYS.map((n, i) => ch4Premiums[i] + adgGains[i] + carbonCredits[i]);

  const metricsCompare  = ['ghg_red_pct', 'ch4_red_pct', 'adg_inc_pct', 'ci_red_pct', 'total_income_pct'];
  const metricLabels    = ['CO₂ Footprint ↓%', 'CH₄ Methane ↓%', 'Daily Gain ↑%', 'Cost/kg Meat ↓%', 'Income Uplift %'];
  const metricColors    = [P.green, P.teal, P.accent, P.yellow, P.purple];

  // Calculate average meat income uplift
  const avgIncomeUplift = totals.reduce((a, b) => a + b, 0) / totals.length;
  const avgCarbonCredit = carbonCredits.reduce((a, b) => a + b, 0) / carbonCredits.length;

  return (
    <>
      {/* Header */}
      <div className="benefits-header">
        <h1>Farmer Benefits & ROI</h1>
        <p>Translate environmental interventions into tangible economic value.</p>
      </div>

      {/* KPI Metrics Row */}
      <div className="benefits-kpi-row">
        <div className="benefits-kpi-card">
          <div className="benefits-kpi-icon">🏭</div>
          <div className="benefits-kpi-trend">
            <span className="benefits-kpi-trend-arrow">↓</span>
            <span>Reduced</span>
          </div>
          <div className="benefits-kpi-label">CO₂e Footprint Reduction</div>
          <div className="benefits-kpi-value" style={{ color: P.green }}>
            {overall_ghg_red.toFixed(1)}%
          </div>
        </div>

        <div className="benefits-kpi-card">
          <div className="benefits-kpi-icon">🌡️</div>
          <div className="benefits-kpi-trend">
            <span className="benefits-kpi-trend-arrow">↓</span>
            <span>Reduced</span>
          </div>
          <div className="benefits-kpi-label">Methane (CH₄) Reduction</div>
          <div className="benefits-kpi-value" style={{ color: P.teal }}>
            {overall_ch4_red.toFixed(1)}%
          </div>
        </div>

        <div className="benefits-kpi-card">
          <div className="benefits-kpi-icon">🌱</div>
          <div className="benefits-kpi-trend">
            <span className="benefits-kpi-trend-arrow" style={{ color: P.accent }}>↑</span>
            <span>Positive</span>
          </div>
          <div className="benefits-kpi-label">Carbon Sequestration</div>
          <div className="benefits-kpi-value" style={{ color: P.accent }}>
            +{overall_seq_inc.toFixed(1)}%
          </div>
        </div>

        <div className="benefits-kpi-card">
          <div className="benefits-kpi-icon">💰</div>
          <div className="benefits-kpi-trend">
            <span className="benefits-kpi-trend-arrow" style={{ color: P.yellow }}>↑</span>
            <span>Positive</span>
          </div>
          <div className="benefits-kpi-label">Meat Income Uplift</div>
          <div className="benefits-kpi-value" style={{ color: P.yellow }}>
            ${avgIncomeUplift.toFixed(2)}
          </div>
          <div className="benefits-kpi-unit">/ head</div>
        </div>

        <div className="benefits-kpi-card">
          <div className="benefits-kpi-icon">💳</div>
          <div className="benefits-kpi-trend">
            <span className="benefits-kpi-trend-arrow" style={{ color: P.purple }}>↑</span>
            <span>Positive</span>
          </div>
          <div className="benefits-kpi-label">Est. Carbon Credit Value</div>
          <div className="benefits-kpi-value" style={{ color: P.purple }}>
            ${Math.round(avgCarbonCredit * 100).toLocaleString()}
          </div>
          <div className="benefits-kpi-unit">/ yr</div>
        </div>
      </div>

      {/* ROI Hero Section */}
      <div className="roi-hero">
        <div className="roi-hero-content">
          <div className="roi-hero-tag">THE BUSINESS CASE FOR SUSTAINABILITY</div>
          <h2 className="roi-hero-title">
            Turning GHG Reductions into <span className="highlight">New Revenue Streams</span>
          </h2>
          <p className="roi-hero-text">
            Implementing regenerative practices and feed additives doesn't just reduce your carbon
            footprint—it opens doors to premium markets and carbon credit markets. Our predictive
            models show that farms transitioning see an average ROI of 22% within the first 36 months,
            offsetting initial intervention costs completely.
          </p>
          <div className="roi-hero-actions">
            <button className="roi-hero-btn-primary">
              Calculate Your Farm's ROI →
            </button>
            <button className="roi-hero-btn-secondary">
              📄 Read Market Report
            </button>
          </div>
        </div>
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
        </div>

        <div className="tab-content">
          {/* Tab 0: Environmental Gains */}
          {tab === 0 && (
            <>
              <h3 style={{ marginBottom: 14, fontSize: '0.95rem', color: P.text }}>
                CO₂ Footprint, Methane & Sequestration by Intervention
              </h3>
              <div className="metric-grid metric-grid-4">
                {INT_KEYS.map(name => {
                  const s = stats[name];
                  const color = INT_COLORS[name];
                  return (
                    <div key={name} className="metric-card" style={{ borderLeft: `3px solid ${color}` }}>
                      <div style={{ fontSize: '1.3rem', marginBottom: 10, fontWeight: 600 }}>
                        {INT_ICONS[name]} {name}
                      </div>

                      <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${P.border}` }}>
                        <div className="label">CO₂ Footprint Decrease</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1.1 }}>
                          ↓ {s.ghg_red_pct.toFixed(1)}%
                        </div>
                        <div className="sub">{s.bl_ghg.toLocaleString(undefined, { maximumFractionDigits: 0 })} → {s.in_ghg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO₂e/yr</div>
                      </div>

                      <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${P.border}` }}>
                        <div className="label">Methane (CH₄) Cut</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', fontWeight: 700, color: P.teal, lineHeight: 1.1 }}>
                          ↓ {s.ch4_red_pct.toFixed(1)}%
                        </div>
                        <div className="sub">{s.bl_ch4.toFixed(1)} → {s.in_ch4.toFixed(1)} kg CH₄/head/yr</div>
                      </div>

                      <div>
                        <div className="label">Carbon Sequestration ↑</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', fontWeight: 700, color: P.accent, lineHeight: 1.1 }}>
                          +{s.seq_inc_pct.toFixed(1)}%
                        </div>
                        <div className="sub">{s.bl_seq.toLocaleString(undefined, { maximumFractionDigits: 0 })} → {s.in_seq.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO₂/head/yr</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <br />
              <div className="col-2">
                <div className="chart-card">
                  <Plot
                    data={[
                      { type: 'bar', name: 'CO₂ Footprint Reduction %',
                        x: INT_KEYS, y: INT_KEYS.map(n => stats[n].ghg_red_pct),
                        marker: { color: intColors },
                        text: INT_KEYS.map(n => `${stats[n].ghg_red_pct.toFixed(1)}%`), textposition: 'outside',
                        textfont: { family: 'JetBrains Mono, monospace', size: 10 } },
                      { type: 'bar', name: 'CH₄ Methane Reduction %',
                        x: INT_KEYS, y: INT_KEYS.map(n => stats[n].ch4_red_pct),
                        marker: { color: intColors.map(c => hexToRgba(c, 0.45)) },
                        text: INT_KEYS.map(n => `${stats[n].ch4_red_pct.toFixed(1)}%`), textposition: 'outside',
                        textfont: { family: 'JetBrains Mono, monospace', size: 10 } },
                    ]}
                    layout={pl({
                      barmode: 'group', height: 360,
                      title: 'CO₂ Footprint & CH₄ Reduction by Intervention (%)',
                      yaxis: { ...pl().yaxis, title: 'Reduction (%)' },
                    })}
                    config={{ displayModeBar: false }}
                    style={{ width: '100%' }}
                    useResizeHandler
                  />
                </div>

                <div className="chart-card">
                  <Plot
                    data={[
                      { type: 'bar', name: 'Baseline Sequestration',
                        x: INT_KEYS, y: INT_KEYS.map(n => stats[n].bl_seq),
                        marker: { color: P.border },
                        text: INT_KEYS.map(n => stats[n].bl_seq.toLocaleString(undefined, { maximumFractionDigits: 0 })),
                        textposition: 'inside', textfont: { family: 'JetBrains Mono, monospace', size: 9, color: 'white' } },
                      { type: 'bar', name: 'With Intervention',
                        x: INT_KEYS, y: INT_KEYS.map(n => stats[n].in_seq),
                        marker: { color: intColors.map(c => hexToRgba(c, 0.75)) },
                        text: INT_KEYS.map(n => `${stats[n].in_seq.toLocaleString(undefined, { maximumFractionDigits: 0 })} (+${stats[n].seq_inc_pct.toFixed(1)}%)`),
                        textposition: 'inside', textfont: { family: 'JetBrains Mono, monospace', size: 9, color: 'white' } },
                    ]}
                    layout={pl({
                      barmode: 'group', height: 360,
                      title: 'Carbon Sequestration — Baseline vs Intervention (kg CO₂/head/yr)',
                      yaxis: { ...pl().yaxis, title: 'kg CO₂ Sequestered / head / yr' },
                    })}
                    config={{ displayModeBar: false }}
                    style={{ width: '100%' }}
                    useResizeHandler
                  />
                </div>
              </div>
            </>
          )}

          {/* Tab 1: Economic Uplifts */}
          {tab === 1 && (
            <>
              <div className="benefits-intervention-cards">
                {BENEFIT_CARDS.map((card, idx) => (
                  <div key={idx} className="benefit-card">
                    <div className="benefit-card-header">
                      <div className="benefit-card-category">{card.category}</div>
                      <div className={`benefit-card-badge ${card.badgeClass}`}>
                        {card.badge}
                      </div>
                    </div>
                    <div className="benefit-card-title">{card.name}</div>

                    <div className="benefit-card-metrics">
                      <div className="benefit-card-metric">
                        <div className="benefit-card-metric-label">CH₄ Reduction</div>
                        <div className="benefit-card-metric-value" style={{ color: P.teal }}>
                          {card.ch4Reduction}
                        </div>
                      </div>
                      <div className="benefit-card-metric">
                        <div className="benefit-card-metric-label">Cost / Head</div>
                        <div className="benefit-card-metric-value" style={{ color: P.muted }}>
                          {card.costPerHead}
                        </div>
                      </div>
                    </div>

                    <div className="benefit-card-chart">
                      {/* Placeholder for trajectory chart - using simple line */}
                      <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`gradient-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={idx === 0 ? P.green : idx === 1 ? P.yellow : P.teal} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={idx === 0 ? P.green : idx === 1 ? P.yellow : P.teal} stopOpacity="0.05" />
                          </linearGradient>
                        </defs>
                        <path
                          d={idx === 0 ? "M0,60 Q50,40 100,30 T200,15" : idx === 1 ? "M0,65 Q50,50 100,35 T200,20" : "M0,70 Q50,55 100,45 T200,30"}
                          fill={`url(#gradient-${idx})`}
                          stroke={idx === 0 ? P.green : idx === 1 ? P.yellow : P.teal}
                          strokeWidth="2"
                        />
                        <text x="5" y="15" fontSize="10" fill={P.muted}>Cost vs. Benefit Trajectory (time)</text>
                      </svg>
                    </div>

                    <div className="benefit-card-footer">
                      <div className="benefit-card-roi">
                        <span className="benefit-card-roi-icon">📊</span>
                        <span className="benefit-card-roi-label" style={{ fontSize: '0.75rem', color: P.muted, marginRight: 4 }}>ROI:</span>
                        <span className="benefit-card-roi-value" style={{ color: P.accent }}>
                          {card.roi}
                        </span>
                      </div>
                      <a href="#" className="benefit-card-link">
                        Analyze →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="benefits-intervention-cards" style={{ marginTop: 16 }}>
                <div className="evaluate-card">
                  <div className="evaluate-card-icon">+</div>
                  <div className="evaluate-card-title">Evaluate New Strategy</div>
                  <div className="evaluate-card-text">
                    Simulate the economic impact of custom intervention combinations.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Per-intervention Breakdowns */}
          {tab === 2 && (
            <>
              <h3 style={{ marginBottom: 14, fontSize: '0.95rem' }}>
                How Each Treatment Drives Income — Full Breakdown
              </h3>

              <div className="chart-card">
                <Plot
                  data={INT_KEYS.map(name => {
                    const s    = stats[name];
                    const vals = metricsCompare.map(m => s[m]);
                    return {
                      type: 'scatterpolar',
                      r: [...vals, vals[0]],
                      theta: [...metricLabels, metricLabels[0]],
                      name: `${INT_ICONS[name]} ${name}`,
                      line: { color: INT_COLORS[name], width: 2 },
                      fill: 'toself', opacity: 0.20,
                      fillcolor: INT_COLORS[name],
                    };
                  })}
                  layout={pl({
                    height: 380,
                    polar: {
                      bgcolor: P.bg,
                      radialaxis: { visible: true, gridcolor: P.border, tickfont: { size: 8 } },
                      angularaxis: { gridcolor: P.border },
                    },
                    title: 'Treatment Performance Radar — All Economic & Environmental Metrics',
                  })}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%' }}
                  useResizeHandler
                />
              </div>

              <div className="chart-card" style={{ marginTop: 16 }}>
                <Plot
                  data={metricsCompare.map((mkey, mi) => ({
                    type: 'bar', name: metricLabels[mi],
                    x: INT_KEYS,
                    y: INT_KEYS.map(n => stats[n][mkey]),
                    marker: { color: metricColors[mi] },
                    text: INT_KEYS.map(n => `${stats[n][mkey].toFixed(1)}%`),
                    textposition: 'outside',
                    textfont: { family: 'JetBrains Mono, monospace', size: 8 },
                  }))}
                  layout={pl({
                    barmode: 'group', height: 380,
                    title: 'All Treatments — Economic & Environmental Impact Comparison (%)',
                    yaxis: { ...pl().yaxis, title: '% Change vs Baseline' },
                  })}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%' }}
                  useResizeHandler
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
