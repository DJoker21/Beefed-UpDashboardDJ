import { useState, useEffect } from 'react';
import { fetchModels } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, MODEL_COLORS, MODEL_ICONS, pl, hexToRgba } from '../lib/theme';

const TABS = ['📊 Metrics Table', '📈 Model Comparison', '🎯 Actual vs Predicted', '🔀 Confusion Matrix'];

export default function ModelsPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab]     = useState(0);
  const [selModel, setSelModel]   = useState('Gradient Boosting');
  const [selCM,    setSelCM]      = useState('Gradient Boosting');

  useEffect(() => {
    fetchModels()
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="error-box">⚠️ {error}</div>;
  if (!data)  return <div className="loading">Loading model metrics…</div>;

  const { models, class_labels } = data;
  const modelNames = Object.keys(models);

  return (
    <>
      <div className="page-header">
        <h1>🤖 ML Model Metrics</h1>
        <p>Regression (GHG prediction) · Classification (Low/Medium/High GHG class) · 80/20 train-test split</p>
      </div>
      <hr className="page-divider" />

      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={i} className={`tab-btn${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Metrics Table ── */}
      {tab === 0 && (
        <>
          <h3 style={{ marginBottom: 10, fontSize: '0.95rem' }}>Regression Metrics (Target: Net GHG kg CO₂e/head/yr)</h3>
          <div className="chart-card" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Model</th><th>Type</th><th>R²</th><th>RMSE</th><th>MAE</th><th>CV R² (5-fold)</th><th>Architecture</th>
                </tr>
              </thead>
              <tbody>
                {modelNames.map(name => {
                  const m = models[name];
                  const color = MODEL_COLORS[name];
                  return (
                    <tr key={name}>
                      <td style={{ color, fontWeight: 600 }}>{MODEL_ICONS[name]} {name}</td>
                      <td>{(m.type || '').replace('_', ' ')}</td>
                      <td style={{ color: P.accent }}>{m.reg_r2.toFixed(4)}</td>
                      <td>{m.reg_rmse.toFixed(2)}</td>
                      <td>{m.reg_mae.toFixed(2)}</td>
                      <td>{m.cv_r2_mean.toFixed(4)} ± {m.cv_r2_std.toFixed(4)}</td>
                      <td style={{ fontSize: '0.72rem', maxWidth: 200 }}>{(m.architecture || '—').slice(0, 60)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 style={{ margin: '20px 0 10px', fontSize: '0.95rem' }}>Classification Metrics (Target: Low / Medium / High GHG class)</h3>
          <div className="chart-card" style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Model</th><th>Accuracy</th><th>F1 (weighted)</th></tr></thead>
              <tbody>
                {modelNames.map(name => {
                  const m = models[name];
                  const color = MODEL_COLORS[name];
                  return (
                    <tr key={name}>
                      <td style={{ color, fontWeight: 600 }}>{MODEL_ICONS[name]} {name}</td>
                      <td style={{ color: P.green }}>{m.cls_accuracy.toFixed(4)}</td>
                      <td style={{ color: P.teal  }}>{m.cls_f1.toFixed(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Tab 1: Model Comparison ── */}
      {tab === 1 && (
        <>
          <div className="col-2">
            <div className="chart-card">
              <Plot
                data={[
                  {
                    type: 'bar', name: 'R²',
                    x: modelNames,
                    y: modelNames.map(n => models[n].reg_r2),
                    marker: { color: modelNames.map(n => MODEL_COLORS[n]) },
                    text: modelNames.map(n => models[n].reg_r2.toFixed(4)),
                    textposition: 'outside', textfont: { size: 9 },
                    xaxis: 'x', yaxis: 'y',
                  },
                  {
                    type: 'bar', name: 'RMSE',
                    x: modelNames,
                    y: modelNames.map(n => models[n].reg_rmse),
                    marker: { color: modelNames.map(n => MODEL_COLORS[n]), opacity: 0.75 },
                    text: modelNames.map(n => models[n].reg_rmse.toFixed(0)),
                    textposition: 'outside', textfont: { size: 9 },
                    xaxis: 'x2', yaxis: 'y2',
                  },
                ]}
                layout={pl({
                  height: 400, showlegend: false,
                  grid: { rows: 1, columns: 2, pattern: 'independent' },
                  xaxis:  { tickangle: -30, tickfont: { size: 9 }, gridcolor: P.border },
                  xaxis2: { tickangle: -30, tickfont: { size: 9 }, gridcolor: P.border },
                  yaxis:  { gridcolor: P.border, title: 'R²' },
                  yaxis2: { gridcolor: P.border, title: 'RMSE' },
                  annotations: [
                    { text: 'R² Score', x: 0.225, xref: 'paper', y: 1.06, yref: 'paper', showarrow: false, font: { size: 12, color: P.text } },
                    { text: 'RMSE (kg CO₂e)', x: 0.775, xref: 'paper', y: 1.06, yref: 'paper', showarrow: false, font: { size: 12, color: P.text } },
                  ],
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>

            {/* Radar */}
            <div className="chart-card">
              <Plot
                data={modelNames.map(name => {
                  const m = models[name];
                  const maxRmse = Math.max(...modelNames.map(n => models[n].reg_rmse));
                  const vals = [
                    m.reg_r2,
                    1 - m.reg_rmse / maxRmse,
                    m.cls_accuracy,
                    m.cls_f1,
                    m.cv_r2_mean,
                  ];
                  const cats = ['R²', '1/RMSE_norm', 'Acc', 'F1', 'CV R²'];
                  return {
                    type: 'scatterpolar',
                    r: [...vals, vals[0]],
                    theta: [...cats, cats[0]],
                    name: `${MODEL_ICONS[name]} ${name.split(' ')[0]}`,
                    line: { color: MODEL_COLORS[name], width: 2 },
                    fill: 'toself', opacity: 0.25,
                    fillcolor: MODEL_COLORS[name],
                  };
                })}
                layout={pl({
                  height: 400,
                  polar: {
                    bgcolor: P.bg,
                    radialaxis: { visible: true, range: [0, 1], gridcolor: P.border, tickfont: { size: 8 } },
                    angularaxis: { gridcolor: P.border },
                  },
                  title: { text: 'Model Performance Radar', font: { size: 13 } },
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>
          </div>

          {/* CV strip */}
          <div className="chart-card">
            <h3 style={{ fontSize: '0.9rem', marginBottom: 10 }}>5-Fold Cross-Validation R² Scores</h3>
            <Plot
              data={modelNames.map(name => ({
                type: 'box',
                y: models[name].cv_r2_scores,
                name: name.split(' ')[0],
                marker: { color: MODEL_COLORS[name] },
                boxpoints: 'all', jitter: 0.3, pointpos: 0,
              }))}
              layout={pl({ height: 320, showlegend: false, yaxis: { ...pl().yaxis, range: [0, 1.05], title: 'R²' } })}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        </>
      )}

      {/* ── Tab 2: Actual vs Predicted ── */}
      {tab === 2 && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'inline-block', marginRight: 10 }}>Select Model:</label>
            <select value={selModel} onChange={e => setSelModel(e.target.value)} style={{ width: 260 }}>
              {modelNames.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>

          {(() => {
            const m = models[selModel];
            const yTest = m.y_test;
            const yPred = m.y_pred;
            const residuals = yPred.map((p, i) => p - yTest[i]);
            const minV = Math.min(...yTest);
            const maxV = Math.max(...yTest);
            const color = MODEL_COLORS[selModel];
            return (
              <div className="col-3-2">
                <div className="chart-card">
                  <Plot
                    data={[
                      { type: 'scatter', mode: 'markers', x: yTest, y: yPred, name: 'Predictions',
                        marker: { color, size: 5, opacity: 0.6, line: { color: P.border, width: 0.3 } },
                        hovertemplate: 'Actual: %{x:.0f}<br>Predicted: %{y:.0f}<extra></extra>' },
                      { type: 'scatter', mode: 'lines', x: [minV, maxV], y: [minV, maxV],
                        line: { color: P.red, dash: 'dash', width: 2 }, name: 'Perfect Fit' },
                    ]}
                    layout={pl({
                      height: 420,
                      title: `${MODEL_ICONS[selModel]} ${selModel} — Actual vs Predicted`,
                      xaxis: { ...pl().xaxis, title: 'Actual GHG (kg CO₂e/head/yr)' },
                      yaxis: { ...pl().yaxis, title: 'Predicted GHG (kg CO₂e/head/yr)' },
                    })}
                    config={{ displayModeBar: false }}
                    style={{ width: '100%' }}
                    useResizeHandler
                  />
                </div>

                <div>
                  <div className="chart-card">
                    <Plot
                      data={[{ type: 'histogram', x: residuals, nbinsx: 30,
                        marker: { color }, opacity: 0.8, name: 'Residuals' }]}
                      layout={pl({
                        height: 220,
                        title: 'Residual Distribution',
                        xaxis: { ...pl().xaxis, title: 'Residual' },
                        yaxis: { ...pl().yaxis, title: 'Count' },
                        shapes: [{ type: 'line', x0: 0, x1: 0, y0: 0, y1: 1, yref: 'paper',
                          line: { color: P.red, dash: 'dash' } }],
                      })}
                      config={{ displayModeBar: false }}
                      style={{ width: '100%' }}
                      useResizeHandler
                    />
                  </div>

                  <div className="metric-grid metric-grid-3" style={{ marginTop: 10 }}>
                    {[['R²', m.reg_r2.toFixed(4), P.accent],
                      ['RMSE', m.reg_rmse.toFixed(1), P.yellow],
                      ['MAE',  m.reg_mae.toFixed(1),  P.teal]].map(([l, v, c]) => (
                      <div key={l} className="metric-card">
                        <div className="label">{l}</div>
                        <div className="value" style={{ color: c, fontSize: '1.2rem' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="metric-card" style={{ marginTop: 10 }}>
                    <div className="label">Architecture</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color, lineHeight: 1.5 }}>
                      {m.architecture || '—'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ── Tab 3: Confusion Matrix ── */}
      {tab === 3 && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'inline-block', marginRight: 10 }}>Select Model:</label>
            <select value={selCM} onChange={e => setSelCM(e.target.value)} style={{ width: 260 }}>
              {modelNames.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>

          {(() => {
            const m = models[selCM];
            const cm = m.confusion_matrix;
            const n = cm.length;
            const rowSums = cm.map(row => row.reduce((a, b) => a + b, 0));
            const cmNorm  = cm.map((row, i) => row.map(v => v / (rowSums[i] || 1)));
            const color   = MODEL_COLORS[selCM];

            const annotations = cm.flatMap((row, i) =>
              row.map((v, j) => ({
                x: j, y: i,
                text: `<b>${v}</b><br>${(cmNorm[i][j] * 100).toFixed(1)}%`,
                showarrow: false,
                font: { color: 'white', size: 12, family: 'JetBrains Mono, monospace' },
              }))
            );

            return (
              <>
                <div className="chart-card" style={{ maxWidth: 560 }}>
                  <Plot
                    data={[{
                      type: 'heatmap',
                      z: cmNorm,
                      x: class_labels.map(l => `Pred: ${l}`),
                      y: class_labels.map(l => `True: ${l}`),
                      colorscale: [[0, P.bg], [0.5, color + '80'], [1, color]],
                      showscale: true,
                    }]}
                    layout={pl({
                      height: 400,
                      title: `${MODEL_ICONS[selCM]} Confusion Matrix — ${selCM}`,
                      annotations,
                    })}
                    config={{ displayModeBar: false }}
                    style={{ width: '100%' }}
                    useResizeHandler
                  />
                </div>

                <div className="metric-grid metric-grid-2" style={{ maxWidth: 360, marginTop: 12 }}>
                  <div className="metric-card">
                    <div className="label">Classification Accuracy</div>
                    <div className="value" style={{ color: P.green }}>{m.cls_accuracy.toFixed(4)}</div>
                  </div>
                  <div className="metric-card">
                    <div className="label">F1 Score (Weighted)</div>
                    <div className="value" style={{ color: P.teal }}>{m.cls_f1.toFixed(4)}</div>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </>
  );
}
