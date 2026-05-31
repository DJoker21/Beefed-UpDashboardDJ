import { useState, useEffect } from 'react';
import { fetchFarmerBenefits } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, INT_COLORS, INT_ICONS, pl, hexToRgba } from '../lib/theme';

const INT_KEYS = ['Moringa', 'Tannin', 'Genetic', 'Solar'];
const TABS = ['🌍 Environmental Gains', '💵 Economic & Income Uplift', '📊 Per-Intervention Breakdown'];

export default function BenefitsPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab]     = useState(0);
  const [herdSize, setHerdSize] = useState(100);

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

  const ch4Range   = Array.from({ length: 120 }, (_, i) => (i / 119) * 30);
  const incomeLine = ch4Range.map(x => x * 0.30);

  const metricsCompare  = ['ghg_red_pct', 'ch4_red_pct', 'adg_inc_pct', 'ci_red_pct', 'total_income_pct'];
  const metricLabels    = ['CO₂ Footprint ↓%', 'CH₄ Methane ↓%', 'Daily Gain ↑%', 'Cost/kg Meat ↓%', 'Income Uplift %'];
  const metricColors    = [P.green, P.teal, P.accent, P.yellow, P.purple];

  return (
    <>
      <div className="page-header">
        <h1>💰 Farmer Benefits</h1>
        <p>Environmental & economic gains from Moringa · Tannin · Genetic Selection · Solar interventions</p>
      </div>
      <hr className="page-divider" />

      {/* KPIs */}
      <div className="metric-grid metric-grid-5">
        {[
          ['CO₂ Footprint Reduction', `${overall_ghg_red.toFixed(1)}%`, 'vs baseline (all animals)', P.green],
          ['Methane (CH₄) Reduction', `${overall_ch4_red.toFixed(1)}%`, 'kg CH₄/head/yr cut',        P.teal],
          ['Carbon Sequestration ↑',  `+${overall_seq_inc.toFixed(1)}%`, 'vs baseline land capture', P.accent],
          ['Meat Income Uplift',       '~6–9%',                          'CH₄-linked revenue gain',  P.yellow],
          ['Carbon Credit Income',     'R250+',                          'per tonne CO₂e reduced',   P.purple],
        ].map(([l, v, s, c]) => (
          <div key={l} className="metric-card">
            <div className="accent-bar" style={{ background: c }} />
            <div className="label">{l}</div>
            <div className="value" style={{ color: c }}>{v}</div>
            <div className="sub">{s}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="info-banner" style={{ background: `linear-gradient(135deg,${P.card},${P.bg})`, border: `1px solid ${P.green}40` }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: P.green, marginBottom: 8 }}>
          🌱 Why Methane Reduction Increases Farmer Income
        </div>
        <div style={{ fontSize: '0.83rem', color: P.text, lineHeight: 1.7 }}>
          When cattle produce less enteric methane, they convert feed energy more efficiently into body weight.
          Research shows that every <b style={{ color: P.yellow }}>20% reduction in CH₄ emissions</b> corresponds
          to approximately a <b style={{ color: P.yellow }}>6% increase in meat revenue</b> — through faster growth
          rates, lower feed costs per kg of gain, and access to premium low-carbon beef markets.
          On top of this, verified GHG reductions generate <b style={{ color: P.purple }}>carbon credits</b> that
          can be sold or offset against costs, and improved carbon sequestration strengthens the farm&apos;s long-term
          land productivity.
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={i} className={`tab-btn${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Environmental ── */}
      {tab === 0 && (
        <>
          <h3 style={{ marginBottom: 14, fontSize: '0.95rem' }}>CO₂ Footprint, Methane & Sequestration by Intervention</h3>
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

      {/* ── Tab 1: Economic ── */}
      {tab === 1 && (
        <>
          <h3 style={{ marginBottom: 14, fontSize: '0.95rem' }}>What Each Intervention Earns the Farmer</h3>
          <div className="metric-grid metric-grid-4">
            {INT_KEYS.map((name, i) => {
              const s     = stats[name];
              const color = INT_COLORS[name];
              const total = s.total_income_uplift;
              const pct   = s.total_income_pct;
              const newRev = base_revenue + total;
              const ch4E  = ch4Premiums[i];
              return (
                <div key={name} className="metric-card" style={{ borderLeft: `4px solid ${color}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{INT_ICONS[name]}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 10 }}>{name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>
                    R{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: P.muted, marginBottom: 8 }}>extra income /head/yr</div>
                  <div style={{ background: P.bg, borderRadius: 8, padding: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: '0.72rem', color: P.muted }}>Total Revenue with {name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', fontWeight: 700, color: P.green }}>
                      R{newRev.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>+{pct.toFixed(1)}% vs baseline</div>
                  </div>
                  {total > 0 && (
                    <div style={{ display: 'flex', gap: 3, height: 6, borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ background: P.yellow, width: `${(ch4E / total * 100).toFixed(0)}%` }} />
                      <div style={{ background: P.green,  width: `${(adgGains[i] / total * 100).toFixed(0)}%` }} />
                      <div style={{ background: P.purple, width: `${(carbonCredits[i] / total * 100).toFixed(0)}%` }} />
                    </div>
                  )}
                  <div style={{ fontSize: '0.68rem', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                    CH₄ · growth · carbon credits
                  </div>
                </div>
              );
            })}
          </div>

          <details style={{ margin: '12px 0' }}>
            <summary style={{ fontSize: '0.85rem', color: P.muted, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
              ⚙️ Economic Assumptions
            </summary>
            <div style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace', color: P.muted, lineHeight: 1.8, padding: '8px 0 0 12px' }}>
              • Slaughter weight: <b style={{ color: P.text }}>450 kg/head</b> · Beef price: <b style={{ color: P.text }}>R65/kg live weight</b><br />
              • Base revenue: <b style={{ color: P.yellow }}>R{base_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}/head/yr</b><br />
              • CH₄ premium: <b style={{ color: P.yellow }}>+6% revenue per 20% CH₄ reduction</b> (0.30% per 1% CH₄ cut)<br />
              • Carbon credits: <b style={{ color: P.purple }}>R250/tonne CO₂e</b> (voluntary SA carbon market)<br />
              • ADG gain: conservative 50% of theoretical extra weight value
            </div>
          </details>

          <div className="col-3-2">
            <div className="chart-card">
              <Plot
                data={[
                  { type: 'bar', name: 'CH₄ Meat Revenue Premium', x: INT_KEYS, y: ch4Premiums,
                    marker: { color: P.yellow },
                    text: ch4Premiums.map(v => `R${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`),
                    textposition: 'inside', textfont: { family: 'JetBrains Mono, monospace', size: 9, color: '#1a1a1a' } },
                  { type: 'bar', name: 'ADG Growth Gain', x: INT_KEYS, y: adgGains,
                    marker: { color: P.green },
                    text: adgGains.map(v => `R${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`),
                    textposition: 'inside', textfont: { family: 'JetBrains Mono, monospace', size: 9, color: 'white' } },
                  { type: 'bar', name: 'Carbon Credits (R250/t)', x: INT_KEYS, y: carbonCredits,
                    marker: { color: P.purple },
                    text: carbonCredits.map(v => `R${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`),
                    textposition: 'inside', textfont: { family: 'JetBrains Mono, monospace', size: 9, color: 'white' } },
                ]}
                layout={pl({
                  barmode: 'stack', height: 380,
                  title: 'Income Uplift per Intervention — Breakdown (R/head/yr)',
                  yaxis: { ...pl().yaxis, title: 'Additional Income (R/head/yr)' },
                  annotations: INT_KEYS.map((name, i) => ({
                    x: name, y: totals[i] + 80,
                    text: `<b>+R${totals[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>`,
                    showarrow: false,
                    font: { family: 'JetBrains Mono, monospace', size: 12, color: intColors[i] },
                    xanchor: 'center',
                  })),
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>

            <div className="chart-card">
              <Plot
                data={[
                  { type: 'scatter', mode: 'lines', x: ch4Range, y: incomeLine, name: 'Income Uplift %',
                    line: { color: P.yellow, width: 3 },
                    fill: 'tozeroy', fillcolor: hexToRgba(P.yellow, 0.10) },
                  ...INT_KEYS.map(name => ({
                    type: 'scatter', mode: 'markers+text',
                    x: [stats[name].ch4_red_pct],
                    y: [stats[name].ch4_premium_pct],
                    marker: { size: 14, color: INT_COLORS[name], line: { color: 'white', width: 2 } },
                    text: [`${INT_ICONS[name]} ${name}`],
                    textposition: 'top center',
                    textfont: { family: 'JetBrains Mono, monospace', size: 9, color: INT_COLORS[name] },
                    showlegend: false,
                  })),
                ]}
                layout={pl({
                  height: 380,
                  title: 'CH₄ Reduction → Meat Revenue Premium',
                  xaxis: { ...pl().xaxis, title: 'Methane Reduction (%)', range: [0, 32] },
                  yaxis: { ...pl().yaxis, title: 'Income Premium (%)' },
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>
          </div>

          {/* Herd calculator */}
          <hr />
          <h3 style={{ marginBottom: 12, fontSize: '0.95rem' }}>Herd-Scale Revenue Calculator</h3>
          <div style={{ marginBottom: 12 }}>
            <label>Herd size: <span className="range-value">{herdSize} head</span></label>
            <input type="range" min={50} max={2000} step={50} value={herdSize}
              onChange={e => setHerdSize(Number(e.target.value))} style={{ width: 300 }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Intervention</th>
                  <th>Revenue /head</th>
                  <th>Extra /head</th>
                  <th>Total herd ({herdSize} head)</th>
                  <th>Extra herd income</th>
                  <th>Income Uplift %</th>
                  <th>CH₄ Cut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Baseline (none)</td>
                  <td>R{base_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>—</td>
                  <td>R{(base_revenue * herdSize).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>—</td>
                  <td>Baseline</td>
                  <td>—</td>
                </tr>
                {INT_KEYS.map((name, i) => {
                  const s      = stats[name];
                  const newRev = base_revenue + s.total_income_uplift;
                  return (
                    <tr key={name}>
                      <td style={{ color: INT_COLORS[name] }}>{INT_ICONS[name]} {name}</td>
                      <td>R{newRev.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td style={{ color: P.green }}>+R{s.total_income_uplift.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td>R{(newRev * herdSize).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td style={{ color: P.green }}>+R{(s.total_income_uplift * herdSize).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td style={{ color: P.yellow }}>+{s.total_income_pct.toFixed(1)}%</td>
                      <td style={{ color: P.teal }}>↓{s.ch4_red_pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Tab 2: Per-Intervention Breakdown ── */}
      {tab === 2 && (
        <>
          <h3 style={{ marginBottom: 14, fontSize: '0.95rem' }}>How Each Treatment Drives Income — Full Breakdown</h3>

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

          <hr />

          {INT_KEYS.map(name => {
            const s          = stats[name];
            const color      = INT_COLORS[name];
            const icon       = INT_ICONS[name];
            const total      = s.total_income_uplift;
            const newRev     = base_revenue + total;
            const ch4Earn    = (s.ch4_premium_pct / 100) * base_revenue;
            return (
              <div key={name} style={{
                background: `linear-gradient(135deg,${P.card},${P.bg})`,
                border: `1px solid ${color}`, borderRadius: 14,
                padding: '20px 24px', marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{icon} {name}</div>
                    <div style={{ fontSize: '0.8rem', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                      Baseline revenue R{base_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} →{' '}
                      <span style={{ color: P.green }}>R{newRev.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> /head/yr
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>
                      +R{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: '0.82rem', color }}>+{s.total_income_pct.toFixed(1)}% income uplift /head/yr</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    {
                      border: P.yellow, title: 'CH₄ Reduction → Meat Premium',
                      lines: [
                        { color: P.teal,   text: `↓ ${s.ch4_red_pct.toFixed(1)}% CH₄` },
                        { color: P.muted,  text: `${s.bl_ch4.toFixed(1)} → ${s.in_ch4.toFixed(1)} kg CH₄/head/yr`, small: true },
                        { color: P.yellow, text: `+R${ch4Earn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, large: true },
                        { color: P.muted,  text: `+${s.ch4_premium_pct.toFixed(1)}% meat revenue premium`, small: true },
                      ],
                    },
                    {
                      border: P.green, title: 'Faster Growth (ADG)',
                      lines: [
                        { color: P.green,  text: `+${s.adg_inc_pct.toFixed(1)}% ADG` },
                        { color: P.muted,  text: `${s.bl_adg.toFixed(3)} → ${s.in_adg.toFixed(3)} kg/day`, small: true },
                        { color: P.green,  text: `+R${s.adg_income_gain.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, large: true },
                        { color: P.muted,  text: `CO₂ footprint ↓ ${s.ghg_red_pct.toFixed(1)}% · CI ↓ ${s.ci_red_pct.toFixed(1)}%`, small: true },
                      ],
                    },
                    {
                      border: P.purple, title: 'Carbon Credits + Sequestration',
                      lines: [
                        { color: P.accent, text: `+${s.seq_inc_pct.toFixed(1)}% seq.` },
                        { color: P.muted,  text: `${s.bl_seq.toLocaleString(undefined, { maximumFractionDigits: 0 })} → ${s.in_seq.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO₂/head/yr`, small: true },
                        { color: P.purple, text: `+R${s.carbon_credit_rpa.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, large: true },
                        { color: P.muted,  text: '@ R250/tonne CO₂e carbon credit', small: true },
                      ],
                    },
                  ].map(({ border, title, lines }) => (
                    <div key={title} style={{ background: P.bg, borderRadius: 10, padding: 14, borderLeft: `3px solid ${border}` }}>
                      <div className="label">{title}</div>
                      {lines.map(({ color: c, text, large, small }) => (
                        <div key={text} style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: large ? '1.2rem' : small ? '0.75rem' : '1rem',
                          fontWeight: large ? 700 : 400,
                          color: c, margin: '3px 0',
                        }}>{text}</div>
                      ))}
                    </div>
                  ))}
                </div>

                {total > 0 && (
                  <>
                    <div style={{ display: 'flex', gap: 4, height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ background: P.yellow, width: `${(ch4Earn / total * 100).toFixed(0)}%` }} />
                      <div style={{ background: P.green,  width: `${(s.adg_income_gain / total * 100).toFixed(0)}%` }} />
                      <div style={{ background: P.purple, width: `${(s.carbon_credit_rpa / total * 100).toFixed(0)}%` }} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>
                      <span style={{ color: P.yellow }}>■ CH₄ meat premium ({(ch4Earn / total * 100).toFixed(0)}%)</span>
                      <span style={{ color: P.green  }}>■ ADG growth ({(s.adg_income_gain / total * 100).toFixed(0)}%)</span>
                      <span style={{ color: P.purple }}>■ Carbon credits ({(s.carbon_credit_rpa / total * 100).toFixed(0)}%)</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
