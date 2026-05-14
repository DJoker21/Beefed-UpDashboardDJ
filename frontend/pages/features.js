import { useState, useEffect } from 'react';
import { fetchModels } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, MODEL_COLORS, MODEL_ICONS, pl } from '../lib/theme';

function featureColor(feat) {
  const f = feat.toLowerCase();
  if (['temp','rain','humidity','heat','altitude','season','veld','state'].some(x => f.includes(x))) return P.yellow;
  if (['protein','tdn','intake','forage','mineral','energy','water'].some(x => f.includes(x)))       return P.orange;
  if (['age','weight','bcs','frame','parity','sex','health'].some(x => f.includes(x)))               return P.teal;
  if (['herd','grazing','housing','breeding','vaccination','deworming','record','adg','calving','weaning'].some(x => f.includes(x))) return P.purple;
  if (['intervention','moringa','tannin','genetic','solar','num_'].some(x => f.includes(x)))         return P.green;
  return P.accent;
}

const LEGEND = [
  ['🌡️ Environmental', P.yellow],
  ['🌿 Nutrition',     P.orange],
  ['🐄 Animal',        P.teal],
  ['🏗️ Management',   P.purple],
  ['💉 Interventions', P.green],
];

export default function FeaturesPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [selModel, setSelModel] = useState('Gradient Boosting');

  useEffect(() => {
    fetchModels()
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="error-box">⚠️ {error}</div>;
  if (!data)  return <div className="loading">Loading feature data…</div>;

  const { models } = data;
  const modelNames = Object.keys(models);

  const fi = models[selModel]?.feature_importance || {};
  const sorted = Object.entries(fi).sort((a, b) => a[1] - b[1]);
  const fiFeats  = sorted.map(([f]) => f);
  const fiVals   = sorted.map(([, v]) => v);
  const fiColors = fiFeats.map(featureColor);

  const top5 = [...sorted].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxFi = top5[0]?.[1] || 1;

  const rf = models['Random Forest']?.feature_importance || {};
  const gb = models['Gradient Boosting']?.feature_importance || {};
  const common = [...new Set([...Object.keys(rf), ...Object.keys(gb)])]
    .sort((a, b) => (rf[b] || 0) - (rf[a] || 0))
    .slice(0, 12);

  return (
    <>
      <div className="page-header">
        <h1>📊 Feature Importance</h1>
        <p>Driver analysis: which factors most strongly predict GHG footprint</p>
      </div>
      <hr className="page-divider" />

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'inline-block', marginRight: 10 }}>Select Model:</label>
        <select value={selModel} onChange={e => setSelModel(e.target.value)} style={{ width: 260 }}>
          {modelNames.map(n => <option key={n}>{n}</option>)}
        </select>
      </div>

      <div className="col-3-2">
        <div className="chart-card">
          <Plot
            data={[{
              type: 'bar', orientation: 'h',
              x: fiVals, y: fiFeats,
              marker: { color: fiColors, line: { color: P.border, width: 0.5 } },
              text: fiVals.map(v => v.toFixed(4)),
              textposition: 'outside',
              textfont: { size: 9, family: 'JetBrains Mono, monospace' },
            }]}
            layout={pl({
              height: 520,
              title: `${MODEL_ICONS[selModel]} Feature Importance — ${selModel}`,
              xaxis: { ...pl().xaxis, title: 'Importance Score' },
              yaxis: { ...pl().yaxis, tickfont: { size: 9 } },
            })}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </div>

        <div>
          <div className="chart-card">
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Feature Category Legend</h4>
            {LEGEND.map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${P.border}` }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, marginRight: 10, flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem' }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="chart-card" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Top 5 Drivers</h4>
            {top5.map(([feat, val]) => {
              const color = featureColor(feat);
              const pct   = (val / maxFi) * 100;
              return (
                <div key={feat} style={{ padding: '6px 0', borderBottom: `1px solid ${P.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace' }}>
                      {feat.replace('_enc', '').replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.82rem', color, fontWeight: 700 }}>{val.toFixed(5)}</span>
                  </div>
                  <div className="feat-bar-track">
                    <div className="feat-bar-fill" style={{ background: color, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cross-model comparison */}
      <hr />
      <h3 style={{ marginBottom: 14, fontSize: '0.95rem' }}>Cross-Model Feature Comparison (RF vs GB)</h3>
      <div className="chart-card">
        <Plot
          data={[
            { type: 'bar', name: '🌲 Random Forest', x: common,
              y: common.map(f => rf[f] || 0),
              marker: { color: MODEL_COLORS['Random Forest'], opacity: 0.85 } },
            { type: 'bar', name: '⚡ Gradient Boosting', x: common,
              y: common.map(f => gb[f] || 0),
              marker: { color: MODEL_COLORS['Gradient Boosting'], opacity: 0.85 } },
          ]}
          layout={pl({
            barmode: 'group', height: 360,
            xaxis: { ...pl().xaxis, tickangle: -25, tickfont: { size: 9 } },
            yaxis: { ...pl().yaxis, title: 'Importance' },
            title: 'Random Forest vs Gradient Boosting Feature Importance',
          })}
          config={{ displayModeBar: false }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </div>
    </>
  );
}
