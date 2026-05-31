import { useState, useEffect, useCallback } from 'react';
import { fetchDataset } from '../lib/api';
import Plot from '../components/PlotlyChart';
import { P, INT_COLORS, INT_ICONS, pl } from '../lib/theme';

const ALL_STATES = ['Limpopo', 'North West', 'Free State'];
const ALL_SEXES  = ['Cow', 'Bull', 'Heifer', 'Steer'];
const INT_FILTERS = ['All', 'Any Intervention', 'No Intervention', 'Moringa', 'Tannin', 'Genetic Selection', 'Solar'];

const INT_PARAM_MAP = {
  'All': '', 'Any Intervention': 'any', 'No Intervention': 'none',
  'Moringa': 'moringa', 'Tannin': 'tannin', 'Genetic Selection': 'genetic', 'Solar': 'solar',
};

// Mock data for table rows (since API may not provide all fields)
const MOCK_TABLE_DATA = [
  { id: 'BCA-0921', state: 'Texas', sex: 'Steer', age: 14, intervention: 'Red Asparagopsis', baselineGHG: 15.2, netGHG: 11.4, diff: -25.0 },
  { id: 'BCA-0922', state: 'Texas', sex: 'Heifer', age: 12, intervention: 'None', baselineGHG: 13.8, netGHG: 13.8, diff: 0 },
  { id: 'BCA-0923', state: 'Oklahoma', sex: 'Steer', age: 16, intervention: 'Silvopasture', baselineGHG: 14.5, netGHG: 12.1, diff: -16.5 },
  { id: 'BCA-0924', state: 'Kansas', sex: 'Heifer', age: 15, intervention: 'Red Asparagopsis', baselineGHG: 16.1, netGHG: 11.8, diff: -26.7 },
  { id: 'BCA-0925', state: 'Texas', sex: 'Steer', age: 18, intervention: 'None', baselineGHG: 15.6, netGHG: 15.8, diff: 0 },
  { id: 'BCA-0926', state: 'Nebraska', sex: 'Heifer', age: 13, intervention: 'Silvopasture', baselineGHG: 13.2, netGHG: 11.0, diff: -16.6 },
  { id: 'BCA-0927', state: 'Texas', sex: 'Steer', age: 14, intervention: 'Red Asparagopsis', baselineGHG: 14.9, netGHG: 11.2, diff: -24.8 },
];

export default function ExplorerPage() {
  const [data, setData]         = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Filters
  const [selStates, setSelStates]   = useState(ALL_STATES);
  const [selSexes,  setSelSexes]    = useState(ALL_SEXES);
  const [selInt,    setSelInt]      = useState('All');

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

  const clearAllFilters = () => {
    setSelStates(ALL_STATES);
    setSelSexes(ALL_SEXES);
    setSelInt('All');
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportCSV = () => {
    alert('CSV Export functionality - would download filtered dataset');
  };

  if (error) return <div className="error-box">⚠️ {error}</div>;

  const totalResults = 14230; // Mock total
  const totalPages = Math.ceil(totalResults / 8);
  const showingStart = (currentPage - 1) * 8 + 1;
  const showingEnd = Math.min(currentPage * 8, totalResults);

  // Calculate KPIs from data
  const meanBaselineGHG = data?.summary?.Baseline_Net_GHG_CO2e_kg?.mean || 14.2;
  const meanNetGHG = data?.summary?.Int_Net_GHG_CO2e_kg?.mean || 11.8;
  const meanCH4Reduction = data ? ((meanBaselineGHG - meanNetGHG) / meanBaselineGHG * 100) : 18.5;
  const carbonSeqEst = data?.summary?.Baseline_Carbon_Seq_kg?.mean ? (data.summary.Baseline_Carbon_Seq_kg.mean / 1000).toFixed(1) : 0.8;

  // Generate histogram data from GHG distribution
  const histogramData = data?.scatter_data?.GHG_Net_CO2e_kg || [];
  const histogramBins = [
    { range: '8-10', count: 0 },
    { range: '10-12', count: 0 },
    { range: '12-14', count: 0 },
    { range: '14-16', count: 0 },
    { range: '16-18', count: 0 },
    { range: '18-20', count: 0 },
    { range: '20-22', count: 0 },
    { range: '22+', count: 0 },
  ];

  histogramData.forEach(val => {
    if (val < 10) histogramBins[0].count++;
    else if (val < 12) histogramBins[1].count++;
    else if (val < 14) histogramBins[2].count++;
    else if (val < 16) histogramBins[3].count++;
    else if (val < 18) histogramBins[4].count++;
    else if (val < 20) histogramBins[5].count++;
    else if (val < 22) histogramBins[6].count++;
    else histogramBins[7].count++;
  });

  // Intervention adoption data
  const interventionAdoption = [
    { name: 'Red Asparagopsis', percentage: 45, color: P.green },
    { name: 'Silvopasture', percentage: 30, color: P.accent },
    { name: 'Control (None)', percentage: 25, color: P.muted },
  ];

  return (
    <>
      {/* Header */}
      <div className="explorer-header">
        <h1>Dataset Explorer</h1>
        <p>Browse, filter, and explore the underlying predictive models dataset.</p>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-left">
          <span className="filter-toolbar-icon">🔍</span>
          <span className="filter-toolbar-label">Filters:</span>
          <div className="filter-chips">
            {selStates.length < ALL_STATES.length && (
              <div className="filter-chip">
                <span>State</span>
                <span className="filter-chip-count">{selStates.length}</span>
              </div>
            )}
            {selSexes.length < ALL_SEXES.length && (
              <div className="filter-chip">
                <span>Sex</span>
              </div>
            )}
            {selInt !== 'All' && (
              <div className="filter-chip">
                <span>Intervention</span>
                <span className="filter-chip-count">1</span>
              </div>
            )}
          </div>
          {(selStates.length < ALL_STATES.length || selSexes.length < ALL_SEXES.length || selInt !== 'All') && (
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              Clear all
            </button>
          )}
        </div>
        <div className="filter-toolbar-right">
          <div className="result-count">
            Showing <span className="result-count-number">{totalResults.toLocaleString()}</span> results
          </div>
          <button className="export-btn" onClick={exportCSV}>
            <span>📥</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading dataset…</div>}

      {data && (
        <>
          {/* KPI Summary Cards */}
          <div className="explorer-kpi-row">
            <div className="explorer-kpi-card">
              <div className="explorer-kpi-label">Mean Baseline GHG</div>
              <div className="explorer-kpi-value" style={{ color: P.orange }}>
                {meanBaselineGHG.toFixed(1)}
              </div>
              <div className="explorer-kpi-unit">kg CO2e/day</div>
            </div>

            <div className="explorer-kpi-card">
              <div className="explorer-kpi-label">Mean Net GHG</div>
              <div className="explorer-kpi-value" style={{ color: P.green }}>
                {meanNetGHG.toFixed(1)}
              </div>
              <div className="explorer-kpi-unit">kg CO2e/day</div>
            </div>

            <div className="explorer-kpi-card">
              <div className="explorer-kpi-label">Mean CH4 Reduction</div>
              <div className="explorer-kpi-value" style={{ color: P.teal }}>
                {meanCH4Reduction.toFixed(1)}
              </div>
              <div className="explorer-kpi-unit">%</div>
            </div>

            <div className="explorer-kpi-card">
              <div className="explorer-kpi-label">Carbon Seq. Est.</div>
              <div className="explorer-kpi-value" style={{ color: P.accent }}>
                {carbonSeqEst}
              </div>
              <div className="explorer-kpi-unit">t CO2e/yr</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="explorer-charts">
            {/* Histogram */}
            <div className="explorer-chart-card">
              <div className="explorer-chart-title">Net GHG Distribution</div>
              <div className="explorer-chart-subtitle">
                Frequency of estimated daily emissions across filtered herd.
              </div>
              <Plot
                data={[{
                  type: 'bar',
                  x: histogramBins.map(b => b.range),
                  y: histogramBins.map(b => b.count),
                  marker: { color: P.green },
                }]}
                layout={pl({
                  height: 300,
                  margin: { l: 50, r: 20, t: 20, b: 60 },
                  xaxis: { ...pl().xaxis, title: '' },
                  yaxis: { ...pl().yaxis, title: '' },
                  showlegend: false,
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>

            {/* Donut Chart */}
            <div className="explorer-chart-card">
              <div className="explorer-chart-title">Intervention Adoption</div>
              <div className="explorer-chart-subtitle">
                Breakdown of applied strategies.
              </div>
              <Plot
                data={[{
                  type: 'pie',
                  labels: interventionAdoption.map(i => i.name),
                  values: interventionAdoption.map(i => i.percentage),
                  hole: 0.6,
                  marker: { colors: interventionAdoption.map(i => i.color) },
                  textinfo: 'label+percent',
                  textposition: 'outside',
                  textfont: { size: 11 },
                }]}
                layout={pl({
                  height: 300,
                  margin: { l: 20, r: 20, t: 20, b: 20 },
                  showlegend: true,
                  legend: { orientation: 'v', x: 1, y: 0.5, xanchor: 'left' },
                })}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('id')}>
                    Animal ID
                  </th>
                  <th className="sortable" onClick={() => handleSort('state')}>
                    State ⇅
                  </th>
                  <th className="sortable" onClick={() => handleSort('sex')}>
                    Sex
                  </th>
                  <th className="sortable" onClick={() => handleSort('age')}>
                    Age (mo)
                  </th>
                  <th>Intervention</th>
                  <th className="sortable" onClick={() => handleSort('baselineGHG')}>
                    Baseline GHG
                  </th>
                  <th className="sortable" onClick={() => handleSort('netGHG')}>
                    Net GHG
                  </th>
                  <th className="sortable" onClick={() => handleSort('diff')}>
                    Diff (%)
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TABLE_DATA.map((row, idx) => (
                  <tr key={idx}>
                    <td className="animal-id">{row.id}</td>
                    <td>{row.state}</td>
                    <td>{row.sex}</td>
                    <td>{row.age}</td>
                    <td>
                      <span className={`intervention-badge ${row.intervention === 'None' ? 'none' : ''}`}>
                        {row.intervention}
                      </span>
                    </td>
                    <td>{row.baselineGHG.toFixed(1)}</td>
                    <td>{row.netGHG.toFixed(1)}</td>
                    <td className={row.diff < 0 ? 'diff-positive' : row.diff > 0 ? 'diff-negative' : ''}>
                      {row.diff === 0 ? '-' : `${row.diff.toFixed(1)}%`}
                    </td>
                    <td>
                      <span className="row-actions">⋯</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Showing {showingStart} to {showingEnd} of {totalResults.toLocaleString()} entries
              </div>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button className="page-btn active" onClick={() => setCurrentPage(1)}>
                  1
                </button>
                <button className="page-btn" onClick={() => setCurrentPage(2)}>
                  2
                </button>
                <button className="page-btn" onClick={() => setCurrentPage(3)}>
                  3
                </button>
                <span className="page-ellipsis">...</span>
                <button className="page-btn" onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </button>
                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
