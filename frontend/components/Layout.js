import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { fetchOverview } from '../lib/api';

export default function Layout({ children }) {
  const [sidebarData, setSidebarData] = useState(null);

  useEffect(() => {
    fetchOverview()
      .then(d => setSidebarData(d))
      .catch(() => {});
  }, []);

  return (
    <div className="layout">
      <Navbar sidebarData={sidebarData} />
      <main className="main-content">
        {children}
        <footer className="footer">
          🐄 Bonsmara GHG Prediction Dashboard ·{' '}
          <span style={{ color: 'var(--green)' }}>RF</span> ·{' '}
          <span style={{ color: 'var(--accent)' }}>GradBoost</span> ·{' '}
          <span style={{ color: 'var(--yellow)' }}>Ridge</span> ·{' '}
          <span style={{ color: 'var(--purple)' }}>DNN</span> ·{' '}
          <span style={{ color: 'var(--teal)' }}>CNN</span> ·{' '}
          <span style={{ color: 'var(--orange)' }}>RNN</span>
          <br />South Africa · Limpopo · North West · Free State · IPCC Tier 2 Methodology
        </footer>
      </main>
    </div>
  );
}
