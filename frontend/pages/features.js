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

function featureReducesGHG(feat) {
  const f = feat.toLowerCase();
  // Features that typically reduce GHG (green)
  return ['feed_efficiency','fcr','genetic','sequestration','quality','moringa','tannin','solar'].some(x => f.includes(x));
}

const DATA_CATEGORIES = [
  { name: 'Nutritional', icon: '🍽️', count: 3, class: 'nutritional' },
  { name: 'Physiological', icon: '💪', count: 2, class: 'physiological' },
  { name: 'Genetic', icon: '🧬', count: 1, class: 'genetic' },
  { name: 'Environmental', icon: '🌡️', count: 1, class: 'environmental' },
];

export default function FeaturesPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);
  const [selModel, setSelModel] = useState('Random Forest');

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
  const sorted = Object.entries(fi).sort((a, b) => b[1] - a[1]); // Sort descending for importance
  const fiFeats  = sorted.map(([f]) => f);
  const fiVals   = sorted.map(([, v]) => v * 100); // Convert to percentage
  const fiColors = fiFeats.map(f => featureReducesGHG(f) ? P.green : P.yellow);

  const top5 = sorted.slice(0, 5);

  // For model comparison
  const rf = models['Random Forest']?.feature_importance || {};
  const gb = models['Gradient Boosting']?.feature_importance || {};
  const common = [...new Set([...Object.keys(rf), ...Object.keys(gb)])]
    .sort((a, b) => (rf[b] || 0) - (rf[a] || 0))
    .slice(0, 6);

  return (
    <>
      {/* Header */}
      <div className="features-header">
        <h1>Feature Importance</h1>
        <p>Understand which variables drive GHG predictions in your models.</p>
      </div>

      {/* Top Bar */}
      <div className="features-top-bar">
        <div className="model-selector">
          <span className="model-selector-label">Active ML Model:</span>
          <select
            className="model-selector-dropdown"
            value={selModel}
            onChange={e => setSelModel(e.target.value)}
          >
            {modelNames.map(n => (
              <option key={n} value={n}>
                {MODEL_ICONS[n]} {n} (v2.4)
              </option>
            ))}
          </select>
        </div>
        <div className="weights-info">
          <span className="weights-info-icon">ℹ️</span>
          <span>Weights indicate relative predictive power (sum = 100%)</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="features-layout">
        {/* Left: Large Feature Importance Chart */}
        <div className="features-main-chart">
          <div className="features-chart-header">
            <div className="features-chart-title">Global Feature Importance</div>
            <div className="features-chart-subtitle">
              Net lead impact of input variables on Net GHG predictions
            </div>
            <div className="features-legend">
              <div className="legend-item">
                <div className="legend-dot reduces"></div>
                <span>Reduces GHG</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot increases"></div>
                <span>Increases GHG</span>
              </div>
            </div>
          </div>
          <Plot
            data={[{
              type: 'bar',
              orientation: 'h',
              x: fiVals.slice(0, 8), // Show top 8 features
              y: fiFeats.slice(0, 8).map(f => f.replace(/_/g, ' ').replace(' enc', '')),
              marker: { color: fiColors.slice(0, 8) },
              text: fiVals.slice(0, 8).map(v => `${v.toFixed(1)}%`),
              textposition: 'outside',
              textfont: { size: 10, family: 'JetBrains Mono, monospace' },
            }]}
            layout={pl({
              height: 400,
              margin: { l: 180, r: 60, t: 20, b: 60 },
              xaxis: {
                ...pl().xaxis,
                title: '',
                tickformat: '.0f',
                ticksuffix: '%',
              },
              yaxis: {
                ...pl().yaxis,
                autorange: 'reversed',
              },
              showlegend: false,
            })}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </div>

        {/* Right: Sidebar with Categories and Top Drivers */}
        <div className="features-sidebar">
          {/* Data Categories */}
          <div className="data-categories-card">
            <div className="data-categories-title">Data Categories</div>
            {DATA_CATEGORIES.map((cat) => (
              <div key={cat.name} className="category-item">
                <div className="category-left">
                  <div className={`category-icon ${cat.class}`}>
                    {cat.icon}
                  </div>
                  <div className="category-name">{cat.name}</div>
                </div>
                <div className="category-count">{cat.count} Features</div>
              </div>
            ))}
          </div>

          {/* Top 5 Prediction Drivers */}
          <div className="top-drivers-card">
            <div className="top-drivers-header">
              <div className="top-drivers-title">Top 5 Prediction Drivers</div>
              <div className="top-drivers-subtitle">Most influential variables overall</div>
            </div>
            {top5.map(([feat, val], idx) => {
              const reduces = featureReducesGHG(feat);
              const pct = (val * 100).toFixed(1);
              return (
                <div key={feat} className="driver-item">
                  <div className="driver-rank">{idx + 1}.</div>
                  <div className="driver-name">
                    {feat.replace(/_/g, ' ').replace(' enc', '').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="driver-value">
                    <span className={`driver-arrow ${reduces ? 'reduces' : 'increases'}`}>
                      {reduces ? '↓' : '↑'}
                    </span>
                    <span style={{ color: reduces ? P.green : P.yellow }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Model Comparison Section */}
      <div className="model-comparison-section">
        <div className="comparison-header">
          <div className="comparison-title">Architecture Consistency Comparison</div>
          <div className="comparison-subtitle">
            How feature weights vary between Random Forest and Gradient Boosting models
          </div>
        </div>
        <Plot
          data={[
            {
              type: 'bar',
              name: 'Random Forest',
              x: common.map(f => f.replace(/_/g, ' ').replace(' enc', '')),
              y: common.map(f => (rf[f] || 0) * 100),
              marker: { color: P.green },
            },
            {
              type: 'bar',
              name: 'Gradient Boosting',
              x: common.map(f => f.replace(/_/g, ' ').replace(' enc', '')),
              y: common.map(f => (gb[f] || 0) * 100),
              marker: { color: P.accent },
            },
          ]}
          layout={pl({
            barmode: 'group',
            height: 340,
            margin: { l: 50, r: 20, t: 20, b: 80 },
            xaxis: {
              ...pl().xaxis,
              tickangle: -20,
              tickfont: { size: 10 },
            },
            yaxis: {
              ...pl().yaxis,
              title: '',
              tickformat: '.0f',
              ticksuffix: '%',
            },
            legend: {
              orientation: 'h',
              y: 1.12,
              x: 0.5,
              xanchor: 'center',
            },
          })}
          config={{ displayModeBar: false }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </div>
    </>
  );
}
