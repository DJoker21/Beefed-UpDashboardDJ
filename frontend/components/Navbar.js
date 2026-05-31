import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV = [
  { href: '/',              label: '🏠 Overview' },
  { href: '/models',        label: '🤖 ML Model Metrics' },
  { href: '/features',      label: '📊 Feature Importance' },
  { href: '/predict',       label: '🔮 Predict GHG Footprint' },
  { href: '/interventions', label: '💉 Intervention Analysis' },
  { href: '/benefits',      label: '💰 Farmer Benefits' },
  { href: '/explorer',      label: '🗃️ Dataset Explorer' },
];

export default function Navbar({ sidebarData }) {
  const { pathname } = useRouter();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="emoji">🐄</div>
        <div className="title">Bonsmara GHG</div>
        <div className="sub">GREENHOUSE FOOTPRINT PREDICTION</div>
      </div>

      <ul className="nav-list">
        {NAV.map(({ href, label }) => (
          <li key={href} className="nav-item">
            <Link href={href} className={`nav-link${pathname === href ? ' active' : ''}`}>
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {sidebarData && (
        <>
          <div className="sidebar-stats">
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>Dataset</span>
            <br />
            {sidebarData.n_total} animals · {sidebarData.n_states} states
            <br /><br />
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Models Trained</span>
            <br />6 ML algorithms
            <br /><br />
            <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Best Model</span>
            <br />Gradient Boosting
            <br />R² = {sidebarData.models_summary?.['Gradient Boosting']?.reg_r2}
            <br /><br />
            <span style={{ color: 'var(--purple)', fontWeight: 600 }}>Interventions</span>
            <br />Moringa · Tannin
            <br />Genetics · Solar
          </div>

          <hr style={{ margin: '0 16px', borderColor: 'var(--border)' }} />

          <div className="sidebar-states" style={{ paddingTop: 12 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
              SA Agro-Ecological States
            </div>
            {Object.entries(sidebarData.states || {}).map(([state, count]) => (
              <div key={state} className="state-row">
                <span style={{ color: 'var(--text)' }}>{state}</span>
                <span style={{ color: 'var(--accent)' }}>
                  {count} ({((count / sidebarData.n_total) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}
