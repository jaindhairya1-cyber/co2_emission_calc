import React, { useState, useEffect } from 'react';
import { ExternalLink, Zap, Flame, Truck, Box, Trash2, Sliders, BookOpen, Layers, Check, Calculator, RefreshCw, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BottomNavBar from '../components/BottomNavBar';
import { ELECTRICITY_FACTORS, FUEL_FACTORS, MATERIAL_FACTORS, WASTE_FACTORS } from '../data/emissionFactors';

export default function Screen11WhatIf() {
  const { appData, updateWhatIf, whatIfResult, footprint, navigateTo, goBack } = useApp();
  const { category, reductionPct } = appData.whatIf;

  // Same-place toggle mode: 'both' (unified overview) or switch tabs between 'roi' and 'factors'
  const [activeTab, setActiveTab] = useState('both'); // 'both' | 'roi' | 'factors'
  const [factorCategory, setFactorCategory] = useState('all'); // 'all' | 'electricity' | 'fuels' | 'transport' | 'materials' | 'waste'
  const [backendFactors, setBackendFactors] = useState(null);
  const [backendStatus, setBackendStatus] = useState('connecting');

  // Interactive Quick Factor Calculation Sandbox
  const [calcFactorType, setCalcFactorType] = useState('electricity');
  const [calcQuantity, setCalcQuantity] = useState(1000);

  const categories = [
    { id: 'Electricity', icon: Zap },
    { id: 'Fuel', icon: Flame },
    { id: 'Transport', icon: Truck }
  ];

  // Fetch static emission factors directly from Python FastAPI backend
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/emission-factors`)
      .then(res => res.json())
      .then(data => {
        setBackendFactors(data);
        setBackendStatus('connected');
      })
      .catch(() => {
        setBackendStatus('offline_local');
      });
  }, []);

  const handleSliderChange = (e) => {
    updateWhatIf({ reductionPct: Number(e.target.value) });
  };

  // Quick live factor emission calculation
  const getFactorEmissionPreview = () => {
    let factor = 0.710;
    let unit = 'kWh';
    if (calcFactorType === 'electricity') { factor = 0.710; unit = 'kWh'; }
    else if (calcFactorType === 'diesel') { factor = 2.687; unit = 'Litres'; }
    else if (calcFactorType === 'transport') { factor = 0.285; unit = 'km'; }
    else if (calcFactorType === 'steel') { factor = 1.820; unit = 'kg'; }
    else if (calcFactorType === 'waste') { factor = 0.580; unit = 'kg'; }
    const tco2e = (calcQuantity * factor) / 1000;
    return { factor, unit, tco2e: tco2e.toFixed(3) };
  };

  const preview = getFactorEmissionPreview();

  return (
    <div className="screen-container app-screen with-bottom-nav">
      {/* Top Header */}
      <div className="whatif-header-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="wizard-back-btn"
          onClick={goBack}
          aria-label="Back"
          title="Go back"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="whatif-title">ROI & Emission Factors</h1>
          <p className="screen-subtitle-muted">Simulate clean energy payback & inspect statutory factors in one place</p>
        </div>
      </div>

      {/* Unified Hub Navigation Switcher */}
      <div className="whatif-mode-switcher">
        <button
          type="button"
          className={`mode-pill ${activeTab === 'both' ? 'active' : ''}`}
          onClick={() => setActiveTab('both')}
        >
          <Layers size={14} />
          <span>Unified View</span>
        </button>
        <button
          type="button"
          className={`mode-pill ${activeTab === 'roi' ? 'active' : ''}`}
          onClick={() => setActiveTab('roi')}
        >
          <Sliders size={14} />
          <span>ROI Scenarios</span>
        </button>
        <button
          type="button"
          className={`mode-pill ${activeTab === 'factors' ? 'active' : ''}`}
          onClick={() => setActiveTab('factors')}
        >
          <BookOpen size={14} />
          <span>Emission Factors</span>
        </button>
      </div>

      <div className="whatif-scroll-content">
        {/* ===================================================================
            SECTION 1: WHAT-IF / ROI SCENARIOS
            =================================================================== */}
        {(activeTab === 'both' || activeTab === 'roi') && (
          <div className="hub-section-block">
            <div className="hub-section-header">
              <h2 className="hub-heading">ROI Decarbonization Simulation</h2>
              <span className="live-tag-pill">Live Predictor</span>
            </div>

            {/* Category Pills: Electricity | Fuel | Transport */}
            <div className="whatif-categories-row">
              {categories.map((cat) => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`whatif-cat-btn ${isActive ? 'active' : ''}`}
                    onClick={() => updateWhatIf({ category: cat.id })}
                  >
                    <span>{cat.id}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Slider Card */}
            <div className="whatif-slider-card">
              <div className="slider-label-heading">
                Reduce {category.toLowerCase()} use by <strong>{reductionPct}%</strong>
              </div>

              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={reductionPct}
                  onChange={handleSliderChange}
                  className="custom-range-slider"
                  id="whatif-slider"
                />
                <div className="slider-ticks-row">
                  <span>0%</span>
                  <span className="tick-active">{reductionPct}%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>

            {/* New Total Footprint Result Card */}
            <div className="whatif-result-card">
              <div className="result-label-text">New total footprint</div>
              <div className="result-metric-row">
                <div className="result-main-val">
                  {whatIfResult.newTotal.toFixed(1)} <span className="result-unit">tCO₂e</span>
                </div>
                <div className="result-reduction-badge">
                  <span>+ {whatIfResult.reductionTco2e.toFixed(1)} tCO₂e</span>
                  <span className="pct-badge-inner">(-{whatIfResult.pctReductionOverall}%)</span>
                </div>
              </div>
            </div>

            {/* Financial Impact (per year) Card */}
            <div className="whatif-financial-card">
              <h2 className="financial-heading">Financial impact (per year)</h2>
              <div className="financial-grid-3">
                <div className="financial-col">
                  <div className="fin-lbl">Investment</div>
                  <div className="fin-val">₹{whatIfResult.investment.toLocaleString()}</div>
                </div>
                <div className="financial-col">
                  <div className="fin-lbl">Annual saving</div>
                  <div className="fin-val">₹{whatIfResult.annualSaving.toLocaleString()}</div>
                </div>
                <div className="financial-col">
                  <div className="fin-lbl">Payback</div>
                  <div className="fin-val">{whatIfResult.paybackYears} years</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SECTION 2: STATUTORY EMISSION FACTORS (KEPT AT THE SAME PLACE)
            =================================================================== */}
        {(activeTab === 'both' || activeTab === 'factors') && (
          <div className="hub-section-block mt-4">
            <div className="hub-section-header">
              <h2 className="hub-heading">Official Emission Factors Library</h2>
              <span className={`status-badge-mini ${backendStatus === 'connected' ? 'status-online' : 'status-cached'}`}>
                {backendStatus === 'connected' ? 'FastAPI Linked' : 'CEA FY24-25'}
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="factor-domain-filter-row">
              {['all', 'electricity', 'fuels', 'transport', 'materials', 'waste'].map((fcat) => (
                <button
                  key={fcat}
                  type="button"
                  className={`factor-filter-btn ${factorCategory === fcat ? 'active' : ''}`}
                  onClick={() => setFactorCategory(fcat)}
                >
                  {fcat.charAt(0).toUpperCase() + fcat.slice(1)}
                </button>
              ))}
            </div>

            {/* Factor Cards Table */}
            <div className="factors-unified-grid">
              {(factorCategory === 'all' || factorCategory === 'electricity') && (
                <div className="factor-item-card factor-card-highlight">
                  <div className="factor-card-title-row">
                    <span className="factor-card-title">Grid electricity (India)</span>
                    <span className="factor-scope-tag">Scope 2</span>
                  </div>
                  <div className="factor-card-badge">0.710 kg CO₂e/kWh</div>
                  <div className="factor-card-meta">
                    Standard: CEA (Central Electricity Authority, FY 2024-25, v21.0) • Avg industrial tariff: ₹8.5/kWh
                  </div>
                </div>
              )}

              {(factorCategory === 'all' || factorCategory === 'fuels') && (
                <>
                  <div className="factor-item-card">
                    <div className="factor-card-title-row">
                      <span className="factor-card-title">Diesel (Commercial / High Speed)</span>
                      <span className="factor-scope-tag">Scope 1</span>
                    </div>
                    <div className="factor-card-badge">2.687 kg CO₂e/L</div>
                    <div className="factor-card-meta">IPCC / Ministry of Petroleum & Natural Gas • ₹92.5/L</div>
                  </div>
                  <div className="factor-item-card">
                    <div className="factor-card-title-row">
                      <span className="factor-card-title">Petrol / Gasoline</span>
                      <span className="factor-scope-tag">Scope 1</span>
                    </div>
                    <div className="factor-card-badge">2.314 kg CO₂e/L</div>
                    <div className="factor-card-meta">GHG Corporate Standard • ₹104.0/L</div>
                  </div>
                </>
              )}

              {(factorCategory === 'all' || factorCategory === 'transport') && (
                <div className="factor-item-card">
                  <div className="factor-card-title-row">
                    <span className="factor-card-title">Freight Logistics (LCV & Trucks)</span>
                    <span className="factor-scope-tag">Scope 3</span>
                  </div>
                  <div className="factor-card-badge">0.285 - 0.892 kg CO₂e/km</div>
                  <div className="factor-card-meta">DEFRA & ARAI Commercial Vehicle Freight Emission Standard</div>
                </div>
              )}

              {(factorCategory === 'all' || factorCategory === 'materials') && (
                <div className="factor-item-card">
                  <div className="factor-card-title-row">
                    <span className="factor-card-title">Virgin Steel & Sheet Metal</span>
                    <span className="factor-scope-tag">Scope 3</span>
                  </div>
                  <div className="factor-card-badge">1.820 kg CO₂e/kg</div>
                  <div className="factor-card-meta">WorldSteel Association Life Cycle Assessment 2024</div>
                </div>
              )}

              {(factorCategory === 'all' || factorCategory === 'waste') && (
                <div className="factor-item-card">
                  <div className="factor-card-title-row">
                    <span className="factor-card-title">General Landfill & Process Waste</span>
                    <span className="factor-scope-tag">Scope 3</span>
                  </div>
                  <div className="factor-card-badge">0.580 kg CO₂e/kg</div>
                  <div className="factor-card-meta">CPCB (Central Pollution Control Board) MSW Baseline</div>
                </div>
              )}
            </div>

            {/* Quick Interactive Factor Calculation Sandbox right here */}
            <div className="quick-factor-calc-box">
              <div className="sandbox-header">
                <Calculator size={16} className="text-emerald" />
                <span className="sandbox-title">Instant Factor Emission Calculator</span>
              </div>
              <div className="sandbox-controls-row">
                <select
                  className="sandbox-select"
                  value={calcFactorType}
                  onChange={(e) => setCalcFactorType(e.target.value)}
                >
                  <option value="electricity">Electricity (0.710 kg/kWh)</option>
                  <option value="diesel">Diesel (2.687 kg/L)</option>
                  <option value="transport">Freight LCV (0.285 kg/km)</option>
                  <option value="steel">Steel (1.820 kg/kg)</option>
                  <option value="waste">General Waste (0.580 kg/kg)</option>
                </select>
                <input
                  type="number"
                  className="sandbox-input"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Number(e.target.value))}
                  placeholder="Quantity"
                />
              </div>
              <div className="sandbox-result-strip">
                <span>{calcQuantity.toLocaleString()} {preview.unit} × {preview.factor} factor = </span>
                <strong className="text-forest"> {preview.tco2e} tCO₂e</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavBar activeTab="whatif" />
    </div>
  );
}
