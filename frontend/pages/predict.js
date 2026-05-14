import { useState, useEffect, useCallback } from 'react';
import { postPredict } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, INT_COLORS, INT_ICONS, pl } from '../lib/theme';

const DEFAULTS = {
  weight: 350, adg: 0.85, bcs: 3.5, age: 36,
  cp: 11.0, tdn: 61, dmi: 8.0,
  temp: 25, rain: 500, humid: 55,
  housing: 'Extensive', grazing: 'Rotational', veld: 'Fair',
  moringa: false, tannin: false, genetic: false, solar: false,
};

function Slider({ label, name, min, max, step = 1, value, onChange, unit = '' }) {
  return (
    <div>
      <label>{label}: <span className="range-value">{value}{unit}</span></label>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(name, parseFloat(e.target.value))}
      />
    </div>
  );
}

function Select({ label, name, options, value, onChange }) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={e => onChange(name, e.target.value)}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function PredictPage() {
  const [params, setParams] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (name, value) => setParams(p => ({ ...p, [name]: value }));
  const toggleInt = (name) => setParams(p => ({ ...p, [name]: !p[name] }));

  // Auto-predict on param change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      postPredict(params)
        .then(setResult)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [params]);

  const ghgClassColor = result
    ? result.ghg_class === 'LOW' ? P.green : result.ghg_class === 'MEDIUM' ? P.yellow : P.orange
    : P.accent;

  const ghgClassIcon = result
    ? result.ghg_class === 'LOW' ? '🟢' : result.ghg_class === 'MEDIUM' ? '🟡' : '🔴'
    : '';

  const breakdown = result?.breakdown || {};
  const wCats     = ['Baseline', ...Object.keys(breakdown), 'Final'];
  const wVals     = [result?.prediction_no_int || 0, ...Object.values(breakdown), result?.prediction_ghg || 0];
  const wMeasures = ['absolute', ...Array(Object.keys(breakdown).length).fill('relative'), 'total'];

  const gaugeMax = 6000;
  const meanBase = result?.mean_baseline_ghg || 2926;

  return (
    <>
      <div className="page-header">
        <h1>🔮 Predict GHG Footprint</h1>
        <p>Configure animal, nutrition, environment and intervention parameters to predict net GHG</p>
      </div>
      <hr className="page-divider" />

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24 }}>
        {/* ── Left panel: inputs ── */}
        <div>
          <div className="form-section-title">🐄 Animal Parameters</div>
          <div className="input-group">
            <Select label="Sex" name="sex" options={['Cow', 'Bull', 'Heifer', 'Steer']} value={params.sex || 'Cow'} onChange={update} />
            <Slider label="Age" name="age" min={6} max={120} value={params.age} onChange={update} unit=" mo" />
          </div>
          <div className="input-group">
            <Slider label="Live Weight" name="weight" min={150} max={600} value={params.weight} onChange={update} unit=" kg" />
            <Slider label="Avg Daily Gain" name="adg" min={0.3} max={1.4} step={0.01} value={params.adg} onChange={update} unit=" kg/d" />
          </div>
          <div className="input-group">
            <Slider label="Body Condition Score" name="bcs" min={1.0} max={5.0} step={0.5} value={params.bcs} onChange={update} />
            <Select label="State" name="state" options={['Limpopo', 'North West', 'Free State']} value={params.state || 'Limpopo'} onChange={update} />
          </div>

          <div className="form-section-title" style={{ marginTop: 20 }}>🌿 Nutrition</div>
          <div className="input-group">
            <Select label="Forage Type" name="forage" options={['Native Veld', 'Improved Pasture', 'Crop Residue', 'Mixed']} value={params.forage || 'Native Veld'} onChange={update} />
            <Slider label="Crude Protein (%)" name="cp" min={7.0} max={16.0} step={0.5} value={params.cp} onChange={update} unit="%" />
          </div>
          <div className="input-group">
            <Slider label="TDN (%)" name="tdn" min={50} max={72} value={params.tdn} onChange={update} unit="%" />
            <Slider label="DMI (kg/day)" name="dmi" min={3.0} max={16.0} step={0.5} value={params.dmi} onChange={update} unit=" kg" />
          </div>

          <div className="form-section-title" style={{ marginTop: 20 }}>🌡️ Environment & Management</div>
          <div className="input-group">
            <Slider label="Avg Temperature (°C)" name="temp" min={14} max={32} value={params.temp} onChange={update} unit="°C" />
            <Slider label="Annual Rainfall (mm)" name="rain" min={300} max={700} value={params.rain} onChange={update} unit=" mm" />
          </div>
          <div className="input-group">
            <Slider label="Humidity (%)" name="humid" min={30} max={80} value={params.humid} onChange={update} unit="%" />
            <Select label="Veld Condition" name="veld" options={['Good', 'Fair', 'Poor']} value={params.veld} onChange={update} />
          </div>
          <div className="input-group">
            <Select label="Housing Type" name="housing" options={['Extensive', 'Semi-intensive', 'Intensive']} value={params.housing} onChange={update} />
            <Select label="Grazing System" name="grazing" options={['Rotational', 'Continuous', 'Strip']} value={params.grazing} onChange={update} />
          </div>

          <div className="form-section-title" style={{ marginTop: 20 }}>💉 Interventions</div>
          <div className="checkbox-group">
            {(['moringa', 'tannin', 'genetic', 'solar']).map(key => (
              <div
                key={key}
                className={`checkbox-card${params[key] ? ' checked' : ''}`}
                onClick={() => toggleInt(key)}
                style={params[key] ? { borderColor: INT_COLORS[key.charAt(0).toUpperCase() + key.slice(1)] || P.accent } : {}}
              >
                <div style={{ fontSize: '1.2rem' }}>{INT_ICONS[key.charAt(0).toUpperCase() + key.slice(1)]}</div>
                <div style={{ marginTop: 4 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel: results ── */}
        <div>
          {loading && !result && <div className="loading">Predicting…</div>}

          {result && (
            <>
              <div className="pred-result">
                <div className="pred-label">Predicted Net GHG Footprint</div>
                <div className="pred-value" style={{ color: ghgClassColor }}>
                  {result.prediction_ghg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '0.85rem', color: P.muted, marginTop: 4 }}>kg CO₂e / head / year</div>
                <div style={{ fontSize: '1.1rem', marginTop: 10, fontWeight: 600, color: ghgClassColor }}>
                  {ghgClassIcon} {result.ghg_class} GHG CLASS
                </div>
              </div>

              <div className="metric-grid metric-grid-2" style={{ marginTop: 12 }}>
                <div className="metric-card">
                  <div className="label">Without Interventions</div>
                  <div className="value" style={{ color: P.orange, fontSize: '1.2rem' }}>
                    {result.prediction_no_int.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                  </div>
                </div>
                <div className="metric-card">
                  <div className="label">Reduction from Interventions</div>
                  <div className="value" style={{ color: P.green, fontSize: '1.2rem' }}>
                    −{result.reduction.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                  </div>
                  <div className="sub">−{result.reduction_pct.toFixed(1)}%</div>
                </div>
              </div>

              {/* Waterfall */}
              <div className="chart-card" style={{ marginTop: 12 }}>
                <Plot
                  data={[{
                    type: 'waterfall',
                    x: wCats,
                    y: wVals,
                    measure: wMeasures,
                    connector: { line: { color: P.border } },
                    decreasing: { marker: { color: P.green } },
                    increasing: { marker: { color: P.orange } },
                    totals:     { marker: { color: ghgClassColor } },
                    text: wVals.map(v => Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })),
                    textfont: { family: 'JetBrains Mono, monospace', size: 10 },
                  }]}
                  layout={pl({
                    height: 300,
                    title: 'GHG Breakdown — Intervention Impact',
                    yaxis: { ...pl().yaxis, title: 'kg CO₂e/head/yr' },
                    xaxis: { ...pl().xaxis, tickfont: { size: 10 } },
                  })}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%' }}
                  useResizeHandler
                />
              </div>

              {/* Gauge */}
              <div className="chart-card" style={{ marginTop: 12 }}>
                <Plot
                  data={[{
                    type: 'indicator',
                    mode: 'gauge+number+delta',
                    value: result.prediction_ghg,
                    delta: {
                      reference: meanBase,
                      valueformat: '.0f',
                      decreasing: { color: P.green },
                      increasing: { color: P.orange },
                    },
                    number: { suffix: ' kg CO₂e', font: { family: 'JetBrains Mono, monospace', size: 22, color: ghgClassColor } },
                    gauge: {
                      axis: { range: [0, gaugeMax], tickcolor: P.muted },
                      bar:  { color: ghgClassColor, thickness: 0.25 },
                      steps: [
                        { range: [0, 2000],    color: P.green  + '30' },
                        { range: [2000, 3500], color: P.yellow + '30' },
                        { range: [3500, 6000], color: P.orange + '30' },
                      ],
                      threshold: { line: { color: P.red, width: 2 }, thickness: 0.75, value: meanBase },
                      bgcolor: P.bg,
                      bordercolor: P.border,
                    },
                    title: { text: 'vs Dataset Mean', font: { size: 12, color: P.muted } },
                  }]}
                  layout={{
                    paper_bgcolor: P.card,
                    font: { color: P.text, family: 'Sora, sans-serif' },
                    height: 240,
                    margin: { l: 20, r: 20, t: 30, b: 10 },
                  }}
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
