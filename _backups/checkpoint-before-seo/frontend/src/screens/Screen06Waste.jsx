import React from 'react';
import { ChevronLeft, Trash2, ArrowRight, Zap, Flame, Truck, Box } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BillUploadReview from '../components/BillUploadReview';

export default function Screen06Waste() {
  const { appData, tempId, updateBusiness, updateWaste, navigateTo, goBack } = useApp();
  const wasteList = appData.waste || [
    { type: '', quantity: '', unit: '', period: '', sourceType: 'Estimated' }
  ];

  const wasteTypes = [
    'General waste',
    'Hazardous waste',
    'Recyclable plastic',
    'Metal scrap',
    'Organic waste'
  ];

  const handleWasteChange = (index, field, value) => {
    const updated = [...wasteList];
    updated[index] = { ...updated[index], [field]: value };
    updateWaste(updated);
  };

  const handleNext = (e) => {
    e?.preventDefault();
    navigateTo(7); // Review & Calculate
  };

  const handleBillConfirmed = ({ records, fileName }) => {
    const next = [...wasteList];
    records.forEach((record, index) => {
      const value = {
        id: index === 0 ? (next[0]?.id || `waste-${Date.now()}`) : `waste-${Date.now()}-${index}`,
        type: record.type,
        quantity: record.quantity,
        unit: record.unit,
        period: record.period,
        sourceType: 'Actual (from confirmed bill)',
        billFileName: fileName
      };
      if (index === 0) next[0] = { ...next[0], ...value };
      else next.push(value);
    });
    updateWaste(next);
  };

  return (
    <div className="screen-container form-wizard-screen">
      <div className="wizard-top-nav">
        <button
          type="button"
          className="wizard-back-btn"
          onClick={goBack}
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="step-counter">Waste Domain</span>
      </div>

      <div className="wizard-header">
        <h1 className="wizard-title">Waste Generation</h1>
        <p className="wizard-subtitle">
          Record factory scrap, packaging waste, and hazardous disposal.
        </p>
      </div>

      {/* Category Domain Selector Bar */}
      <div className="activity-category-row">
        {[
          { id: 'elec', label: 'Electricity', icon: Zap, screen: 4 },
          { id: 'fuel', label: 'Fuel', icon: Flame, screen: 5 },
          { id: 'trans', label: 'Transport', icon: Truck, screen: 15 },
          { id: 'mat', label: 'Materials', icon: Box, screen: 6 },
          { id: 'waste', label: 'Waste', icon: Trash2, screen: 16, active: true }
        ].map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              className={`activity-cat-pill ${c.active ? 'active' : ''}`}
              onClick={() => navigateTo(c.screen)}
            >
              <div className="cat-icon-circle">
                <Icon size={16} />
              </div>
              <span className="cat-text">{c.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleNext} className="wizard-form-body">
        {wasteList.map((waste, idx) => (
          <div key={idx} className="input-card-section">
            <h2 className="card-section-title">Waste Profile</h2>

            <div className="form-group">
              <label className="form-label" htmlFor={`waste-type-${idx}`}>Waste stream</label>
              <select
                id={`waste-type-${idx}`}
                className="form-select"
                value={waste.type || ''}
                onChange={(e) => handleWasteChange(idx, 'type', e.target.value)}
                required
              >
                <option value="" disabled>Select waste stream</option>
                {wasteTypes.map((wt) => (
                  <option key={wt} value={wt}>{wt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`waste-qty-${idx}`}>Quantity</label>
              <div className="input-group-unit">
                <input
                  id={`waste-qty-${idx}`}
                  type="number"
                  className="form-input unit-input"
                  value={waste.quantity ?? ''}
                  onChange={(e) => handleWasteChange(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter waste quantity generated"
                  required
                />
                <select
                  id={`waste-unit-${idx}`}
                  className="unit-select"
                  value={waste.unit || ''}
                  onChange={(e) => handleWasteChange(idx, 'unit', e.target.value)}
                  required
                >
                  <option value="" disabled>Select unit</option>
                  <option value="kg">kg</option>
                  <option value="tonnes">tonnes</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`waste-period-${idx}`}>Period</label>
              <select
                id={`waste-period-${idx}`}
                className="form-select"
                value={waste.period || ''}
                onChange={(e) => handleWasteChange(idx, 'period', e.target.value)}
                required
              >
                <option value="" disabled>Select billing period</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name={`waste-source-${idx}`}
                  value="Actual (from manifests)"
                  checked={waste.sourceType === 'Actual (from manifests)'}
                  onChange={(e) => handleWasteChange(idx, 'sourceType', e.target.value)}
                />
                <span className="radio-text">Actual (from manifests)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name={`waste-source-${idx}`}
                  value="Estimated"
                  checked={waste.sourceType === 'Estimated'}
                  onChange={(e) => handleWasteChange(idx, 'sourceType', e.target.value)}
                />
                <span className="radio-text">Estimated</span>
              </label>
            </div>

            {idx === 0 && (
              <BillUploadReview
                category="Waste"
                tempId={tempId}
                appData={appData}
                onBusinessSuggestion={(name) => {
                  if (!appData.business.name?.trim()) updateBusiness({ name });
                }}
                onConfirmed={handleBillConfirmed}
              />
            )}
          </div>
        ))}

        <div className="wizard-footer-nav">
          <button
            type="button"
            className="btn-wizard-back"
            onClick={() => navigateTo(0)} // Back to domain chooser
          >
            Domains
          </button>
          <button
            type="submit"
            id="btn-waste-next"
            className="btn-wizard-next btn-calculate-action"
          >
            <span>Review & Calculate</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
