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
          <span style={{ color: '#3FB950' }}>RF</span> ·{' '}
          <span style={{ color: '#2EA043' }}>GradBoost</span> ·{' '}
          <span style={{ color: '#E3B341' }}>Ridge</span> ·{' '}
          <span style={{ color: '#BC8CFF' }}>DNN</span> ·{' '}
          <span style={{ color: '#39D0D8' }}>CNN</span> ·{' '}
          <span style={{ color: '#F78166' }}>RNN</span>
          <br />South Africa · Limpopo · North West · Free State · IPCC Tier 2 Methodology
        </footer>
      </main>
    </div>
  );
}
