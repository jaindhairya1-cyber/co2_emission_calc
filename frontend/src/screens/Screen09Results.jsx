import React, { useState } from 'react';
import { ChevronDown, Lightbulb, TrendingDown, ArrowUpRight, Info, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BottomNavBar from '../components/BottomNavBar';
import CalculationPanel from '../components/CalculationPanel';

export default function Screen09Results() {
  const { footprint, navigateTo } = useApp();
  const [period, setPeriod] = useState('This year');
  const [activeSubTab, setActiveSubTab] = useState('Overview');
  const [selectedSegment, setSelectedSegment] = useState(null);

  // Derive live segments dynamically from footprint breakdownSources
  const rawSegments = (footprint.breakdownSources && footprint.breakdownSources.length > 0)
    ? footprint.breakdownSources
    : [
        { name: 'Electricity', percentage: 40, color: '#0284C7', value: 51.4, scope: 'Scope 2', meaning: 'Factory machinery & lighting', tip: 'Rooftop solar can cut this by up to 35%.' },
        { name: 'Transport', percentage: 27, color: '#3B82F6', value: 34.7, scope: 'Scope 3', meaning: 'Dispatch delivery & freight logistics', tip: 'Route optimization can save ~18% in fuel.' },
        { name: 'Materials', percentage: 21, color: '#F59E0B', value: 27.0, scope: 'Scope 3', meaning: 'Embodied carbon in purchased materials', tip: 'Low-carbon suppliers reduce this score.' },
        { name: 'Fuel', percentage: 9, color: '#F43F5E', value: 11.6, scope: 'Scope 1', meaning: 'Diesel generators & heating boilers', tip: 'Maintain DG sets and boiler efficiency.' },
        { name: 'Waste', percentage: 3, color: '#10B981', value: 3.7, scope: 'Scope 3', meaning: 'Process waste & municipal landfill', tip: 'Segregate recyclable scrap to offset carbon.' }
      ];

  const segments = rawSegments.map(s => ({
    ...s,
    tco2e: s.value !== undefined ? s.value : (s.tco2e !== undefined ? s.tco2e : 0),
    tip: s.tip || (s.name === 'Electricity' ? 'Rooftop solar can cut this by up to 35%.' : s.name === 'Transport' ? 'Route optimization can save ~18% in fuel.' : s.name === 'Fuel' ? 'Maintain DG sets and boiler efficiency.' : s.name === 'Materials' ? 'Source certified low-carbon suppliers.' : 'Segregate recyclable scrap to generate revenue.')
  }));

  const currentSegment = (selectedSegment && segments.find(s => s.name === selectedSegment.name)) || segments[0] || {};

  // Largest emission driver for intelligent insight card
  const largestSegment = segments.length > 0
    ? segments.reduce((max, s) => ((s.tco2e || 0) > (max?.tco2e || 0) ? s : max), segments[0])
    : null;

  // SVG Donut calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="screen-container app-screen with-bottom-nav">
      {/* Top Header */}
      <div className="results-top-header">
        <div>
          <h1 className="results-title">Results</h1>
          <p className="screen-subtitle-muted">Easy-to-understand carbon footprint breakdown</p>
        </div>

        <div className="period-dropdown-box">
          <select
            className="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="This year">This year</option>
            <option value="Last 6 months">Last 6 months</option>
            <option value="FY 2024-25">FY 2024-25</option>
            <option value="All time">All time</option>
          </select>
          <ChevronDown size={14} className="trailing-chevron" />
        </div>
      </div>

      {/* Subtabs: Overview | Breakdown | Trends */}
      <div className="results-subtabs">
        {['Overview', 'Breakdown', 'Trends', 'Sources & AI'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`subtab-pill ${activeSubTab === tab ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="results-scroll-content">
        {activeSubTab === 'Overview' && (
          <>
            {/* Intuitive Donut Chart Card */}
            <div className="donut-chart-card">
              <div className="donut-visual-container">
                <svg width="160" height="160" viewBox="0 0 160 160" className="donut-svg">
                  <g transform="rotate(-90 80 80)">
                    {segments.map((seg) => {
                      const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedOffset;
                      accumulatedOffset += (seg.percentage / 100) * circumference;
                      const isSelected = currentSegment.name === seg.name;

                      return (
                        <circle
                          key={seg.name}
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth={isSelected ? "23" : "19"}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="donut-segment"
                          onClick={() => setSelectedSegment(seg)}
                          style={{
                            cursor: 'pointer',
                            transition: 'stroke-width 0.2s ease, opacity 0.2s',
                            opacity: isSelected ? 1 : 0.85
                          }}
                        />
                      );
                    })}
                  </g>
                  {/* Center Label */}
                  <text x="80" y="74" textAnchor="middle" className="donut-center-val">
                    {currentSegment ? `${currentSegment.percentage}%` : footprint.total.toFixed(1)}
                  </text>
                  <text x="80" y="93" textAnchor="middle" className="donut-center-sub">
                    {currentSegment ? currentSegment.name : 'tCO₂e'}
                  </text>
                </svg>
              </div>

              {/* Legend with direct click selection */}
              <div className="donut-legend-list">
                {segments.map((seg) => {
                  const isSelected = currentSegment.name === seg.name;
                  return (
                    <div
                      key={seg.name}
                      className={`legend-item-row ${isSelected ? 'highlighted-row' : ''}`}
                      onClick={() => setSelectedSegment(seg)}
                      title={`Click to inspect ${seg.name}`}
                    >
                      <div className="legend-indicator" style={{ backgroundColor: seg.color }}></div>
                      <span className="legend-name">{seg.name}</span>
                      <span className="legend-pct">{seg.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plain English "What This Means" Explainer Card */}
            <div className="easy-explainer-card">
              <div className="explainer-card-header">
                <div className="explainer-tag-badge" style={{ backgroundColor: `${currentSegment.color}20`, color: currentSegment.color }}>
                  {currentSegment.name} • {currentSegment.percentage}% ({currentSegment.tco2e} tCO₂e)
                </div>
                <span className="explainer-scope-label">{currentSegment.scope}</span>
              </div>
              <p className="explainer-meaning-text">{currentSegment.meaning}</p>
              <div className="explainer-tip-row">
                <CheckCircle2 size={15} className="text-emerald flex-shrink-0" />
                <span className="explainer-tip-text"><strong>Smart Tip:</strong> {currentSegment.tip}</span>
              </div>
            </div>

            {/* Summary Highlight Box - Dynamically points to largest emission driver */}
            {largestSegment && (
              <div className="largest-source-card">
                <div className="insight-icon-circle">
                  <Lightbulb size={20} className="text-emerald" />
                </div>
                <div className="insight-text-area">
                  <div className="insight-tag">Key Opportunity</div>
                  <div className="insight-headline">
                    {largestSegment.name} ({largestSegment.percentage}% of emissions)
                  </div>
                  <div className="insight-subtext">
                    {largestSegment.name === 'Electricity'
                      ? 'Switching to rooftop solar or upgrading factory lighting delivers the fastest payback (~1.7 to 3.7 years).'
                      : largestSegment.name === 'Fuel'
                      ? 'Boiler economizers or DG fuel management deliver immediate high-impact Scope 1 operational cost reductions.'
                      : largestSegment.name === 'Transport'
                      ? 'Dispatch route consolidation and fleet efficiency directly curb high logistics diesel expenditure.'
                      : largestSegment.name === 'Materials'
                      ? 'Procuring low-carbon or recycled raw material inputs significantly lowers your Scope 3 embodied carbon.'
                      : 'Segregating high-grade recyclable scrap turns waste handling into circular revenue.'}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeSubTab === 'Sources & AI' && <CalculationPanel />}

        {activeSubTab === 'Breakdown' && (
          <div className="breakdown-detailed-list">
            <div className="breakdown-intro-note">
              Total footprint is <strong>{footprint.total.toFixed(1)} tCO₂e</strong>. Here is how every operational component compares:
            </div>
            {segments.map((seg) => (
              <div key={seg.name} className="breakdown-card-item">
                <div className="breakdown-item-top">
                  <div className="breakdown-item-title-wrap">
                    <div className="legend-indicator" style={{ backgroundColor: seg.color }}></div>
                    <span className="breakdown-item-name">{seg.name}</span>
                    <span className="breakdown-item-scope">{seg.scope}</span>
                  </div>
                  <div className="breakdown-item-metrics">
                    <strong>{seg.tco2e} tCO₂e</strong>
                    <span className="breakdown-pct-tag">({seg.percentage}%)</span>
                  </div>
                </div>
                {/* Visual Proportion Bar */}
                <div className="breakdown-progress-track">
                  <div
                    className="breakdown-progress-fill"
                    style={{ width: `${seg.percentage}%`, backgroundColor: seg.color }}
                  ></div>
                </div>
                <div className="breakdown-item-sub">{seg.meaning}</div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'Trends' && (
          <div className="trend-chart-card">
            <div className="trend-header">
              <h2 className="trend-title">Monthly emissions (tCO₂e)</h2>
              <span className="trend-sub-note">Apr 2026 - Oct 2026</span>
            </div>

            <div className="line-chart-wrapper">
              <svg width="100%" height="140" viewBox="0 0 320 140" className="line-chart-svg">
                {/* Y Axis Gridlines */}
                <line x1="28" y1="20" x2="310" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
                <text x="20" y="24" textAnchor="end" className="chart-axis-text">30</text>

                <line x1="28" y1="50" x2="310" y2="50" stroke="#E2E8F0" strokeDasharray="3 3" />
                <text x="20" y="54" textAnchor="end" className="chart-axis-text">20</text>

                <line x1="28" y1="80" x2="310" y2="80" stroke="#E2E8F0" strokeDasharray="3 3" />
                <text x="20" y="84" textAnchor="end" className="chart-axis-text">10</text>

                <line x1="28" y1="110" x2="310" y2="110" stroke="#CBD5E1" />
                <text x="20" y="114" textAnchor="end" className="chart-axis-text">0</text>

                {/* Area fill */}
                <path
                  d="M 40 55 Q 85 45, 130 38 T 220 58 T 300 70 L 300 110 L 40 110 Z"
                  fill="url(#greenGradientRes)"
                  opacity="0.25"
                />

                {/* Line path */}
                <path
                  d="M 40 55 Q 85 45, 130 38 T 220 58 T 300 70"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data points */}
                {[
                  { x: 40, y: 55, m: 'Apr', v: '18.2' },
                  { x: 83, y: 49, m: 'May', v: '19.8' },
                  { x: 126, y: 44, m: 'Jun', v: '21.4' },
                  { x: 169, y: 48, m: 'Jul', v: '20.1' },
                  { x: 212, y: 56, m: 'Aug', v: '17.5' },
                  { x: 255, y: 62, m: 'Sep', v: '16.3' },
                  { x: 298, y: 68, m: 'Oct', v: '15.1' }
                ].map((pt) => (
                  <g key={pt.m}>
                    <circle cx={pt.x} cy={pt.y} r="3.5" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2" />
                    <text x={pt.x} y="124" textAnchor="middle" className="chart-axis-text">{pt.m}</text>
                  </g>
                ))}

                <defs>
                  <linearGradient id="greenGradientRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="trend-plain-explanation">
              <strong>Seasonal Trend Insight:</strong> Peak emissions occur during May–July due to shopfloor air cooling and higher monsoon production runs, tapering down into autumn.
            </div>
          </div>
        )}
      </div>

      <BottomNavBar activeTab="results" />
    </div>
  );
}
