import { useState, useEffect, useCallback } from 'react';
import { fetchDataset } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, INT_COLORS, INT_ICONS, pl } from '../lib/theme';

const ALL_STATES = ['Limpopo', 'North West', 'Free State'];
const ALL_SEXES  = ['Cow', 'Bull', 'Heifer', 'Steer'];
const INT_FILTERS = ['All', 'Any Intervention', 'No Intervention', 'Moringa', 'Tannin', 'Genetic Selection', 'Solar'];

const COLOR_MAP = {
  Limpopo: P.accent, 'North West': P.green, 'Free State': P.yellow,
  Bull: P.orange, Cow: P.teal, Heifer: P.purple, Steer: P.red,
};

const INT_PARAM_MAP = {
  'All': '', 'Any Intervention': 'any', 'No Intervention': 'none',
  'Moringa': 'moringa', 'Tannin': 'tannin', 'Genetic Selection': 'genetic', 'Solar': 'solar',
};

export default function ExplorerPage() {
  const [data, setData]         = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  // Filters
  const [selStates, setSelStates]   = useState(ALL_STATES);
  const [selSexes,  setSelSexes]    = useState(ALL_SEXES);
  const [selInt,    setSelInt]      = useState('All');
  const [xAxis,     setXAxis]       = useState('Current_Weight_kg');
  const [yAxis,     setYAxis]       = useState('GHG_Net_CO2e_kg');
  const [colorBy,   setColorBy]     = useState('State');

  const load = useCallback(() => {
    setLoading(true);
    fetchDataset({
      state:        selStates.join(','),
      sex:          selSexes.join(','),
      intervention: INT_PARAM_MAP[selInt] || '',
      limit:        100,
    })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selStates, selSexes, selInt]);

  useEffect(() => { load(); }, [load]);

  const toggleState = s => setSelStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleSex   = s => setSelSexes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  if (error) return <div className="error-box">⚠️ {error}</div>;

  const xOptions = data?.scatter_x_options || [];
  const yOptions = data?.scatter_y_options || [];
  const scatterX = data?.scatter_data?.[xAxis] || [];
  const scatterY = data?.scatter_data?.[yAxis] || [];
  const scatterC = data?.scatter_data?.[colorBy] || [];

  // Group by color category
  const categoryGroups = {};
  scatterC.forEach((cat, i) => {
    if (!categoryGroups[cat]) categoryGroups[cat] = { x: [], y: [] };
    categoryGroups[cat].x.push(scatterX[i]);
    categoryGroups[cat].y.push(scatterY[i]);
  });

  return (
    <>
      <div className="page-header">
        <h1>🗃️ Dataset Explorer</h1>
        <p>Explore the 1,000-animal Bonsmara synthetic dataset</p>
      </div>
      <hr className="page-divider" />

      {/* Filters */}
      <div className="col-3-2" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Filter by State</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ALL_STATES.map(s => (
                  <button key={s} onClick={() => toggleState(s)} style={{
                    background: selStates.includes(s) ? P.accent + '22' : P.bg,
                    border: `1px solid ${selStates.includes(s) ? P.accent : P.border}`,
                    borderRadius: 6, padding: '4px 10px', color: selStates.includes(s) ? P.accent : P.muted,
                    cursor: 'pointer', fontSize: '0.82rem',
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="label" style={{ marginBottom: 6 }}>Filter by Sex</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ALL_SEXES.map(s => (
                  <button key={s} onClick={() => toggleSex(s)} style={{
                    background: selSexes.includes(s) ? P.accent + '22' : P.bg,
                    border: `1px solid ${selSexes.includes(s) ? P.accent : P.border}`,
                    borderRadius: 6, padding: '4px 10px', color: selSexes.includes(s) ? P.accent : P.muted,
                    cursor: 'pointer', fontSize: '0.82rem',
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label>Intervention Filter</label>
              <select value={selInt} onChange={e => setSelInt(e.target.value)} style={{ marginTop: 4 }}>
                {INT_FILTERS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && <div style={{ color: P.muted, fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
        Loading…
      </div>}

      {data && (
        <>
          <p style={{ color: P.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', marginBottom: 14 }}>
            <b style={{ color: P.text }}>{data.n_filtered.toLocaleString()}</b> animals matching filters
          </p>

          {/* Summary KPIs */}
          <div className="metric-grid metric-grid-4" style={{ marginBottom: 20 }}>
            {[
              ['Mean Net GHG (Baseline)', data.summary?.Baseline_Net_GHG_CO2e_kg?.mean, P.orange],
              ['Mean Net GHG (With Int.)', data.summary?.Int_Net_GHG_CO2e_kg?.mean,     P.green],
              ['Mean CH₄',               data.summary?.Total_CH4_kg?.mean,              P.yellow],
              ['Mean Carbon Seq.',        data.summary?.Baseline_Carbon_Seq_kg?.mean,    P.teal],
            ].map(([l, v, c]) => (
              <div key={l} className="metric-card">
                <div className="accent-bar" style={{ background: c }} />
                <div className="label">{l}</div>
                <div className="value" style={{ color: c, fontSize: '1.2rem' }}>
                  {v != null ? `${v.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg` : '—'}
                </div>
              </div>
            ))}
          </div>

          <div className="col-2">
            {/* Scatter */}
            <div>
              <div className="chart-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label>X axis</label>
                    <select value={xAxis} onChange={e => setXAxis(e.target.value)}>
                      {xOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Y axis</label>
                    <select value={yAxis} onChange={e => setYAxis(e.target.value)}>
                      {yOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Color by</label>
                    <select value={colorBy} onChange={e => setColorBy(e.target.value)}>
                      {['State', 'Sex', 'Housing_Type', 'Grazing_System', 'Forage_Type', 'Veld_Condition'].map(o => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Plot
                  data={Object.entries(categoryGroups).map(([cat, pts]) => ({
                    type: 'scatter', mode: 'markers', name: cat,
                    x: pts.x, y: pts.y,
                    marker: { size: 5, opacity: 0.65, color: COLOR_MAP[cat] || P.accent },
                  }))}
                  layout={pl({
                    height: 380,
                    xaxis: { ...pl().xaxis, title: xAxis.replace(/_/g, ' ') },
                    yaxis: { ...pl().yaxis, title: yAxis.replace(/_/g, ' ') },
                  })}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%' }}
                  useResizeHandler
                />
              </div>
            </div>

            {/* Stats + adoption */}
            <div>
              <div className="chart-card" style={{ marginBottom: 12 }}>
                <h4 style={{ marginBottom: 10, fontSize: '0.9rem' }}>Summary Statistics</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Stat</th>
                        {Object.keys(data.summary || {}).map(k => (
                          <th key={k} style={{ maxWidth: 90, fontSize: '0.7rem' }}>
                            {k.replace('Baseline_', 'BL_').replace('_Net_GHG_CO2e_kg', '_NetGHG').replace('_CO2e_kg', '')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['mean', 'std', 'min', 'max'].map(stat => (
                        <tr key={stat}>
                          <td style={{ color: P.muted }}>{stat}</td>
                          {Object.values(data.summary || {}).map((s, i) => (
                            <td key={i}>{s[stat]?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="chart-card">
                <h4 style={{ marginBottom: 10, fontSize: '0.9rem' }}>Intervention Adoption (Filtered)</h4>
                {Object.entries(data.adoption || {}).map(([label, info]) => (
                  <div key={label} className="adoption-row">
                    <span style={{ fontSize: '0.85rem' }}>{INT_ICONS[label]} {label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="adoption-bar-track">
                        <div className="adoption-bar-fill" style={{ background: INT_COLORS[label], width: `${info.pct}%` }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: INT_COLORS[label] }}>
                        {info.count} ({info.pct}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Raw table */}
          <h4 style={{ margin: '20px 0 10px', fontSize: '0.9rem' }}>Raw Data (first 100 rows)</h4>
          <div className="chart-card" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {data.records.length > 0 && Object.keys(data.records[0]).map(k => (
                    <th key={k} style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.records.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {v != null ? String(v) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
