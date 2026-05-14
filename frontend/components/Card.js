/**
 * Reusable KPI metric card.
 * Props: label, value, sub, color (CSS color or var())
 */
export default function Card({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="metric-card">
      <div className="accent-bar" style={{ background: color }} />
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
